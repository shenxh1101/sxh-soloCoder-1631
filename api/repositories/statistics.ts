import db from '../db/init';
import { ClothingType, CLOTHING_TYPE_LABELS, MonthlyStats, PAYMENT_METHOD_LABELS, PaymentMethod, PaymentDetail } from '../../shared/types';
import { formatDate } from '../utils/barcode';

export function getMonthlyStats(year?: number, month?: number): MonthlyStats {
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month || (now.getMonth() + 1);

  const startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;
  const endDate = new Date(targetYear, targetMonth, 0);
  const endDateStr = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${endDate.getDate()}`;

  const countStmt = db.prepare(`
    SELECT COUNT(*) as totalCount
    FROM clothing
    WHERE receive_date BETWEEN ? AND ?
  `);
  const { totalCount } = countStmt.get(startDate, endDateStr) as {
    totalCount: number;
  };

  const revenueStmt = db.prepare(`
    SELECT COALESCE(SUM(price), 0) as totalRevenue
    FROM clothing
    WHERE actual_pickup_date BETWEEN ? AND ?
    AND status = 'completed'
    AND payment_method != 'none'
  `);
  const { totalRevenue } = revenueStmt.get(startDate, endDateStr) as {
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
      0 as revenue
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

  const revenueByDateMap = new Map<string, number>();
  const revenueByDateStmt = db.prepare(`
    SELECT actual_pickup_date as date, COALESCE(SUM(price), 0) as revenue
    FROM clothing
    WHERE actual_pickup_date BETWEEN ? AND ?
    AND status = 'completed'
    AND payment_method != 'none'
    GROUP BY actual_pickup_date
  `);
  const revenueByDateRows = revenueByDateStmt.all(startDate, endDateStr) as { date: string; revenue: number }[];
  for (const row of revenueByDateRows) {
    revenueByDateMap.set(row.date, row.revenue);
  }

  const allDates = new Set<string>();
  for (const row of dailyRows) allDates.add(row.date);
  for (const row of revenueByDateRows) allDates.add(row.date);

  const dailyMap = new Map<string, { count: number; revenue: number }>();
  for (const row of dailyRows) {
    dailyMap.set(row.date, { count: row.count, revenue: revenueByDateMap.get(row.date) || 0 });
  }
  for (const row of revenueByDateRows) {
    if (!dailyMap.has(row.date)) {
      dailyMap.set(row.date, { count: 0, revenue: row.revenue });
    }
  }

  const dailyStats = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date,
      count: data.count,
      revenue: data.revenue,
    }));

  const paymentDataStmt = db.prepare(`
    SELECT 
      payment_method as method,
      payment_details,
      price
    FROM clothing
    WHERE actual_pickup_date BETWEEN ? AND ?
    AND status = 'completed'
    AND payment_method != 'none'
  `);
  const paymentRows = paymentDataStmt.all(startDate, endDateStr) as {
    method: PaymentMethod;
    payment_details?: string;
    price: number;
  }[];

  const paymentMap = new Map<PaymentMethod, { count: number; amount: number }>();
  
  for (const row of paymentRows) {
    if (row.method === 'mixed' && row.payment_details) {
      try {
        const details: PaymentDetail[] = JSON.parse(row.payment_details);
        for (const detail of details) {
          const existing = paymentMap.get(detail.method) || { count: 0, amount: 0 };
          paymentMap.set(detail.method, {
            count: existing.count + 1,
            amount: existing.amount + detail.amount,
          });
        }
      } catch (e) {
        const existing = paymentMap.get(row.method) || { count: 0, amount: 0 };
        paymentMap.set(row.method, {
          count: existing.count + 1,
          amount: existing.amount + row.price,
        });
      }
    } else {
      const existing = paymentMap.get(row.method) || { count: 0, amount: 0 };
      paymentMap.set(row.method, {
        count: existing.count + 1,
        amount: existing.amount + row.price,
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
    dailyStats,
    paymentStats,
    overdueCount,
  };
}
