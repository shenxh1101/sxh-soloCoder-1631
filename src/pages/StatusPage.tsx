import { useState, useEffect } from 'react';
import { RefreshCw, Phone, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Clothing, ClothingStatus, CLOTHING_STATUS_LABELS, STATUS_FLOW, STATUS_COLORS, CLOTHING_TYPE_LABELS } from '../../shared/types';
import { clothingApi } from '../utils/api';
import { useStore } from '../store/useStore';
import StatusBadge from '../components/StatusBadge';
import Barcode from '../components/Barcode';
import { isOverdue } from '../../shared/utils';

export default function StatusPage() {
  const { clothingList, setClothingList, overdueList, setOverdueList, selectedStatus, setSelectedStatus, updateClothingInList, setLoading } = useStore();
  const [activeTab, setActiveTab] = useState<ClothingStatus | 'all'>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listResult, overdueResult] = await Promise.all([
        clothingApi.list(activeTab === 'all' ? undefined : activeTab),
        clothingApi.getOverdue(),
      ]);
      setClothingList(listResult.list);
      setOverdueList(overdueResult);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleStatusUpdate = async (clothing: Clothing) => {
    const nextStatus = STATUS_FLOW[clothing.status];
    if (!nextStatus) return;

    setUpdatingId(clothing.id);
    try {
      const updated = await clothingApi.updateStatus(clothing.id, nextStatus);
      updateClothingInList(updated);
      if (activeTab !== 'all' && activeTab !== updated.status) {
        loadData();
      }
    } catch (error) {
      alert('状态更新失败');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCallCustomer = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const statusTabs: (ClothingStatus | 'all')[] = ['all', 'received', 'washing', 'ironing', 'inspecting', 'waiting'];

  const getNextStatusLabel = (status: ClothingStatus) => {
    const next = STATUS_FLOW[status];
    return next ? CLOTHING_STATUS_LABELS[next] : null;
  };

  const filteredList = activeTab === 'all' ? clothingList : clothingList.filter(c => c.status === activeTab);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-600">状态管理</h2>
          <p className="text-sm text-gray-400 mt-1">查看和更新衣物洗护状态</p>
        </div>
        <button onClick={loadData} className="btn btn-secondary">
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {overdueList.length > 0 && (
        <div className="card p-4 mb-6 bg-danger/5 border-danger/30 animate-fade-in animate-stagger-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-danger/10 rounded-full flex items-center justify-center animate-pulse-soft">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <h3 className="font-semibold text-danger">逾期提醒</h3>
              <p className="text-sm text-danger/70">有 {overdueList.length} 件衣物已超过约定取衣日期，请及时联系客户</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {overdueList.slice(0, 3).map(item => (
              <div key={item.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-600">{CLOTHING_TYPE_LABELS[item.clothingType]}</p>
                  <p className="text-xs text-gray-400 font-mono">{item.barcode}</p>
                  <p className="text-xs text-danger mt-1">
                    逾期 {Math.ceil((Date.now() - new Date(item.expectedPickupDate).getTime()) / (1000 * 60 * 60 * 24))} 天
                  </p>
                </div>
                <button
                  onClick={() => handleCallCustomer(item.customerPhone)}
                  className="btn btn-danger text-sm py-2"
                >
                  <Phone className="w-4 h-4" />
                  催取
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mb-6 overflow-hidden animate-fade-in animate-stagger-2">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === tab
                  ? 'text-primary-500 border-b-2 border-primary-500 bg-primary-500/5'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab === 'all' ? '全部' : CLOTHING_STATUS_LABELS[tab]}
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100">
                {tab === 'all' ? clothingList.length : clothingList.filter(c => c.status === tab).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filteredList.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400">暂无{activeTab === 'all' ? '' : CLOTHING_STATUS_LABELS[activeTab]}状态的衣物</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredList.map((clothing, index) => {
            const overdue = isOverdue(clothing.expectedPickupDate, clothing.status);
            const nextStatus = getNextStatusLabel(clothing.status);
            const staggerClass = `animate-stagger-${(index % 5) + 1}` as const;

            return (
              <div
                key={clothing.id}
                className={`card card-hover p-5 animate-fade-in ${staggerClass} ${
                  overdue ? 'border-2 border-danger/50 bg-danger/5' : ''
                }`}
              >
                {overdue && (
                  <div className="absolute -top-2 -left-2">
                    <span className="bg-danger text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse-soft">
                      逾期
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${STATUS_COLORS[clothing.status]}15` }}>
                      <span className="text-2xl">
                        {clothing.clothingType === 'suit' && '👔'}
                        {clothing.clothingType === 'coat' && '🧥'}
                        {clothing.clothingType === 'downjacket' && '🥼'}
                        {clothing.clothingType === 'dress' && '👗'}
                        {clothing.clothingType === 'shirt' && '👕'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600">{CLOTHING_TYPE_LABELS[clothing.clothingType]}</p>
                      <p className="text-sm text-gray-400 font-mono">{clothing.barcode}</p>
                    </div>
                  </div>
                  <StatusBadge status={clothing.status} />
                </div>

                <div className="flex justify-center py-3 mb-4 bg-white rounded-lg border border-gray-100">
                  <Barcode value={clothing.barcode} height={40} width={1.5} fontSize={10} displayValue={false} />
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">客户电话</span>
                    <span className="font-medium flex items-center gap-1">
                      {clothing.customerPhone}
                      <button onClick={() => handleCallCustomer(clothing.customerPhone)} className="text-primary-500 hover:text-primary-600">
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">收衣日期</span>
                    <span>{clothing.receiveDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">取衣日期</span>
                    <span className={overdue ? 'text-danger font-medium' : ''}>{clothing.expectedPickupDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">金额</span>
                    <span className="font-mono font-semibold text-danger">¥{clothing.price.toFixed(2)}</span>
                  </div>
                </div>

                {clothing.remark && (
                  <div className="p-2 bg-yellow-50 rounded-lg text-xs text-yellow-700 mb-4">
                    <span className="font-medium">备注：</span>{clothing.remark}
                  </div>
                )}

                {nextStatus && (
                  <button
                    onClick={() => handleStatusUpdate(clothing)}
                    disabled={updatingId === clothing.id}
                    className="btn w-full"
                    style={{
                      backgroundColor: STATUS_COLORS[STATUS_FLOW[clothing.status]!],
                      color: 'white',
                    }}
                  >
                    {updatingId === clothing.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    {updatingId === clothing.id ? '更新中...' : nextStatus}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
