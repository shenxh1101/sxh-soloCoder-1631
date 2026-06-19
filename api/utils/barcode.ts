import db from '../db/init';
import { formatDate, isOverdue } from '../../shared/utils';

export function generateBarcode(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  
  const checkStmt = db.prepare('SELECT barcode FROM clothing WHERE barcode LIKE ? ORDER BY barcode DESC LIMIT 1');
  const prefix = `DC${dateStr}`;
  const row = checkStmt.get(`${prefix}%`) as { barcode: string } | undefined;
  
  let sequence = 1;
  if (row && row.barcode) {
    const seqStr = row.barcode.substring(prefix.length);
    const lastSeq = parseInt(seqStr, 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }
  
  let barcode = `${prefix}${sequence.toString().padStart(4, '0')}`;
  const existsStmt = db.prepare('SELECT COUNT(*) as count FROM clothing WHERE barcode = ?');
  
  for (let i = 0; i < 1000; i++) {
    const check = existsStmt.get(barcode) as { count: number };
    if (check.count === 0) {
      return barcode;
    }
    sequence++;
    barcode = `${prefix}${sequence.toString().padStart(4, '0')}`;
  }
  
  return `${prefix}${Date.now().toString().slice(-4)}`;
}

export { formatDate, isOverdue };
