import { Request, Response } from 'express';
import * as clothingRepo from '../repositories/clothing';
import * as customerRepo from '../repositories/customer';
import { CreateClothingRequest, ClothingStatus, BatchUpdateStatusRequest, ClothingSearchParams, PaymentMethod, ClothingType } from '../../shared/types';

export async function createClothing(req: Request, res: Response) {
  try {
    const data: CreateClothingRequest = req.body;

    if (!data.clothingType || !data.customerPhone || !data.price || !data.expectedPickupDate) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    if (data.customerName) {
      try {
        customerRepo.updateCustomerInfo(data.customerPhone, { name: data.customerName });
      } catch (e) {
        console.error('保存客户姓名失败', e);
      }
    }

    const clothing = clothingRepo.createClothing(data);
    res.status(201).json(clothing);
  } catch (error) {
    console.error('创建衣物记录失败:', error);
    res.status(500).json({ error: '创建失败' });
  }
}

export async function getClothingList(req: Request, res: Response) {
  try {
    const { status, page = '1', pageSize = '50' } = req.query;
    const result = clothingRepo.getClothingList(
      status as ClothingStatus | undefined,
      parseInt(page as string),
      parseInt(pageSize as string)
    );
    res.json(result);
  } catch (error) {
    console.error('获取衣物列表失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
}

export async function searchClothing(req: Request, res: Response) {
  try {
    const params: ClothingSearchParams = {
      status: req.query.status as ClothingStatus | undefined,
      clothingType: req.query.clothingType as ClothingType | undefined,
      phone: req.query.phone as string | undefined,
      barcode: req.query.barcode as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 50,
    };
    const result = clothingRepo.searchClothing(params);
    res.json(result);
  } catch (error) {
    console.error('搜索衣物失败:', error);
    res.status(500).json({ error: '搜索失败' });
  }
}

export async function getClothingByBarcode(req: Request, res: Response) {
  try {
    const { barcode } = req.params;
    const clothing = clothingRepo.getClothingByBarcode(barcode);
    if (!clothing) {
      return res.status(404).json({ error: '未找到该衣物记录' });
    }
    res.json(clothing);
  } catch (error) {
    console.error('获取衣物详情失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
}

export async function getClothingById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const clothing = clothingRepo.getClothingById(parseInt(id));
    if (!clothing) {
      return res.status(404).json({ error: '未找到该衣物记录' });
    }
    res.json(clothing);
  } catch (error) {
    console.error('获取衣物详情失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
}

export async function updateClothingStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: '缺少状态字段' });
    }

    const clothing = clothingRepo.updateClothingStatus(parseInt(id), status as ClothingStatus);
    if (!clothing) {
      return res.status(404).json({ error: '未找到该衣物记录' });
    }
    res.json(clothing);
  } catch (error) {
    console.error('更新状态失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
}

export async function batchUpdateStatus(req: Request, res: Response) {
  try {
    const { ids, status }: BatchUpdateStatusRequest = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
      return res.status(400).json({ error: '参数错误' });
    }

    const updated = clothingRepo.batchUpdateStatus(ids, status as ClothingStatus);
    res.json({ updated: updated.length, items: updated });
  } catch (error) {
    console.error('批量更新状态失败:', error);
    res.status(500).json({ error: '批量更新失败' });
  }
}

export async function pickupClothing(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { paymentMethod = 'cash' } = req.body;
    const clothing = clothingRepo.pickupClothing(parseInt(id), paymentMethod as PaymentMethod);
    if (!clothing) {
      return res.status(404).json({ error: '未找到该衣物记录' });
    }
    res.json(clothing);
  } catch (error) {
    console.error('确认取衣失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
}

export async function getOverdueClothing(req: Request, res: Response) {
  try {
    const list = clothingRepo.getOverdueClothing();
    res.json(list);
  } catch (error) {
    console.error('获取逾期列表失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
}

export async function getCustomerHistory(req: Request, res: Response) {
  try {
    const { phone } = req.params;
    const history = clothingRepo.getCustomerHistory(phone);
    res.json({ phone, history });
  } catch (error) {
    console.error('获取客户历史失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
}

export async function getTypeConfigs(req: Request, res: Response) {
  try {
    const configs = clothingRepo.getTypeConfigs();
    res.json(configs);
  } catch (error) {
    console.error('获取类型配置失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
}
