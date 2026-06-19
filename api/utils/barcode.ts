import db from '../db/init';
import { formatDate, isOverdue } from '../../shared/utils';

export function generateBarcode(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  
  const todayStart = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM clothing 
    WHERE DATE(created_at) = ?
  `);
  const result = stmt.get(todayStart) as { count: number };
  const sequence = (result.count + 1).toString().padStart(4, '0');
  
  return `DC${dateStr}${sequence}`;
}

export { formatDate, isOverdue };
