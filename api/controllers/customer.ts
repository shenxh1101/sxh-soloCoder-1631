import { Request, Response } from 'express';
import * as customerRepo from '../repositories/customer';

export async function getCustomerByPhone(req: Request, res: Response) {
  try {
    const { phone } = req.params;
    const customer = customerRepo.getCustomerDetailByPhone(phone);
    if (!customer) {
      return res.status(404).json({ error: '未找到该客户' });
    }
    res.json(customer);
  } catch (error) {
    console.error('获取客户信息失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
}

export async function getCustomerSimple(req: Request, res: Response) {
  try {
    const { phone } = req.params;
    const customer = customerRepo.getCustomerByPhone(phone);
    if (!customer) {
      return res.status(404).json({ error: '未找到该客户' });
    }
    res.json(customer);
  } catch (error) {
    console.error('获取客户信息失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
}

export async function updateCustomer(req: Request, res: Response) {
  try {
    const { phone } = req.params;
    const { name, remark } = req.body;
    const customer = customerRepo.updateCustomerInfo(phone, { name, remark });
    if (!customer) {
      return res.status(404).json({ error: '未找到该客户' });
    }
    res.json(customer);
  } catch (error) {
    console.error('更新客户信息失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
}

export async function searchCustomers(req: Request, res: Response) {
  try {
    const { keyword = '', page = '1', pageSize = '20' } = req.query;
    const result = customerRepo.searchCustomers(
      keyword as string,
      parseInt(page as string),
      parseInt(pageSize as string)
    );
    res.json(result);
  } catch (error) {
    console.error('搜索客户失败:', error);
    res.status(500).json({ error: '搜索失败' });
  }
}

export async function getRecentCustomers(req: Request, res: Response) {
  try {
    const { limit = '20' } = req.query;
    const customers = customerRepo.getRecentCustomers(parseInt(limit as string));
    res.json(customers);
  } catch (error) {
    console.error('获取近期客户失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
}
