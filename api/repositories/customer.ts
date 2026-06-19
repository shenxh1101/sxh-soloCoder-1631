import db from '../db/init';
import { Customer, CustomerDetail, ClothingType, CLOTHING_TYPE_LABELS } from '../../shared/types';
import { formatDate } from '../utils/barcode';

function rowToCustomer(row: any): Customer {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name || undefined,
    remark: row.remark || undefined,
    totalCount: row.total_count,
    totalAmount: row.total_amount,
    lastVisitDate: row.last_visit_date || undefined,
    favoriteType: row.favorite_type || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getCustomerByPhone(phone: string): Customer | null {
  const stmt = db.prepare('SELECT * FROM customer WHERE phone = ?');
  const row = stmt.get(phone);
  return row ? rowToCustomer(row) : null;
}

export function getCustomerDetailByPhone(phone: string): CustomerDetail | null {
  const customer = getCustomerByPhone(phone);
  if (!customer) return null;

  const historyStmt = db.prepare(`
    SELECT * FROM clothing 
    WHERE customer_phone = ?
    ORDER BY created_at DESC
    LIMIT 100
  `);
  const historyRows = historyStmt.all(phone);

  const history = historyRows.map((row: any) => {
    let paymentDetails;
    if (row.payment_details) {
      try {
        paymentDetails = JSON.parse(row.payment_details);
      } catch (e) {
        paymentDetails = undefined;
      }
    }

    let operationHistory = [];
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
      status: row.status,
      remark: row.remark || undefined,
      paymentMethod: row.payment_method || 'none',
      paymentDetails,
      exceptionType: row.exception_type || 'none',
      exceptionRemark: row.exception_remark || undefined,
      statusHistory: JSON.parse(row.status_history),
      operationHistory,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  return {
    ...customer,
    history,
  };
}

export function updateCustomerStats(phone: string): void {
  const statsStmt = db.prepare(`
    SELECT 
      COUNT(*) as total_count,
      COALESCE(SUM(price), 0) as total_amount,
      MAX(receive_date) as last_visit_date
    FROM clothing
    WHERE customer_phone = ?
  `);
  const stats = statsStmt.get(phone) as {
    total_count: number;
    total_amount: number;
    last_visit_date: string;
  };

  const typeStmt = db.prepare(`
    SELECT clothing_type, COUNT(*) as cnt
    FROM clothing
    WHERE customer_phone = ?
    GROUP BY clothing_type
    ORDER BY cnt DESC
    LIMIT 1
  `);
  const typeRow = typeStmt.get(phone) as { clothing_type: ClothingType; cnt: number } | undefined;

  const favoriteType = typeRow?.clothing_type;

  const existing = getCustomerByPhone(phone);
  
  if (existing) {
    const updateStmt = db.prepare(`
      UPDATE customer 
      SET total_count = ?, 
          total_amount = ?, 
          last_visit_date = ?,
          favorite_type = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE phone = ?
    `);
    updateStmt.run(
      stats.total_count,
      stats.total_amount,
      stats.last_visit_date || null,
      favoriteType || null,
      phone
    );
  } else {
    const insertStmt = db.prepare(`
      INSERT INTO customer (phone, total_count, total_amount, last_visit_date, favorite_type)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertStmt.run(
      phone,
      stats.total_count,
      stats.total_amount,
      stats.last_visit_date || null,
      favoriteType || null
    );
  }
}

export function updateCustomerInfo(phone: string, data: { name?: string; remark?: string }): Customer | null {
  const existing = getCustomerByPhone(phone);
  
  if (existing) {
    const updateStmt = db.prepare(`
      UPDATE customer 
      SET name = COALESCE(?, name),
          remark = COALESCE(?, remark),
          updated_at = CURRENT_TIMESTAMP
      WHERE phone = ?
    `);
    updateStmt.run(
      data.name !== undefined ? data.name : null,
      data.remark !== undefined ? data.remark : null,
      phone
    );
  } else {
    const insertStmt = db.prepare(`
      INSERT INTO customer (phone, name, remark, total_count, total_amount)
      VALUES (?, ?, ?, 0, 0)
    `);
    insertStmt.run(
      phone,
      data.name || null,
      data.remark || null
    );
  }

  return getCustomerByPhone(phone);
}

export function searchCustomers(keyword: string, page: number = 1, pageSize: number = 20): { list: Customer[]; total: number } {
  const whereClause = 'WHERE phone LIKE ? OR name LIKE ?';
  const searchParam = `%${keyword}%`;

  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM customer ${whereClause}`);
  const { count } = countStmt.get(searchParam, searchParam) as { count: number };

  const offset = (page - 1) * pageSize;
  const listStmt = db.prepare(`
    SELECT * FROM customer ${whereClause}
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `);
  const rows = listStmt.all(searchParam, searchParam, pageSize, offset);

  return {
    list: rows.map(rowToCustomer),
    total: count,
  };
}

export function getRecentCustomers(limit: number = 20): Customer[] {
  const stmt = db.prepare(`
    SELECT * FROM customer
    ORDER BY last_visit_date DESC
    LIMIT ?
  `);
  const rows = stmt.all(limit);
  return rows.map(rowToCustomer);
}
