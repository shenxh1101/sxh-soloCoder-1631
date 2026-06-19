import { Request, Response } from 'express';
import * as statsRepo from '../repositories/statistics';

export async function getMonthlyStats(req: Request, res: Response) {
  try {
    const { year, month } = req.query;
    const stats = statsRepo.getMonthlyStats(
      year ? parseInt(year as string) : undefined,
      month ? parseInt(month as string) : undefined
    );
    res.json(stats);
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
}
