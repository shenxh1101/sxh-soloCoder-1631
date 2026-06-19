import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clothingApi } from '@/utils/api';
import { Clothing, CLOTHING_STATUS_LABELS, STATUS_COLORS, CLOTHING_TYPE_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_METHOD_COLORS, UpdateClothingRequest, ExceptionType, EXCEPTION_TYPE_LABELS, EXCEPTION_TYPE_COLORS, OPERATION_TYPE_LABELS, ExceptionRequest, RefundRequest } from '../../shared/types';
import StatusBadge from '@/components/StatusBadge';
import Receipt from '@/components/Receipt';
import { AlertTriangle, Clock, DollarSign, Edit3, Trash2, X, Check } from 'lucide-react';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Clothing | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateClothingRequest>({});
  const [saving, setSaving] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [exceptionType, setExceptionType] = useState<ExceptionType>('dispute');
  const [exceptionRemark, setExceptionRemark] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundRemark, setRefundRemark] = useState('');

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

  const handleMarkException = async () => {
    if (!order) return;
    try {
      const data: ExceptionRequest = {
        exceptionType,
        exceptionRemark: exceptionRemark || undefined,
      };
      const updated = await clothingApi.markException(order.id, data);
      setOrder(updated);
      setShowExceptionModal(false);
    } catch (e) {
      console.error('标记异常失败', e);
      alert('操作失败，请重试');
    }
  };

  const handleClearException = async () => {
    if (!order) return;
    if (!confirm('确定取消异常标记吗？')) return;
    try {
      const updated = await clothingApi.markException(order.id, { exceptionType: 'none' });
      setOrder(updated);
    } catch (e) {
      console.error('取消异常失败', e);
      alert('操作失败，请重试');
    }
  };

  const handleRefund = async () => {
    if (!order) return;
    if (!confirm(`确认退款 ¥${refundAmount.toFixed(2)} 吗？`)) return;
    try {
      const data: RefundRequest = {
        refundAmount,
        remark: refundRemark || undefined,
      };
      const updated = await clothingApi.refund(order.id, data);
      setOrder(updated);
      setShowRefundModal(false);
    } catch (e) {
      console.error('退款失败', e);
      alert('操作失败，请重试');
    }
  };

  const openRefundModal = () => {
    if (order) {
      setRefundAmount(order.price);
      setShowRefundModal(true);
    }
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

      <div className="flex items-center justify-between mb-4">
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

      {order.exceptionType && order.exceptionType !== 'none' && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center justify-between"
          style={{
            backgroundColor: `${EXCEPTION_TYPE_COLORS[order.exceptionType as Exclude<typeof order.exceptionType, 'none'>]}15`,
            borderLeft: `4px solid ${EXCEPTION_TYPE_COLORS[order.exceptionType as Exclude<typeof order.exceptionType, 'none'>]}`,
          }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle
              className="w-6 h-6"
              style={{ color: EXCEPTION_TYPE_COLORS[order.exceptionType as Exclude<typeof order.exceptionType, 'none'>] }}
            />
            <div>
              <p
                className="font-semibold"
                style={{ color: EXCEPTION_TYPE_COLORS[order.exceptionType as Exclude<typeof order.exceptionType, 'none'>] }}
              >
                {EXCEPTION_TYPE_LABELS[order.exceptionType as Exclude<typeof order.exceptionType, 'none'>]}
              </p>
              {order.exceptionRemark && (
                <p className="text-sm text-gray-600 mt-1">{order.exceptionRemark}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClearException}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            取消标记
          </button>
        </div>
      )}

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

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              操作记录
            </h2>
            {order.operationHistory && order.operationHistory.length > 0 ? (
              <div className="space-y-3">
                {[...order.operationHistory].reverse().map((record, index) => (
                  <div key={index} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      {record.type === 'create' && <Edit3 className="w-4 h-4 text-gray-500" />}
                      {record.type === 'price_change' && <DollarSign className="w-4 h-4 text-green-500" />}
                      {record.type === 'date_change' && <Clock className="w-4 h-4 text-blue-500" />}
                      {record.type === 'remark_change' && <Edit3 className="w-4 h-4 text-purple-500" />}
                      {(record.type === 'exception_mark' || record.type === 'exception_clear') && (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      )}
                      {record.type === 'pickup' && <Check className="w-4 h-4 text-green-500" />}
                      {record.type === 'refund' && <Trash2 className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-700">
                          {OPERATION_TYPE_LABELS[record.type]}
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatDateTime(record.timestamp)}
                        </span>
                      </div>
                      {(record.before !== undefined || record.after !== undefined) && (
                        <p className="text-sm text-gray-500 mt-1">
                          {record.type === 'price_change' && (
                            <>¥{record.before} → ¥{record.after}</>
                          )}
                          {record.type === 'date_change' && (
                            <>{record.before} → {record.after}</>
                          )}
                          {record.type === 'remark_change' && record.after !== '' && (
                            <>备注：{record.after || '(清空)'}</>
                          )}
                          {(record.type === 'exception_mark' || record.type === 'exception_clear') && (
                            <>
                              {record.before === 'none' ? '无' : 
                                record.before === 'dispute' ? '客户争议' :
                                record.before === 'damaged' ? '衣物损坏' :
                                record.before === 'hold' ? '暂缓取衣' :
                                record.before === 'refunded' ? '已退款' : record.before}
                              {' → '}
                              {record.after === 'none' ? '无' :
                                record.after === 'dispute' ? '客户争议' :
                                record.after === 'damaged' ? '衣物损坏' :
                                record.after === 'hold' ? '暂缓取衣' :
                                record.after === 'refunded' ? '已退款' : record.after}
                            </>
                          )}
                          {record.type === 'refund' && (
                            <>退款 ¥{record.after}</>
                          )}
                        </p>
                      )}
                      {record.remark && (
                        <p className="text-sm text-gray-500 mt-1">{record.remark}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">暂无操作记录</p>
            )}
          </div>
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
              {(!order.exceptionType || order.exceptionType === 'none') && (
                <button
                  onClick={() => setShowExceptionModal(true)}
                  className="w-full px-4 py-3 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors text-left flex items-center gap-3"
                >
                  <AlertTriangle className="w-5 h-5" />
                  标记异常
                </button>
              )}
              {order.exceptionType && order.exceptionType !== 'refunded' && order.status === 'completed' && (
                <button
                  onClick={openRefundModal}
                  className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-left flex items-center gap-3"
                >
                  <DollarSign className="w-5 h-5" />
                  申请退款
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showExceptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">标记异常</h3>
              <button
                onClick={() => setShowExceptionModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">异常类型</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['dispute', 'damaged', 'hold'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setExceptionType(type)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        exceptionType === type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p
                        className="font-medium"
                        style={{ color: EXCEPTION_TYPE_COLORS[type] }}
                      >
                        {EXCEPTION_TYPE_LABELS[type]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">异常说明</p>
                <textarea
                  value={exceptionRemark}
                  onChange={(e) => setExceptionRemark(e.target.value)}
                  placeholder="请输入异常说明..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExceptionModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleMarkException}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                确认标记
              </button>
            </div>
          </div>
        </div>
      )}

      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">申请退款</h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">退款金额</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">¥</span>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-3 text-xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">原金额：¥{order?.price.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">退款原因</p>
                <textarea
                  value={refundRemark}
                  onChange={(e) => setRefundRemark(e.target.value)}
                  placeholder="请输入退款原因..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRefund}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                确认退款
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
