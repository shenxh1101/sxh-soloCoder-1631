import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, Phone, Clock, AlertCircle, ScanLine, Wallet, Plus, Trash2 } from 'lucide-react';
import { Clothing, CLOTHING_TYPE_LABELS, STATUS_COLORS, PaymentMethod, PAYMENT_METHOD_LABELS, PAYMENT_METHOD_COLORS, PaymentDetail, PickupRequest } from '../../shared/types';
import { clothingApi } from '../utils/api';
import { useStore } from '../store/useStore';
import StatusBadge from '../components/StatusBadge';
import Barcode from '../components/Barcode';
import { isOverdue } from '../../shared/utils';

export default function PickupPage() {
  const navigate = useNavigate();
  const { updateClothingInList } = useStore();
  const [barcode, setBarcode] = useState('');
  const [clothing, setClothing] = useState<Clothing | null>(null);
  const [loading, setLoading] = useState(false);
  const [pickingUp, setPickingUp] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([{ method: 'cash', amount: 0 }]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async () => {
    if (!barcode.trim()) return;

    setLoading(true);
    setNotFound(false);
    setClothing(null);

    try {
      const result = await clothingApi.getByBarcode(barcode.trim().toUpperCase());
      setClothing(result);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setNotFound(true);
      } else {
        alert('查询失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePickup = async () => {
    if (!clothing || clothing.status === 'completed') return;

    let pickupData: PickupRequest;
    if (paymentMethod === 'mixed') {
      const hasZero = paymentDetails.some(d => d.amount <= 0);
      if (hasZero) {
        alert('每种支付方式的金额都必须大于0');
        return;
      }

      const total = paymentDetails.reduce((sum, d) => sum + d.amount, 0);
      if (Math.abs(total - clothing.price) > 0.01) {
        alert(`支付明细总额（¥${total.toFixed(2)}）与应付金额（¥${clothing.price.toFixed(2)}）不一致，请检查`);
        return;
      }

      const methods = paymentDetails.map(d => d.method);
      const hasDuplicate = new Set(methods).size !== methods.length;
      if (hasDuplicate) {
        alert('同一种支付方式只能出现一次');
        return;
      }

      pickupData = { paymentMethod, paymentDetails };
    } else {
      pickupData = { paymentMethod };
    }

    if (!confirm(`确认取衣？\n衣物：${CLOTHING_TYPE_LABELS[clothing.clothingType]}\n金额：¥${clothing.price.toFixed(2)}\n支付方式：${PAYMENT_METHOD_LABELS[paymentMethod]}`)) {
      return;
    }

    setPickingUp(true);
    try {
      const updated = await clothingApi.pickup(clothing.id, pickupData);
      setClothing(updated);
      updateClothingInList(updated);
      alert('取衣成功！');
    } catch (error) {
      alert('操作失败，请重试');
    } finally {
      setPickingUp(false);
    }
  };

  const handleCallCustomer = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleReset = () => {
    setBarcode('');
    setClothing(null);
    setNotFound(false);
    setPaymentMethod('cash');
    setPaymentDetails([{ method: 'cash', amount: 0 }]);
    inputRef.current?.focus();
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'mixed') {
      setPaymentDetails([{ method: 'cash', amount: clothing ? clothing.price / 2 : 0 }, { method: 'wechat', amount: clothing ? clothing.price / 2 : 0 }]);
    }
  };

  const handlePaymentDetailChange = (index: number, field: 'method' | 'amount', value: any) => {
    const updated = [...paymentDetails];
    if (field === 'amount') {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) return;
      updated[index] = { ...updated[index], amount: Math.round(num * 100) / 100 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setPaymentDetails(updated);
  };

  const addPaymentDetail = () => {
    setPaymentDetails([...paymentDetails, { method: 'cash', amount: 0 }]);
  };

  const removePaymentDetail = (index: number) => {
    if (paymentDetails.length <= 1) return;
    setPaymentDetails(paymentDetails.filter((_, i) => i !== index));
  };

  const simplePaymentMethods: PaymentMethod[] = ['cash', 'wechat', 'alipay', 'mixed'];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-600">取衣查询</h2>
          <p className="text-sm text-gray-400 mt-1">扫描或输入取衣单号，查询衣物状态并完成取衣</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="card p-6 mb-6 animate-fade-in animate-stagger-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center">
              <ScanLine className="w-4 h-4 text-primary-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600">扫描取衣单</h3>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={barcode}
                onChange={(e) => {
                  setBarcode(e.target.value);
                  setNotFound(false);
                }}
                onKeyDown={handleKeyDown}
                placeholder="使用扫码枪扫描或手动输入取衣单号..."
                className="input input-focus-breathe text-lg py-4 pl-12"
                autoComplete="off"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !barcode.trim()}
              className="btn btn-primary px-8"
            >
              {loading ? (
                <span className="animate-pulse">查询中...</span>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  查询
                </>
              )}
            </button>
          </div>

          {notFound && (
            <div className="mt-4 p-4 bg-danger/10 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
              <div>
                <p className="font-medium text-danger">未找到该取衣单</p>
                <p className="text-sm text-danger/70">请检查单号是否正确，或联系客户确认</p>
              </div>
            </div>
          )}
        </div>

        {clothing && (
          <div className="card overflow-hidden animate-fade-in animate-stagger-2">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-600 mb-1">
                    {CLOTHING_TYPE_LABELS[clothing.clothingType]}
                  </h3>
                  <p
                    className="text-sm text-gray-400 font-mono cursor-pointer hover:text-primary-500 transition-colors"
                    onClick={() => navigate(`/order/${clothing.id}`)}
                  >
                    {clothing.barcode} →
                  </p>
                </div>
                <StatusBadge status={clothing.status} size="md" />
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-center py-6 mb-6 bg-gradient-to-br from-primary-500/5 to-accent-500/5 rounded-xl border border-primary-500/10">
                <Barcode value={clothing.barcode} height={60} width={2} fontSize={14} />
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">客户电话</span>
                    <span className="font-medium flex items-center gap-2">
                      {clothing.customerPhone}
                      <button
                        onClick={() => handleCallCustomer(clothing.customerPhone)}
                        className="p-1.5 rounded-lg bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">收衣日期</span>
                    <span>{clothing.receiveDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">约定取衣</span>
                    <span className={isOverdue(clothing.expectedPickupDate, clothing.status) ? 'text-danger font-medium' : ''}>
                      {clothing.expectedPickupDate}
                    </span>
                  </div>
                  {clothing.actualPickupDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">实际取衣</span>
                      <span className="text-success font-medium">{clothing.actualPickupDate}</span>
                    </div>
                  )}
                  {clothing.paymentMethod && clothing.paymentMethod !== 'none' && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">支付方式</span>
                      <span 
                        className="font-medium"
                        style={{ color: PAYMENT_METHOD_COLORS[clothing.paymentMethod] }}
                      >
                        {PAYMENT_METHOD_LABELS[clothing.paymentMethod]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-gradient-to-br from-accent-500/10 to-accent-500/5 rounded-xl border border-accent-500/20">
                  <p className="text-sm text-gray-400 mb-1">应付金额</p>
                  <p className="text-4xl font-bold font-mono text-danger">
                    ¥{clothing.price.toFixed(2)}
                  </p>
                </div>
              </div>

              {clothing.remark && (
                <div className="p-4 bg-yellow-50 rounded-lg mb-6">
                  <p className="text-sm font-medium text-yellow-700 mb-1">客户备注</p>
                  <p className="text-yellow-800">{clothing.remark}</p>
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  状态流转记录
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {clothing.statusHistory.map((record, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className="px-3 py-1.5 rounded-lg text-sm font-medium"
                        style={{
                          backgroundColor: `${STATUS_COLORS[record.status]}15`,
                          color: STATUS_COLORS[record.status],
                        }}
                      >
                        {record.status === 'received' && '收衣'}
                        {record.status === 'washing' && '洗涤'}
                        {record.status === 'ironing' && '熨烫'}
                        {record.status === 'inspecting' && '质检'}
                        {record.status === 'waiting' && '待取'}
                        {record.status === 'completed' && '完成'}
                      </div>
                      {index < clothing.statusHistory.length - 1 && (
                        <span className="mx-1 text-gray-300">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {clothing.status !== 'completed' && (
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    选择支付方式
                  </p>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {simplePaymentMethods.map((method) => (
                      <button
                        key={method}
                        onClick={() => handlePaymentMethodChange(method)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          paymentMethod === method
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                          style={{ backgroundColor: `${PAYMENT_METHOD_COLORS[method]}15` }}
                        >
                          <span className="text-lg">
                            {method === 'cash' && '💵'}
                            {method === 'wechat' && '💚'}
                            {method === 'alipay' && '💙'}
                            {method === 'mixed' && '💳'}
                          </span>
                        </div>
                        <p
                          className="text-sm font-medium text-center"
                          style={{ color: paymentMethod === method ? PAYMENT_METHOD_COLORS[method] : '#86909C' }}
                        >
                          {PAYMENT_METHOD_LABELS[method]}
                        </p>
                      </button>
                    ))}
                  </div>
                  {paymentMethod === 'mixed' && (
                    <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                      {paymentDetails.map((detail, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <select
                            value={detail.method}
                            onChange={(e) => handlePaymentDetailChange(index, 'method', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          >
                            <option value="cash">现金</option>
                            <option value="wechat">微信支付</option>
                            <option value="alipay">支付宝</option>
                          </select>
                          <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                            <input
                              type="number"
                              value={detail.amount}
                              onChange={(e) => handlePaymentDetailChange(index, 'amount', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              step="0.01"
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <button
                            onClick={() => removePaymentDetail(index)}
                            disabled={paymentDetails.length <= 1}
                            className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addPaymentDetail}
                        className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        添加支付方式
                      </button>
                      <div className="flex justify-between pt-2 border-t border-gray-200 text-sm">
                        <span className="text-gray-500">应付金额</span>
                        <span className="font-medium">¥{clothing.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">已填金额</span>
                        <span
                          className={`font-medium ${
                            Math.abs(paymentDetails.reduce((s, d) => s + d.amount, 0) - clothing.price) <= 0.01
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          ¥{paymentDetails.reduce((s, d) => s + d.amount, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={handleReset} className="btn btn-secondary flex-1">
                  继续查询
                </button>
                {clothing.status !== 'completed' && (
                  <button
                    onClick={handlePickup}
                    disabled={pickingUp}
                    className="btn btn-success flex-1 text-base py-4"
                  >
                    {pickingUp ? (
                      <span className="animate-pulse">处理中...</span>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        确认取衣
                      </>
                    )}
                  </button>
                )}
                {clothing.status === 'completed' && (
                  <div className="flex-1 btn bg-gray-100 text-gray-400 cursor-not-allowed">
                    <Check className="w-5 h-5" />
                    已完成取衣
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!clothing && !notFound && (
          <div className="card p-12 text-center animate-fade-in animate-stagger-3">
            <div className="w-24 h-24 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ScanLine className="w-12 h-12 text-primary-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-500 mb-2">扫描取衣单</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              使用扫码枪扫描取衣单上的条码，或手动输入单号查询衣物信息
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
