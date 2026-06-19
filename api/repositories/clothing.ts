import db from '../db/init';
import { Clothing, ClothingStatus, ClothingType, CreateClothingRequest, StatusRecord } from '../../shared/types';
import { generateBarcode, formatDate } from '../utils/barcode';

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
      receive_date, expected_pickup_date, status, remark, status_history
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    JSON.stringify(initialHistory)
  );

  return getClothingById(result.lastInsertRowid as number)!;
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

export function pickupClothing(id: number): Clothing | null {
  return updateClothingStatus(id, 'completed');
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
    LIMIT 20
  `);
  const rows = stmt.all(phone);
  return rows.map(rowToClothing);
}

export function getTypeConfigs() {
  const stmt = db.prepare('SELECT * FROM clothing_type_config ORDER BY id');
  return stmt.all();
}
