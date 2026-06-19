import db from '../db/init';
import { Clothing, ClothingStatus, ClothingType, CreateClothingRequest, StatusRecord, ClothingSearchParams, PaymentMethod, PaymentDetail, UpdateClothingRequest, DashboardStats, ExceptionType, ExceptionRequest, RefundRequest, OperationRecord, OperationType, DailyReconciliation, PAYMENT_METHOD_LABELS } from '../../shared/types';
import { generateBarcode, formatDate } from '../utils/barcode';
import { updateCustomerStats } from './customer';

function rowToClothing(row: any): Clothing {
  let paymentDetails: PaymentDetail[] | undefined;
  if (row.payment_details) {
    try {
      paymentDetails = JSON.parse(row.payment_details);
    } catch (e) {
      paymentDetails = undefined;
    }
  }

  let operationHistory: OperationRecord[] = [];
  if (row.operation_history) {
    try {
      operationHistory = JSON.parse(row.operation_history);
    } catch (e) {
      operationHistory = [];
    }
  }

  return {
    id: row.id,
    barcode: row.barcode,
    clothingType: row.clothing_type as ClothingType,
    customerPhone: row.customer_phone,
    customerName: row.customer_name || undefined,
    price: row.price,
    receiveDate: row.receive_date,
    expectedPickupDate: row.expected_pickup_date,
    actualPickupDate: row.actual_pickup_date || undefined,
    status: row.status as ClothingStatus,
    remark: row.remark || undefined,
    paymentMethod: (row.payment_method as PaymentMethod) || 'none',
    paymentDetails,
    exceptionType: (row.exception_type as ExceptionType) || 'none',
    exceptionRemark: row.exception_remark || undefined,
    statusHistory: JSON.parse(row.status_history),
    operationHistory,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function addOperationRecord(clothing: Clothing, type: OperationType, opts: {
  before?: string | number;
  after?: string | number;
  remark?: string;
  operator?: string;
}): OperationRecord[] {
  const record: OperationRecord = {
    type,
    timestamp: new Date().toISOString(),
    ...opts,
  };
  return [...clothing.operationHistory, record];
}

export function createClothing(data: CreateClothingRequest): Clothing {
  const receiveDate = formatDate(new Date());
  const initialHistory: StatusRecord[] = [{
    status: 'received',
    timestamp: new Date().toISOString(),
  }];

  const initialOperations: OperationRecord[] = [{
    type: 'create',
    timestamp: new Date().toISOString(),
  }];

  const insertStmt = db.prepare(`
    INSERT INTO clothing (
      barcode, clothing_type, customer_phone, customer_name, price,
      receive_date, expected_pickup_date, status, remark, status_history, payment_method, operation_history
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let lastError: any = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const barcode = generateBarcode();
      const result = insertStmt.run(
        barcode,
        data.clothingType,
        data.customerPhone,
        data.customerName || null,
        data.price,
        receiveDate,
        data.expectedPickupDate,
        'received',
        data.remark || null,
        JSON.stringify(initialHistory),
        'none',
        JSON.stringify(initialOperations)
      );

      const clothing = getClothingById(result.lastInsertRowid as number)!;
      
      try {
        updateCustomerStats(data.customerPhone);
      } catch (e) {
        console.error('更新客户统计失败', e);
      }

      return clothing;
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        lastError = e;
        continue;
      }
      throw e;
    }
  }
  
  throw lastError || new Error('创建订单失败，重试次数已用完');
}

export function updateClothing(id: number, data: UpdateClothingRequest): Clothing | null {
  const existing = getClothingById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: any[] = [];
  let operationHistory = existing.operationHistory;

  if (data.expectedPickupDate !== undefined && data.expectedPickupDate !== existing.expectedPickupDate) {
    fields.push('expected_pickup_date = ?');
    values.push(data.expectedPickupDate);
    operationHistory = addOperationRecord(existing, 'date_change', {
      before: existing.expectedPickupDate,
      after: data.expectedPickupDate,
      operator: data.operator,
    });
  }
  if (data.remark !== undefined && data.remark !== existing.remark) {
    fields.push('remark = ?');
    values.push(data.remark || null);
    operationHistory = addOperationRecord({ ...existing, operationHistory }, 'remark_change', {
      before: existing.remark || '',
      after: data.remark || '',
      operator: data.operator,
    });
  }
  if (data.price !== undefined && data.price !== existing.price) {
    fields.push('price = ?');
    values.push(data.price);
    operationHistory = addOperationRecord({ ...existing, operationHistory }, 'price_change', {
      before: existing.price,
      after: data.price,
      operator: data.operator,
    });
  }

  if (fields.length === 0) return existing;

  fields.push('operation_history = ?');
  values.push(JSON.stringify(operationHistory));
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const stmt = db.prepare(`
    UPDATE clothing 
    SET ${fields.join(', ')}
    WHERE id = ?
  `);
  stmt.run(...values);

  const updated = getClothingById(id);
  
  if (updated && (data.price !== undefined || data.expectedPickupDate !== undefined)) {
    try {
      updateCustomerStats(updated.customerPhone);
    } catch (e) {
      console.error('更新客户统计失败', e);
    }
  }

  return updated;
}

export function getClothingById(id: number): Clothing | null {
  const stmt = db.prepare('SELECT * FROM clothing WHERE id = ?');
  const row = stmt.get(id);
  return row ? rowToClothing(row) : null;
}

export function getClothingByBarcode(barcode: string): Clothing | null {
  const stmt = db.prepare('SELECT * FROM clothing WHERE barcode = ?');
  const row = stmt.get(barcode);
  return row ? rowToClothing(row) : null;
}

export function getClothingList(
  status?: ClothingStatus,
  page: number = 1,
  pageSize: number = 50
): { list: Clothing[]; total: number } {
  let whereClause = '';
  const params: any[] = [];

  if (status) {
    whereClause = 'WHERE status = ?';
    params.push(status);
  }

  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM clothing ${whereClause}`);
  const { count } = countStmt.get(...params) as { count: number };

  const offset = (page - 1) * pageSize;
  params.push(pageSize, offset);

  const listStmt = db.prepare(`
    SELECT * FROM clothing ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  const rows = listStmt.all(...params);

  return {
    list: rows.map(rowToClothing),
    total: count,
  };
}

export function searchClothing(params: ClothingSearchParams): { list: Clothing[]; total: number } {
  const conditions: string[] = [];
  const queryParams: any[] = [];

  if (params.status) {
    conditions.push('status = ?');
    queryParams.push(params.status);
  }

  if (params.clothingType) {
    conditions.push('clothing_type = ?');
    queryParams.push(params.clothingType);
  }

  if (params.phone) {
    conditions.push('customer_phone LIKE ?');
    queryParams.push(`%${params.phone}%`);
  }

  if (params.barcode) {
    conditions.push('barcode LIKE ?');
    queryParams.push(`%${params.barcode}%`);
  }

  if (params.startDate) {
    conditions.push('receive_date >= ?');
    queryParams.push(params.startDate);
  }

  if (params.endDate) {
    conditions.push('receive_date <= ?');
    queryParams.push(params.endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM clothing ${whereClause}`);
  const { count } = countStmt.get(...queryParams) as { count: number };

  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const offset = (page - 1) * pageSize;
  queryParams.push(pageSize, offset);

  const listStmt = db.prepare(`
    SELECT * FROM clothing ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  const rows = listStmt.all(...queryParams);

  return {
    list: rows.map(rowToClothing),
    total: count,
  };
}

export function updateClothingStatus(id: number, newStatus: ClothingStatus): Clothing | null {
  const clothing = getClothingById(id);
  if (!clothing) return null;

  const newHistory: StatusRecord[] = [
    ...clothing.statusHistory,
    {
      status: newStatus,
      timestamp: new Date().toISOString(),
    },
  ];

  const updateData: any = {
    status: newStatus,
    statusHistory: JSON.stringify(newHistory),
  };

  if (newStatus === 'completed') {
    updateData.actualPickupDate = formatDate(new Date());
  }

  const stmt = db.prepare(`
    UPDATE clothing 
    SET status = ?, status_history = ?, actual_pickup_date = COALESCE(?, actual_pickup_date), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    updateData.status,
    updateData.statusHistory,
    updateData.actualPickupDate || null,
    id
  );

  return getClothingById(id);
}

export function batchUpdateStatus(ids: number[], newStatus: ClothingStatus): Clothing[] {
  const updated: Clothing[] = [];
  const transaction = db.transaction((idList: number[]) => {
    for (const id of idList) {
      const result = updateClothingStatus(id, newStatus);
      if (result) updated.push(result);
    }
  });
  transaction(ids);
  return updated;
}

export function pickupClothing(id: number, paymentMethod: PaymentMethod = 'cash', paymentDetails?: PaymentDetail[]): Clothing | null {
  const clothing = getClothingById(id);
  if (!clothing) return null;

  const newHistory: StatusRecord[] = [
    ...clothing.statusHistory,
    {
      status: 'completed',
      timestamp: new Date().toISOString(),
    },
  ];

  const operationHistory = addOperationRecord(clothing, 'pickup', {
    remark: `支付方式：${paymentMethod}，金额：¥${clothing.price.toFixed(2)}`,
  });

  const stmt = db.prepare(`
    UPDATE clothing 
    SET status = 'completed', 
        status_history = ?, 
        actual_pickup_date = ?,
        payment_method = ?,
        payment_details = ?,
        operation_history = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    JSON.stringify(newHistory),
    formatDate(new Date()),
    paymentMethod,
    paymentDetails ? JSON.stringify(paymentDetails) : null,
    JSON.stringify(operationHistory),
    id
  );

  const updated = getClothingById(id);
  
  if (updated) {
    try {
      updateCustomerStats(updated.customerPhone);
    } catch (e) {
      console.error('更新客户统计失败', e);
    }
  }

  return updated;
}

export function getOverdueClothing(): Clothing[] {
  const today = formatDate(new Date());
  const stmt = db.prepare(`
    SELECT * FROM clothing 
    WHERE status != 'completed' 
    AND expected_pickup_date < ?
    ORDER BY expected_pickup_date ASC
  `);
  const rows = stmt.all(today);
  return rows.map(rowToClothing);
}

export function getDashboardStats(): DashboardStats {
  const today = formatDate(new Date());

  const todayReceivedStmt = db.prepare(`
    SELECT COUNT(*) as count FROM clothing WHERE receive_date = ?
  `);
  const { count: todayReceived } = todayReceivedStmt.get(today) as { count: number };

  const overdueStmt = db.prepare(`
    SELECT COUNT(*) as count FROM clothing 
    WHERE status != 'completed' 
    AND expected_pickup_date < ?
  `);
  const { count: overdueCount } = overdueStmt.get(today) as { count: number };

  const pendingInspectionStmt = db.prepare(`
    SELECT COUNT(*) as count FROM clothing WHERE status = 'inspecting'
  `);
  const { count: pendingInspection } = pendingInspectionStmt.get() as { count: number };

  const waitingPickupStmt = db.prepare(`
    SELECT COUNT(*) as count FROM clothing WHERE status = 'waiting'
  `);
  const { count: waitingPickup } = waitingPickupStmt.get() as { count: number };

  const exceptionStmt = db.prepare(`
    SELECT COUNT(*) as count FROM clothing WHERE exception_type != 'none' AND exception_type IS NOT NULL
  `);
  const { count: exceptionCount } = exceptionStmt.get() as { count: number };

  return {
    todayReceived,
    overdueCount,
    pendingInspection,
    waitingPickup,
    exceptionCount,
  };
}

export function markException(id: number, exceptionType: ExceptionType, exceptionRemark?: string, operator?: string): Clothing | null {
  const clothing = getClothingById(id);
  if (!clothing) return null;

  const operationHistory = addOperationRecord(clothing,
    exceptionType === 'none' ? 'exception_clear' : 'exception_mark',
    {
      before: clothing.exceptionType || 'none',
      after: exceptionType,
      remark: exceptionRemark,
      operator,
    }
  );

  const stmt = db.prepare(`
    UPDATE clothing 
    SET exception_type = ?, 
        exception_remark = ?,
        operation_history = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    exceptionType,
    exceptionRemark || null,
    JSON.stringify(operationHistory),
    id
  );

  return getClothingById(id);
}

export function refundClothing(id: number, refundAmount?: number, remark?: string, operator?: string): Clothing | null {
  const clothing = getClothingById(id);
  if (!clothing) return null;

  const amount = refundAmount ?? clothing.price;

  const operationHistory = addOperationRecord(clothing, 'refund', {
    before: clothing.price,
    after: amount,
    remark,
    operator,
  });

  const stmt = db.prepare(`
    UPDATE clothing 
    SET exception_type = 'refunded', 
        exception_remark = ?,
        operation_history = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    remark || `退款 ¥${amount.toFixed(2)}`,
    JSON.stringify(operationHistory),
    id
  );

  return getClothingById(id);
}

export function getDailyReconciliation(dateStr?: string): DailyReconciliation {
  const targetDate = dateStr || formatDate(new Date());

  const detailsStmt = db.prepare(`
    SELECT * FROM clothing
    WHERE actual_pickup_date = ?
    AND status = 'completed'
    AND payment_method != 'none'
    ORDER BY updated_at ASC
  `);
  const detailRows = detailsStmt.all(targetDate);
  const details = detailRows.map(rowToClothing);

  const refundStmt = db.prepare(`
    SELECT * FROM clothing
    WHERE exception_type = 'refunded'
    AND DATE(updated_at) = ?
  `);
  const refundRows = refundStmt.all(targetDate);
  const refundItems = refundRows.map(rowToClothing);

  const refundCount = refundItems.length;
  const refundAmount = refundItems.reduce((sum, item) => sum + item.price, 0);

  const paymentMap = new Map<PaymentMethod, { count: number; amount: number }>();
  
  for (const item of details) {
    if (item.exceptionType === 'refunded') continue;
    
    if (item.paymentMethod === 'mixed' && item.paymentDetails && item.paymentDetails.length > 0) {
      for (const detail of item.paymentDetails) {
        const existing = paymentMap.get(detail.method) || { count: 0, amount: 0 };
        paymentMap.set(detail.method, {
          count: existing.count + 1,
          amount: existing.amount + detail.amount,
        });
      }
    } else if (item.paymentMethod && item.paymentMethod !== 'none' && item.paymentMethod !== 'mixed') {
      const existing = paymentMap.get(item.paymentMethod) || { count: 0, amount: 0 };
      paymentMap.set(item.paymentMethod, {
        count: existing.count + 1,
        amount: existing.amount + item.price,
      });
    }
  }

  const paymentStats = Array.from(paymentMap.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([method, data]) => ({
      method,
      methodName: PAYMENT_METHOD_LABELS[method],
      count: data.count,
      amount: data.amount,
    }));

  const totalCount = details.filter(d => d.exceptionType !== 'refunded').length;
  const totalRevenue = details
    .filter(d => d.exceptionType !== 'refunded')
    .reduce((sum, d) => sum + d.price, 0);

  return {
    date: targetDate,
    totalCount,
    totalRevenue,
    refundCount,
    refundAmount,
    netRevenue: totalRevenue - refundAmount,
    paymentStats,
    details,
  };
}

export function getCustomerHistory(phone: string): Clothing[] {
  const stmt = db.prepare(`
    SELECT * FROM clothing 
    WHERE customer_phone = ?
    ORDER BY created_at DESC
    LIMIT 100
  `);
  const rows = stmt.all(phone);
  return rows.map(rowToClothing);
}

export function getTypeConfigs() {
  const stmt = db.prepare('SELECT * FROM clothing_type_config ORDER BY id');
  return stmt.all();
}
