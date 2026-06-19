import db from '../db/init';
import { Clothing, ClothingStatus, ClothingType, CreateClothingRequest, StatusRecord, ClothingSearchParams, PaymentMethod } from '../../shared/types';
import { generateBarcode, formatDate } from '../utils/barcode';
import { updateCustomerStats } from './customer';

function rowToClothing(row: any): Clothing {
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
    statusHistory: JSON.parse(row.status_history),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createClothing(data: CreateClothingRequest): Clothing {
  const barcode = generateBarcode();
  const receiveDate = formatDate(new Date());
  const initialHistory: StatusRecord[] = [{
    status: 'received',
    timestamp: new Date().toISOString(),
  }];

  const stmt = db.prepare(`
    INSERT INTO clothing (
      barcode, clothing_type, customer_phone, customer_name, price,
      receive_date, expected_pickup_date, status, remark, status_history, payment_method
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
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
    'none'
  );

  const clothing = getClothingById(result.lastInsertRowid as number)!;
  
  try {
    updateCustomerStats(data.customerPhone);
  } catch (e) {
    console.error('更新客户统计失败', e);
  }

  return clothing;
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

export function pickupClothing(id: number, paymentMethod: PaymentMethod = 'cash'): Clothing | null {
  const clothing = getClothingById(id);
  if (!clothing) return null;

  const newHistory: StatusRecord[] = [
    ...clothing.statusHistory,
    {
      status: 'completed',
      timestamp: new Date().toISOString(),
    },
  ];

  const stmt = db.prepare(`
    UPDATE clothing 
    SET status = 'completed', 
        status_history = ?, 
        actual_pickup_date = ?,
        payment_method = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    JSON.stringify(newHistory),
    formatDate(new Date()),
    paymentMethod,
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
