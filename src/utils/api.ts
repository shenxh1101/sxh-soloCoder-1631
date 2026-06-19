import axios from 'axios';
import { Clothing, ClothingStatus, CreateClothingRequest, MonthlyStats } from '../../shared/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const clothingApi = {
  create: (data: CreateClothingRequest) =>
    api.post<Clothing>('/clothing', data).then(res => res.data),

  list: (status?: ClothingStatus, page = 1, pageSize = 50) =>
    api.get<{ list: Clothing[]; total: number }>('/clothing', {
      params: { status, page, pageSize },
    }).then(res => res.data),

  getByBarcode: (barcode: string) =>
    api.get<Clothing>(`/clothing/barcode/${barcode}`).then(res => res.data),

  updateStatus: (id: number, status: ClothingStatus) =>
    api.put<Clothing>(`/clothing/${id}/status`, { status }).then(res => res.data),

  pickup: (id: number) =>
    api.put<Clothing>(`/clothing/${id}/pickup`).then(res => res.data),

  getOverdue: () =>
    api.get<Clothing[]>('/clothing/overdue').then(res => res.data),

  getCustomerHistory: (phone: string) =>
    api.get<{ phone: string; history: Clothing[] }>(`/clothing/customer/${phone}`).then(res => res.data),

  getTypeConfigs: () =>
    api.get<{ typeCode: string; typeName: string; defaultPrice: number }[]>('/clothing/type-configs')
      .then(res => res.data),
};

export const statisticsApi = {
  getMonthly: (year?: number, month?: number) =>
    api.get<MonthlyStats>('/statistics/monthly', {
      params: { year, month },
    }).then(res => res.data),
};

export default api;
