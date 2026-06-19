import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Phone, Clock, AlertTriangle, ArrowRight, Search, Filter, CheckSquare, Square, Printer, X, ChevronDown, Package, AlertCircle, ClipboardCheck, PackageCheck } from 'lucide-react';
import { Clothing, ClothingStatus, CLOTHING_STATUS_LABELS, STATUS_FLOW, STATUS_COLORS, CLOTHING_TYPE_LABELS, ClothingType, DashboardStats } from '../../shared/types';
import { clothingApi } from '../utils/api';
import { useStore } from '../store/useStore';
import StatusBadge from '../components/StatusBadge';
import Barcode from '../components/Barcode';
import Receipt from '../components/Receipt';
import { isOverdue } from '../../shared/utils';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function StatusPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clothingList, setClothingList, overdueList, setOverdueList, loading, setLoading } = useStore();
  const [activeTab, setActiveTab] = useState<ClothingStatus | 'all'>('all');
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<ClothingType | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [printClothing, setPrintClothing] = useState<Clothing | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (searchKeyword) {
        if (/^\d+$/.test(searchKeyword) && searchKeyword.length >= 11) {
          params.phone = searchKeyword;
        } else {
          params.barcode = searchKeyword;
        }
      }
      if (filterType) params.clothingType = filterType;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [listResult, overdueResult, dashboardResult] = await Promise.all([
        Object.keys(params).length > 0 ? clothingApi.search(params) : clothingApi.list(activeTab === 'all' ? undefined : activeTab),
        clothingApi.getOverdue(),
        clothingApi.getDashboardStats(),
      ]);
      setClothingList(listResult.list);
      setOverdueList(overdueResult);
      setDashboardStats(dashboardResult);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    const printId = searchParams.get('print');
    if (printId) {
      clothingApi.getById(parseInt(printId)).then(clothing => {
        if (clothing) {
          setPrintClothing(clothing);
          setShowPrintModal(true);
        }
      });
      setSearchParams({});
    }
  }, [searchParams]);

  const handleSearch = () => {
    loadData();
  };

  const handleStatusUpdate = async (clothing: Clothing) => {
    const nextStatus = STATUS_FLOW[clothing.status];
    if (!nextStatus) return;

    setUpdatingIds(prev => new Set(prev).add(clothing.id));
    try {
      const updated = await clothingApi.updateStatus(clothing.id, nextStatus);
      await loadData();
    } catch (error) {
      alert('状态更新失败');
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(clothing.id);
        return next;
      });
    }
  };

  const handleBatchUpdate = async () => {
    if (selectedIds.size === 0) return;
    
    const firstItem = clothingList.find(c => selectedIds.has(c.id));
    if (!firstItem) return;
    
    const nextStatus = STATUS_FLOW[firstItem.status];
    if (!nextStatus) {
      alert('已完成的衣物无法批量操作');
      return;
    }

    if (!confirm(`确定将选中的 ${selectedIds.size} 件衣物状态更新为"${CLOTHING_STATUS_LABELS[nextStatus]}"吗？`)) {
      return;
    }

    setUpdatingIds(new Set(selectedIds));
    try {
      await clothingApi.batchUpdateStatus(Array.from(selectedIds), nextStatus);
      setSelectedIds(new Set());
      await loadData();
    } catch (error) {
      alert('批量更新失败');
    } finally {
      setUpdatingIds(new Set());
    }
  };

  const handleCallCustomer = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handlePrint = (clothing: Clothing) => {
    setPrintClothing(clothing);
    setShowPrintModal(true);
  };

  const handlePrintConfirm = () => {
    window.print();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredList.map(c => c.id)));
    }
  };

  const handleDashboardClick = (type: 'todayReceived' | 'overdue' | 'pendingInspection' | 'waitingPickup') => {
    setSearchKeyword('');
    setFilterType('');
    setStartDate('');
    setEndDate('');
    
    switch (type) {
      case 'todayReceived':
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
        setActiveTab('received');
        break;
      case 'overdue':
        setActiveTab('all');
        setTimeout(() => {
          const overdueSection = document.getElementById('overdue-section');
          overdueSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        break;
      case 'pendingInspection':
        setActiveTab('inspecting');
        break;
      case 'waitingPickup':
        setActiveTab('waiting');
        break;
    }
  };

  const statusTabs: (ClothingStatus | 'all')[] = ['all', 'received', 'washing', 'ironing', 'inspecting', 'waiting'];

  const getNextStatusLabel = (status: ClothingStatus) => {
    const next = STATUS_FLOW[status];
    return next ? CLOTHING_STATUS_LABELS[next] : null;
  };

  const filteredList = useMemo(() => {
    return clothingList;
  }, [clothingList]);

  const canBatchUpdate = useMemo(() => {
    if (selectedIds.size === 0) return false;
    const firstStatus = clothingList.find(c => selectedIds.has(c.id))?.status;
    if (!firstStatus) return false;
    return Array.from(selectedIds).every(id => {
      const item = clothingList.find(c => c.id === id);
      return item && item.status === firstStatus && STATUS_FLOW[item.status];
    });
  }, [selectedIds, clothingList]);

  const batchNextStatus = useMemo(() => {
    if (!canBatchUpdate) return null;
    const firstItem = clothingList.find(c => selectedIds.has(c.id));
    if (!firstItem) return null;
    return STATUS_FLOW[firstItem.status];
  }, [canBatchUpdate, clothingList]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-600">状态管理</h2>
          <p className="text-sm text-gray-400 mt-1">查看和更新衣物洗护状态</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadData} className="btn btn-secondary">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>

      {dashboardStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            className="card p-5 cursor-pointer hover:shadow-lg transition-all group animate-fade-in animate-stagger-1"
            onClick={() => handleDashboardClick('todayReceived')}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">今日新收</p>
                <p className="text-3xl font-bold text-blue-600">{dashboardStats.todayReceived}</p>
                <p className="text-xs text-gray-400 mt-2 group-hover:text-blue-500 transition-colors">点击查看 →</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div
            className="card p-5 cursor-pointer hover:shadow-lg transition-all group animate-fade-in animate-stagger-1"
            onClick={() => handleDashboardClick('overdue')}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">逾期未取</p>
                <p className="text-3xl font-bold text-red-600">{dashboardStats.overdueCount}</p>
                <p className="text-xs text-gray-400 mt-2 group-hover:text-red-500 transition-colors">点击查看 →</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div
            className="card p-5 cursor-pointer hover:shadow-lg transition-all group animate-fade-in animate-stagger-2"
            onClick={() => handleDashboardClick('pendingInspection')}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">待质检</p>
                <p className="text-3xl font-bold text-cyan-600">{dashboardStats.pendingInspection}</p>
                <p className="text-xs text-gray-400 mt-2 group-hover:text-cyan-500 transition-colors">点击查看 →</p>
              </div>
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
          </div>

          <div
            className="card p-5 cursor-pointer hover:shadow-lg transition-all group animate-fade-in animate-stagger-2"
            onClick={() => handleDashboardClick('waitingPickup')}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">待取衣</p>
                <p className="text-3xl font-bold text-green-600">{dashboardStats.waitingPickup}</p>
                <p className="text-xs text-gray-400 mt-2 group-hover:text-green-500 transition-colors">点击查看 →</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <PackageCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {overdueList.length > 0 && (
        <div id="overdue-section" className="card p-4 mb-6 bg-danger/5 border-danger/30 animate-fade-in animate-stagger-1">
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
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索手机号或条码..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                showFilters ? 'bg-primary-50 border-primary-200 text-primary-600' : 'border-gray-200 text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              筛选
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={handleSearch} className="btn btn-accent">
              <Search className="w-4 h-4" />
              搜索
            </button>
          </div>

          {showFilters && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">衣物类型：</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as ClothingType | '')}
                  className="input text-sm py-2"
                >
                  <option value="">全部</option>
                  {Object.entries(CLOTHING_TYPE_LABELS).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">收衣日期：</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input text-sm py-2"
                />
                <span className="text-gray-400">至</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input text-sm py-2"
                />
              </div>
              <button
                onClick={() => {
                  setFilterType('');
                  setStartDate('');
                  setEndDate('');
                  setSearchKeyword('');
                  loadData();
                }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                重置
              </button>
            </div>
          )}
        </div>

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

        {selectedIds.size > 0 && (
          <div className="px-6 py-3 bg-primary-50 border-b border-primary-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={toggleSelectAll} className="text-primary-600">
                {selectedIds.size === filteredList.length ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
              <span className="text-sm text-primary-700">
                已选择 <span className="font-bold">{selectedIds.size}</span> 件衣物
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="btn btn-secondary text-sm py-2"
              >
                取消选择
              </button>
              {batchNextStatus && (
                <button
                  onClick={handleBatchUpdate}
                  disabled={!canBatchUpdate || updatingIds.size > 0}
                  className="btn text-sm py-2 text-white"
                  style={{ backgroundColor: STATUS_COLORS[batchNextStatus] }}
                >
                  <ArrowRight className="w-4 h-4" />
                  批量{CLOTHING_STATUS_LABELS[batchNextStatus]}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <RefreshCw className="w-8 h-8 text-gray-300 mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">加载中...</p>
        </div>
      ) : filteredList.length === 0 ? (
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
            const isSelected = selectedIds.has(clothing.id);
            const isUpdating = updatingIds.has(clothing.id);

            return (
              <div
                key={clothing.id}
                className={`card card-hover p-5 animate-fade-in ${staggerClass} relative ${
                  overdue ? 'border-2 border-danger/50 bg-danger/5' : ''
                } ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
              >
                <button
                  onClick={() => toggleSelect(clothing.id)}
                  className="absolute top-4 left-4 z-10 text-primary-500 hover:text-primary-600"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 fill-primary-500 text-white" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-300" />
                  )}
                </button>

                <button
                  onClick={() => handlePrint(clothing)}
                  className="absolute top-4 right-4 z-10 text-gray-400 hover:text-primary-500 transition-colors"
                  title="补打取衣单"
                >
                  <Printer className="w-4 h-4" />
                </button>

                {overdue && (
                  <div className="absolute -top-2 -left-2 z-10">
                    <span className="bg-danger text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse-soft">
                      逾期
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4 pl-8">
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
                      <p
                        className="text-sm text-gray-400 font-mono cursor-pointer hover:text-primary-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/order/${clothing.id}`);
                        }}
                      >
                        {clothing.barcode} →
                      </p>
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
                    disabled={isUpdating}
                    className="btn w-full"
                    style={{
                      backgroundColor: STATUS_COLORS[STATUS_FLOW[clothing.status]!],
                      color: 'white',
                    }}
                  >
                    {isUpdating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    {isUpdating ? '更新中...' : nextStatus}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showPrintModal && printClothing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-600">补打取衣单</h3>
              <button onClick={() => setShowPrintModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <Receipt clothing={printClothing} />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowPrintModal(false)} className="btn btn-secondary flex-1">
                取消
              </button>
              <button onClick={handlePrintConfirm} className="btn btn-accent flex-1">
                <Printer className="w-4 h-4" />
                打印
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrintModal && printClothing && (
        <div className="hidden print:block fixed inset-0 bg-white z-50 print-receipt">
          <div className="p-8">
            <Receipt clothing={printClothing} />
          </div>
        </div>
      )}
    </div>
  );
}
