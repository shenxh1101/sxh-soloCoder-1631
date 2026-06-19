import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, RefreshCw, DollarSign, TrendingDown, Wallet, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { clothingApi } from '../utils/api';
import { DailyReconciliation, CLOTHING_TYPE_LABELS, PAYMENT_METHOD_COLORS, PAYMENT_METHOD_LABELS } from '../../shared/types';
import { formatDate } from '../../shared/utils';

export default function ReconciliationPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(formatDate(new Date()));
  const [data, setData] = useState<DailyReconciliation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await clothingApi.getDailyReconciliation(date);
      setData(result);
    } catch (e) {
      console.error('加载日结对账失败', e);
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(formatDate(d));
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">日结对账</h1>
          <p className="text-sm text-gray-500 mt-1">核对当日收款明细</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            打印对账单
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
          <Calendar className="w-5 h-5 text-blue-600" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-none outline-none text-lg font-medium"
          />
        </div>
        <button
          onClick={() => changeDate(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={loadData}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">营业收入</p>
                  <p className="text-2xl font-bold text-green-600">¥{data.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{data.totalCount} 笔交易</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">退款金额</p>
                  <p className="text-2xl font-bold text-red-600">¥{data.refundAmount.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{data.refundCount} 笔退款</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">实收金额</p>
                  <p className="text-2xl font-bold text-blue-600">¥{data.netRevenue.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">营收 - 退款</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">支付方式</p>
                  <p className="text-2xl font-bold text-purple-600">{data.paymentStats.length}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">种支付方式</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">支付方式汇总</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.paymentStats.length === 0 ? (
                <p className="text-gray-400 col-span-full text-center py-4">暂无收款记录</p>
              ) : (
                data.paymentStats.map((stat) => (
                  <div
                    key={stat.method}
                    className="p-4 rounded-xl border border-gray-100"
                    style={{ borderColor: `${PAYMENT_METHOD_COLORS[stat.method]}30` }}
                  >
                    <div
                      className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-2"
                      style={{
                        backgroundColor: `${PAYMENT_METHOD_COLORS[stat.method]}15`,
                        color: PAYMENT_METHOD_COLORS[stat.method],
                      }}
                    >
                      {stat.methodName}
                    </div>
                    <p className="text-2xl font-bold text-gray-700">¥{stat.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-400">{stat.count} 笔</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">收款明细</h2>
              <p className="text-sm text-gray-500 mt-1">共 {data.details.length} 条记录</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      取衣单号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      衣物类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      客户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      支付方式
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      金额
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.details.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        当日暂无收款记录
                      </td>
                    </tr>
                  ) : (
                    data.details.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/order/${item.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm text-gray-600">{item.barcode}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {CLOTHING_TYPE_LABELS[item.clothingType]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-gray-700">{item.customerName || '未命名'}</p>
                            <p className="text-xs text-gray-400">{item.customerPhone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${PAYMENT_METHOD_COLORS[item.paymentMethod!]}15`,
                              color: PAYMENT_METHOD_COLORS[item.paymentMethod!],
                            }}
                          >
                            {PAYMENT_METHOD_LABELS[item.paymentMethod!]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.exceptionType === 'refunded' ? (
                            <span className="text-red-600 font-medium">-¥{item.price.toFixed(2)}</span>
                          ) : (
                            <span className="text-green-600 font-medium">¥{item.price.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.exceptionType && item.exceptionType !== 'none' ? (
                            <span
                              className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: item.exceptionType === 'refunded' ? '#FEE2E2' : '#FEF3C7',
                                color: item.exceptionType === 'refunded' ? '#DC2626' : '#D97706',
                              }}
                            >
                              {item.exceptionType === 'refunded' ? '已退款' :
                                item.exceptionType === 'dispute' ? '客户争议' :
                                item.exceptionType === 'damaged' ? '衣物损坏' :
                                item.exceptionType === 'hold' ? '暂缓取衣' : item.exceptionType}
                            </span>
                          ) : (
                            <span className="text-green-600 text-sm">正常</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
