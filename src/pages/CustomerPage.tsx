import { useState, useEffect } from 'react';
import { Search, Phone, User, FileText, TrendingUp, Clock, Edit2, Save, X } from 'lucide-react';
import { customerApi, clothingApi } from '../utils/api';
import { Customer, CustomerDetail, CLOTHING_TYPE_LABELS, CLOTHING_STATUS_LABELS, STATUS_COLORS } from '../../shared/types';
import StatusBadge from '../components/StatusBadge';
import { isOverdue } from '../../shared/utils';
import { useNavigate } from 'react-router-dom';

export default function CustomerPage() {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingRemark, setEditingRemark] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRemark, setEditRemark] = useState('');

  useEffect(() => {
    loadRecentCustomers();
  }, []);

  const loadRecentCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerApi.getRecent(20);
      setCustomers(data);
    } catch (e) {
      console.error('加载客户列表失败', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      loadRecentCustomers();
      return;
    }
    try {
      setLoading(true);
      const result = await customerApi.search(searchKeyword);
      setCustomers(result.list);
    } catch (e) {
      console.error('搜索客户失败', e);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerDetail = async (phone: string) => {
    try {
      setDetailLoading(true);
      const detail = await customerApi.getByPhone(phone);
      setSelectedCustomer(detail);
      setEditName(detail.name || '');
      setEditRemark(detail.remark || '');
    } catch (e) {
      console.error('加载客户详情失败', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveRemark = async () => {
    if (!selectedCustomer) return;
    try {
      const updated = await customerApi.update(selectedCustomer.phone, {
        name: editName,
        remark: editRemark,
      });
      setSelectedCustomer(prev => prev ? { ...prev, name: updated.name, remark: updated.remark } : null);
      setEditingRemark(false);
      loadRecentCustomers();
    } catch (e) {
      console.error('保存客户信息失败', e);
    }
  };

  const handlePrintReceipt = (id: number) => {
    navigate(`/status?print=${id}`);
  };

  return (
    <div className="flex gap-6 h-full">
      <div className="w-80 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-600 mb-3">客户列表</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索手机号或姓名..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400">加载中...</div>
            ) : customers.length === 0 ? (
              <div className="p-8 text-center text-gray-400">暂无客户记录</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {customers.map((customer) => (
                  <div
                    key={customer.phone}
                    onClick={() => loadCustomerDetail(customer.phone)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedCustomer?.phone === customer.phone ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                        {(customer.name || customer.phone.slice(-4)).charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-600 truncate">
                          {customer.name || '未命名客户'}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {customer.totalCount} 件
                      </span>
                      <span className="text-primary-600 font-medium">
                        ¥{customer.totalAmount.toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1">
        {detailLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
            加载中...
          </div>
        ) : selectedCustomer ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur">
                      {(selectedCustomer.name || selectedCustomer.phone.slice(-4)).charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        {editingRemark ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-white/20 border border-white/30 rounded px-2 py-1 text-white placeholder-white/50 w-32"
                            placeholder="客户姓名"
                          />
                        ) : (
                          selectedCustomer.name || '未命名客户'
                        )}
                      </h2>
                      <p className="text-white/80 mt-1 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {selectedCustomer.phone}
                      </p>
                    </div>
                  </div>
                  {editingRemark ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveRemark}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white text-primary-600 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setEditingRemark(false);
                          setEditName(selectedCustomer.name || '');
                          setEditRemark(selectedCustomer.remark || '');
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingRemark(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      编辑
                    </button>
                  )}
                </div>

                {selectedCustomer.remark && (
                  <div className="mt-4 p-3 bg-white/10 rounded-lg backdrop-blur">
                    <p className="text-sm text-white/90">
                      <span className="font-medium">备注：</span>
                      {editingRemark ? (
                        <textarea
                          value={editRemark}
                          onChange={(e) => setEditRemark(e.target.value)}
                          className="mt-1 w-full bg-white/20 border border-white/30 rounded px-2 py-1 text-white placeholder-white/50"
                          rows={2}
                          placeholder="客户备注..."
                        />
                      ) : (
                        selectedCustomer.remark
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-4 p-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-600">{selectedCustomer.totalCount}</div>
                  <div className="text-sm text-gray-400 mt-1">累计送洗</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-primary-600">¥{selectedCustomer.totalAmount.toFixed(0)}</div>
                  <div className="text-sm text-gray-400 mt-1">累计消费</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-lg font-bold text-gray-600">
                    {selectedCustomer.favoriteType ? CLOTHING_TYPE_LABELS[selectedCustomer.favoriteType] : '-'}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">常洗类型</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-600">
                    {selectedCustomer.lastVisitDate || '-'}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">最近光顾</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-600 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-500" />
                  历史记录
                </h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {selectedCustomer.history.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">暂无历史记录</div>
                ) : (
                  selectedCustomer.history.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                            style={{ backgroundColor: STATUS_COLORS[item.status] }}
                          >
                            {CLOTHING_TYPE_LABELS[item.clothingType]?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-600">
                              {CLOTHING_TYPE_LABELS[item.clothingType]}
                            </div>
                            <div className="text-sm text-gray-400">
                              {item.barcode} · {item.receiveDate}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={item.status} />
                          <span className="text-primary-600 font-bold">¥{item.price}</span>
                          {isOverdue(item.expectedPickupDate, item.status) && (
                            <span className="px-2 py-1 bg-danger/10 text-danger text-xs font-medium rounded-full">
                              逾期
                            </span>
                          )}
                          <button
                            onClick={() => handlePrintReceipt(item.id)}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            补打
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">选择左侧客户查看详情</p>
          </div>
        )}
      </div>
    </div>
  );
}
