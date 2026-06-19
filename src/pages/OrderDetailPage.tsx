import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clothingApi } from '@/utils/api';
import { Clothing, CLOTHING_STATUS_LABELS, STATUS_COLORS, CLOTHING_TYPE_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_METHOD_COLORS, UpdateClothingRequest } from '../../shared/types';
import StatusBadge from '@/components/StatusBadge';
import Receipt from '@/components/Receipt';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Clothing | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateClothingRequest>({});
  const [saving, setSaving] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrder(parseInt(id));
    }
  }, [id]);

  const loadOrder = async (orderId: number) => {
    setLoading(true);
    try {
      const data = await clothingApi.getById(orderId);
      setOrder(data);
      setEditData({
        expectedPickupDate: data.expectedPickupDate,
        remark: data.remark,
        price: data.price,
      });
    } catch (e) {
      console.error('加载订单失败', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const updated = await clothingApi.update(order.id, editData);
      setOrder(updated);
      setEditing(false);
    } catch (e) {
      console.error('保存失败', e);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    setShowPrint(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setShowPrint(false), 100);
    }, 100);
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">未找到该订单</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {showPrint && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center print:block">
          <Receipt clothing={order} />
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold">订单详情</h1>
            <p className="text-sm text-gray-500 mt-1 font-mono">{order.barcode}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {order.status !== 'completed' && (
            <button
              onClick={() => setEditing(!editing)}
              className={`px-4 py-2 rounded-lg transition-colors ${editing
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {editing ? '取消编辑' : '编辑订单'}
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            补打取衣单
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              状态时间线
            </h2>
            <div className="relative">
              {order.statusHistory.map((record, index) => (
                <div key={index} className="flex gap-4 pb-6 last:pb-0">
                  <div className="relative flex flex-col items-center">
                    <div
                      className="w-4 h-4 rounded-full z-10"
                      style={{ backgroundColor: STATUS_COLORS[record.status] }}
                    />
                    {index < order.statusHistory.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 absolute top-4" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={record.status} />
                      <span className="text-sm text-gray-500 ml-2">
                        {formatDateTime(record.timestamp)}
                      </span>
                    </div>
                    {record.remark && (
                      <p className="text-sm text-gray-600 mt-1">{record.remark}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              订单信息
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">衣物类型</p>
                <p className="font-medium">{CLOTHING_TYPE_LABELS[order.clothingType]}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">收衣日期</p>
                <p className="font-medium">{order.receiveDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">取衣日期</p>
                {editing ? (
                  <input
                    type="date"
                    value={editData.expectedPickupDate || ''}
                    onChange={(e) => setEditData({ ...editData, expectedPickupDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="font-medium">{order.expectedPickupDate}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">价格</p>
                {editing ? (
                  <input
                    type="number"
                    value={editData.price || 0}
                    onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="font-medium text-lg text-red-600">¥{order.price.toFixed(2)}</p>
                )}
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">备注</p>
                {editing ? (
                  <textarea
                    value={editData.remark || ''}
                    onChange={(e) => setEditData({ ...editData, remark: e.target.value })}
                    placeholder="请输入备注"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="font-medium">{order.remark || '无'}</p>
                )}
              </div>
            </div>
            {editing && (
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditData({
                      expectedPickupDate: order.expectedPickupDate,
                      remark: order.remark,
                      price: order.price,
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            )}
          </div>

          {order.paymentMethod && order.paymentMethod !== 'none' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                收款信息
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">支付方式</p>
                  <span
                    className="inline-block px-2 py-1 rounded-full text-sm font-medium mt-1"
                    style={{
                      backgroundColor: `${PAYMENT_METHOD_COLORS[order.paymentMethod]}15`,
                      color: PAYMENT_METHOD_COLORS[order.paymentMethod],
                    }}
                  >
                    {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">实际取衣日期</p>
                  <p className="font-medium">{order.actualPickupDate || '-'}</p>
                </div>
              </div>
              {order.paymentDetails && order.paymentDetails.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-2">支付明细</p>
                  <div className="space-y-2">
                    {order.paymentDetails.map((detail, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span
                          className="text-sm"
                          style={{ color: PAYMENT_METHOD_COLORS[detail.method] }}
                        >
                          {PAYMENT_METHOD_LABELS[detail.method]}
                        </span>
                        <span className="font-medium">¥{detail.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              客户信息
            </h2>
            <div
              className="cursor-pointer hover:bg-gray-50 -mx-2 -my-2 p-2 rounded-lg transition-colors"
              onClick={() => navigate(`/customer?phone=${order.customerPhone}`)}
            >
              <p className="text-sm text-gray-500">客户姓名</p>
              <p className="font-medium">{order.customerName || '未命名客户'}</p>
              <p className="text-sm text-gray-500 mt-3">联系电话</p>
              <p className="font-medium font-mono">{order.customerPhone}</p>
              <p className="text-xs text-blue-600 mt-2">点击查看客户档案 →</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">快速操作</h2>
            <div className="space-y-3">
              <button
                onClick={handlePrint}
                className="w-full px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-left flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                补打取衣单
              </button>
              <button
                onClick={() => navigate(`/customer?phone=${order.customerPhone}`)}
                className="w-full px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-left flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                查看客户档案
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
