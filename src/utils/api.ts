import axios from 'axios';
import { Clothing, ClothingStatus, CreateClothingRequest, MonthlyStats, Customer, CustomerDetail, ClothingSearchParams, PaymentMethod, BatchUpdateStatusRequest, UpdateClothingRequest, PickupRequest, DashboardStats } from '../../shared/types';

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

  search: (params: ClothingSearchParams) =>
    api.get<{ list: Clothing[]; total: number }>('/clothing/search', {
      params,
    }).then(res => res.data),

  getById: (id: number) =>
    api.get<Clothing>(`/clothing/${id}`).then(res => res.data),

  getByBarcode: (barcode: string) =>
    api.get<Clothing>(`/clothing/barcode/${barcode}`).then(res => res.data),

  update: (id: number, data: UpdateClothingRequest) =>
    api.put<Clothing>(`/clothing/${id}`, data).then(res => res.data),

  updateStatus: (id: number, status: ClothingStatus) =>
    api.put<Clothing>(`/clothing/${id}/status`, { status }).then(res => res.data),

  batchUpdateStatus: (ids: number[], status: ClothingStatus) =>
    api.put<{ updated: number; items: Clothing[] }>('/clothing/batch/status', {
      ids,
      status,
    } as BatchUpdateStatusRequest).then(res => res.data),

  pickup: (id: number, data: PickupRequest) =>
    api.put<Clothing>(`/clothing/${id}/pickup`, data).then(res => res.data),

  getDashboardStats: () =>
    api.get<DashboardStats>('/clothing/dashboard').then(res => res.data),

  getOverdue: () =>
    api.get<Clothing[]>('/clothing/overdue').then(res => res.data),

  getCustomerHistory: (phone: string) =>
    api.get<{ phone: string; history: Clothing[] }>(`/clothing/customer/${phone}`).then(res => res.data),

  getTypeConfigs: () =>
    api.get<{ typeCode: string; typeName: string; defaultPrice: number }[]>('/clothing/type-configs')
      .then(res => res.data),
};

export const customerApi = {
  getByPhone: (phone: string) =>
    api.get<CustomerDetail>(`/customer/${phone}`).then(res => res.data),

  getSimple: (phone: string) =>
    api.get<Customer>(`/customer/${phone}/simple`).then(res => res.data),

  update: (phone: string, data: { name?: string; remark?: string }) =>
    api.put<Customer>(`/customer/${phone}`, data).then(res => res.data),

  search: (keyword: string, page = 1, pageSize = 20) =>
    api.get<{ list: Customer[]; total: number }>('/customer/search', {
      params: { keyword, page, pageSize },
    }).then(res => res.data),

  getRecent: (limit = 20) =>
    api.get<Customer[]>('/customer/recent', {
      params: { limit },
    }).then(res => res.data),
};

export const statisticsApi = {
  getMonthly: (year?: number, month?: number) =>
    api.get<MonthlyStats>('/statistics/monthly', {
      params: { year, month },
    }).then(res => res.data),
};

export default api;
