import db from '../db/init';
import { ClothingType, CLOTHING_TYPE_LABELS, MonthlyStats } from '../../shared/types';
import { formatDate } from '../utils/barcode';

export function getMonthlyStats(year?: number, month?: number): MonthlyStats {
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month || (now.getMonth() + 1);

  const startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;
  const endDate = new Date(targetYear, targetMonth, 0);
  const endDateStr = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${endDate.getDate()}`;

  const countStmt = db.prepare(`
    SELECT 
      COUNT(*) as totalCount,
      COALESCE(SUM(price), 0) as totalRevenue
    FROM clothing
    WHERE receive_date BETWEEN ? AND ?
  `);
  const { totalCount, totalRevenue } = countStmt.get(startDate, endDateStr) as {
    totalCount: number;
    totalRevenue: number;
  };

  const typeStmt = db.prepare(`
    SELECT 
      clothing_type as type,
      COUNT(*) as count
    FROM clothing
    WHERE receive_date BETWEEN ? AND ?
    GROUP BY clothing_type
    ORDER BY count DESC
  `);
  const typeRows = typeStmt.all(startDate, endDateStr) as {
    type: ClothingType;
    count: number;
  }[];

  const typeStats = typeRows.map(row => ({
    type: row.type,
    typeName: CLOTHING_TYPE_LABELS[row.type],
    count: row.count,
  }));

  const dailyStmt = db.prepare(`
    SELECT 
      receive_date as date,
      COUNT(*) as count,
      COALESCE(SUM(price), 0) as revenue
    FROM clothing
    WHERE receive_date BETWEEN ? AND ?
    GROUP BY receive_date
    ORDER BY receive_date ASC
  `);
  const dailyRows = dailyStmt.all(startDate, endDateStr) as {
    date: string;
    count: number;
    revenue: number;
  }[];

  const today = formatDate(new Date());
  const overdueStmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM clothing
    WHERE status != 'completed'
    AND expected_pickup_date < ?
  `);
  const { count: overdueCount } = overdueStmt.get(today) as { count: number };

  return {
    totalCount,
    totalRevenue,
    typeStats,
    dailyStats: dailyRows,
    overdueCount,
  };
}
