export type ClothingStatus = 'received' | 'washing' | 'ironing' | 'inspecting' | 'waiting' | 'completed';

export type ClothingType = 'suit' | 'coat' | 'downjacket' | 'dress' | 'shirt';

export interface StatusRecord {
  status: ClothingStatus;
  timestamp: string;
  operator?: string;
}

export interface Clothing {
  id: number;
  barcode: string;
  clothingType: ClothingType;
  customerPhone: string;
  customerName?: string;
  price: number;
  receiveDate: string;
  expectedPickupDate: string;
  actualPickupDate?: string;
  status: ClothingStatus;
  remark?: string;
  statusHistory: StatusRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface ClothingTypeConfig {
  id: number;
  typeCode: ClothingType;
  typeName: string;
  defaultPrice: number;
}

export interface MonthlyStats {
  totalCount: number;
  totalRevenue: number;
  typeStats: { type: ClothingType; typeName: string; count: number }[];
  dailyStats: { date: string; count: number; revenue: number }[];
  overdueCount: number;
}

export interface CreateClothingRequest {
  clothingType: ClothingType;
  customerPhone: string;
  customerName?: string;
  price: number;
  expectedPickupDate: string;
  remark?: string;
}

export const CLOTHING_STATUS_LABELS: Record<ClothingStatus, string> = {
  received: '收衣',
  washing: '洗涤中',
  ironing: '熨烫中',
  inspecting: '质检中',
  waiting: '待取',
  completed: '已完成',
};

export const CLOTHING_TYPE_LABELS: Record<ClothingType, string> = {
  suit: '西装',
  coat: '大衣',
  downjacket: '羽绒服',
  dress: '裙装',
  shirt: '衬衫',
};

export const STATUS_FLOW: Record<ClothingStatus, ClothingStatus | null> = {
  received: 'washing',
  washing: 'ironing',
  ironing: 'inspecting',
  inspecting: 'waiting',
  waiting: 'completed',
  completed: null,
};

export const STATUS_COLORS: Record<ClothingStatus, string> = {
  received: '#165DFF',
  washing: '#722ED1',
  ironing: '#0FC6C2',
  inspecting: '#14C9C9',
  waiting: '#00B42A',
  completed: '#86909C',
};

export const DEFAULT_PRICES: Record<ClothingType, number> = {
  suit: 35,
  coat: 50,
  downjacket: 60,
  dress: 30,
  shirt: 15,
};
