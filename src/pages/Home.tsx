import { useState, useEffect } from 'react';
import { Plus, Printer, Phone, Calendar, Tag, FileText, Sparkles, User, Info } from 'lucide-react';
import { ClothingType, Clothing, DEFAULT_PRICES, CLOTHING_TYPE_LABELS, CreateClothingRequest, Customer } from '../../shared/types';
import { clothingApi, customerApi } from '../utils/api';
import { useStore } from '../store/useStore';
import StatusBadge from '../components/StatusBadge';
import Receipt from '../components/Receipt';

export default function Home() {
  const { addClothingToList } = useStore();
  const [formData, setFormData] = useState<CreateClothingRequest>({
    clothingType: 'suit',
    customerPhone: '',
    customerName: '',
    price: DEFAULT_PRICES.suit,
    expectedPickupDate: '',
    remark: '',
  });
  const [createdClothing, setCreatedClothing] = useState<Clothing | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<Customer | null>(null);
  const [showCustomerTip, setShowCustomerTip] = useState(false);

  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    setFormData(prev => ({
      ...prev,
      expectedPickupDate: defaultDate.toISOString().split('T')[0],
    }));
  }, []);

  const handleTypeChange = (type: ClothingType) => {
    setFormData(prev => ({
      ...prev,
      clothingType: type,
      price: DEFAULT_PRICES[type],
    }));
  };

  const handlePhoneChange = async (phone: string) => {
    setFormData(prev => ({ ...prev, customerPhone: phone }));
    setCustomerInfo(null);
    setShowCustomerTip(false);
    
    if (phone.length === 11) {
      try {
        const customer = await customerApi.getSimple(phone);
        if (customer) {
          setCustomerInfo(customer);
          setShowCustomerTip(true);
          setFormData(prev => ({
            ...prev,
            customerName: customer.name || prev.customerName,
          }));
        }
      } catch (e) {
        console.log('新客户');
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.customerPhone || !formData.price || !formData.expectedPickupDate) {
      alert('请填写完整信息');
      return;
    }

    setLoading(true);
    try {
      const clothing = await clothingApi.create(formData);
      setCreatedClothing(clothing);
      addClothingToList(clothing);
      setShowPreview(true);
      
      setTimeout(() => {
        if (confirm('是否现在打印取衣单？')) {
          window.print();
        }
      }, 300);
    } catch (error) {
      alert('登记失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNew = () => {
    setCreatedClothing(null);
    setShowPreview(false);
    setCustomerInfo(null);
    setShowCustomerTip(false);
    setFormData({
      clothingType: 'suit',
      customerPhone: '',
      customerName: '',
      price: DEFAULT_PRICES.suit,
      expectedPickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      remark: '',
    });
  };

  const clothingTypes: ClothingType[] = ['suit', 'coat', 'downjacket', 'dress', 'shirt'];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-600">收衣登记</h2>
          <p className="text-sm text-gray-400 mt-1">录入客户送洗衣物信息，生成取衣单</p>
        </div>
        {createdClothing && (
          <div className="flex gap-3">
            <button onClick={handleNew} className="btn btn-secondary">
              <Plus className="w-4 h-4" />
              继续登记
            </button>
            <button onClick={handlePrint} className="btn btn-accent">
              <Printer className="w-4 h-4" />
              打印取衣单
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 animate-fade-in animate-stagger-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600">衣物信息</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="label">衣物类型</label>
              <div className="grid grid-cols-5 gap-2">
                {clothingTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeChange(type)}
                    className={`py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      formData.clothingType === type
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {CLOTHING_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="label">
                  <Phone className="w-3 h-3 inline mr-1" />
                  客户电话
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="请输入手机号"
                  className="input input-focus-breathe"
                  maxLength={11}
                />
                {showCustomerTip && customerInfo && (
                  <div className="mt-2 p-3 bg-primary-50 rounded-lg border border-primary-200">
                    <div className="flex items-center gap-2 text-sm text-primary-600 font-medium mb-1">
                      <User className="w-4 h-4" />
                      老客户 · 第 {customerInfo.totalCount + 1} 次送洗
                    </div>
                    <div className="text-xs text-gray-500">
                      累计消费 ¥{customerInfo.totalAmount.toFixed(0)}
                      {customerInfo.favoriteType && ` · 常洗 ${CLOTHING_TYPE_LABELS[customerInfo.favoriteType]}`}
                    </div>
                    {customerInfo.remark && (
                      <div className="mt-2 text-xs text-accent-600 bg-accent-50 px-2 py-1 rounded">
                        <Info className="w-3 h-3 inline mr-1" />
                        {customerInfo.remark}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="label">
                  <Tag className="w-3 h-3 inline mr-1" />
                  客户姓名（选填）
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="请输入姓名"
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="text-danger">¥</span> 价格
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="input text-lg font-mono font-semibold text-danger"
                  step="0.01"
                />
              </div>
              <div>
                <label className="label">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  约定取衣日期
                </label>
                <input
                  type="date"
                  value={formData.expectedPickupDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedPickupDate: e.target.value }))}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">
                <FileText className="w-3 h-3 inline mr-1" />
                备注信息（选填）
              </label>
              <textarea
                value={formData.remark}
                onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                placeholder="例如：这件衣服有污渍洗不掉要提前说"
                rows={3}
                className="input resize-none"
              />
            </div>

            {!createdClothing && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-accent w-full text-base py-4"
              >
                {loading ? (
                  <span className="animate-pulse">登记中...</span>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    登记并生成取衣单
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="animate-fade-in animate-stagger-2">
          {showPreview && createdClothing ? (
            <div className="space-y-4">
              <div className="card p-4 bg-gradient-to-br from-primary-500/5 to-accent-500/5 border-2 border-primary-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-600">登记成功</span>
                  </div>
                  <StatusBadge status={createdClothing.status} />
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <Receipt clothing={createdClothing} />
                </div>
                <div className="mt-4 flex gap-3">
                  <button onClick={handlePrint} className="btn btn-accent flex-1">
                    <Printer className="w-4 h-4" />
                    打印取衣单
                  </button>
                  <button onClick={handleNew} className="btn btn-secondary flex-1">
                    <Plus className="w-4 h-4" />
                    继续登记
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-8 h-full flex flex-col items-center justify-center text-center bg-gradient-to-br from-gray-50 to-white">
              <div className="w-24 h-24 bg-primary-500/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-12 h-12 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-500 mb-2">取衣单预览</h3>
              <p className="text-sm text-gray-400 max-w-xs">
                填写左侧表单并点击"登记并生成取衣单"，这里将显示取衣单预览
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
