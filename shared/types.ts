export type ClothingStatus = 'received' | 'washing' | 'ironing' | 'inspecting' | 'waiting' | 'completed';

export type ClothingType = 'suit' | 'coat' | 'downjacket' | 'dress' | 'shirt';

export type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'none' | 'mixed';

export interface PaymentDetail {
  method: Exclude<PaymentMethod, 'none' | 'mixed'>;
  amount: number;
}

export interface StatusRecord {
  status: ClothingStatus;
  timestamp: string;
  operator?: string;
  remark?: string;
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
  paymentMethod?: PaymentMethod;
  paymentDetails?: PaymentDetail[];
  statusHistory: StatusRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateClothingRequest {
  expectedPickupDate?: string;
  remark?: string;
  price?: number;
}

export interface Customer {
  id: number;
  phone: string;
  name?: string;
  remark?: string;
  totalCount: number;
  totalAmount: number;
  lastVisitDate?: string;
  favoriteType?: ClothingType;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetail extends Customer {
  history: Clothing[];
}

export interface ClothingTypeConfig {
  id: number;
  typeCode: ClothingType;
  typeName: string;
  defaultPrice: number;
}

export interface DashboardStats {
  todayReceived: number;
  overdueCount: number;
  pendingInspection: number;
  waitingPickup: number;
}

export interface MonthlyStats {
  totalCount: number;
  totalRevenue: number;
  typeStats: { type: ClothingType; typeName: string; count: number }[];
  dailyStats: { date: string; count: number; revenue: number }[];
  paymentStats: { method: PaymentMethod; methodName: string; count: number; amount: number }[];
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

export interface PickupRequest {
  paymentMethod: PaymentMethod;
  paymentDetails?: PaymentDetail[];
}

export interface BatchUpdateStatusRequest {
  ids: number[];
  status: ClothingStatus;
}

export interface ClothingSearchParams {
  status?: ClothingStatus;
  clothingType?: ClothingType;
  phone?: string;
  barcode?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
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

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '现金',
  wechat: '微信支付',
  alipay: '支付宝',
  none: '未支付',
  mixed: '混合支付',
};

export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  cash: '#1D2129',
  wechat: '#07C160',
  alipay: '#1677FF',
  none: '#86909C',
  mixed: '#F53F3F',
};
