import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Shirt, DollarSign, AlertTriangle, Calendar } from 'lucide-react';
import { MonthlyStats, ClothingType, CLOTHING_TYPE_LABELS } from '../../shared/types';
import { statisticsApi } from '../utils/api';

const CHART_COLORS = ['#165DFF', '#722ED1', '#0FC6C2', '#00B42A', '#FF7D00'];

export default function StatisticsPage() {
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await statisticsApi.getMonthly(selectedYear, selectedMonth);
      setStats(data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const getTopType = () => {
    if (!stats || stats.typeStats.length === 0) return null;
    return stats.typeStats[0];
  };

  const pieData = stats?.typeStats.map(item => ({
    name: item.typeName,
    value: item.count,
  })) || [];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-600">统计分析</h2>
          <p className="text-sm text-gray-400 mt-1">查看月度经营数据和趋势分析</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent border-none outline-none text-gray-600 font-medium"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent border-none outline-none text-gray-600 font-medium"
            >
              {months.map(month => (
                <option key={month} value={month}>{month}月</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-6 animate-fade-in animate-stagger-1 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Shirt className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-white/70 text-sm">本月收衣</p>
          <p className="text-3xl font-bold font-mono mt-1">
            {loading ? '...' : stats?.totalCount || 0}
            <span className="text-lg font-normal ml-1">件</span>
          </p>
        </div>

        <div className="card p-6 animate-fade-in animate-stagger-2 bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-white/70 text-sm">本月收入</p>
          <p className="text-3xl font-bold font-mono mt-1">
            ¥{loading ? '...' : (stats?.totalRevenue || 0).toFixed(2)}
          </p>
        </div>

        <div className="card p-6 animate-fade-in animate-stagger-3">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple/10 rounded-xl flex items-center justify-center">
              <Shirt className="w-6 h-6 text-purple" />
            </div>
          </div>
          <p className="text-gray-400 text-sm">热门类型</p>
          <p className="text-2xl font-bold text-gray-600 mt-1">
            {loading ? '...' : (getTopType()?.typeName || '-')}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {getTopType() ? `${getTopType()!.count} 件` : ''}
          </p>
        </div>

        <div className="card p-6 animate-fade-in animate-stagger-4">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-danger/10 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger" />
            </div>
          </div>
          <p className="text-gray-400 text-sm">逾期未取</p>
          <p className="text-2xl font-bold text-danger mt-1">
            {loading ? '...' : stats?.overdueCount || 0}
            <span className="text-base font-normal text-gray-400 ml-1">件</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2 animate-fade-in animate-stagger-5">
          <h3 className="text-lg font-semibold text-gray-600 mb-4 flex items-center gap-2">
            <BarChart className="w-5 h-5 text-primary-500" />
            每日收衣趋势
          </h3>
          <div className="h-80">
            {stats && stats.dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E6EB" />
                  <XAxis
                    dataKey="date"
                    stroke="#86909C"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.split('-').slice(1).join('/')}
                  />
                  <YAxis stroke="#86909C" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E6EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} ${name === 'count' ? '件' : '元'}`,
                      name === 'count' ? '收衣量' : '收入',
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="count" name="收衣量" fill="#165DFF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" name="收入" fill="#FF7D00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                暂无数据
              </div>
            )}
          </div>
        </div>

        <div className="card p-6 animate-fade-in animate-stagger-5">
          <h3 className="text-lg font-semibold text-gray-600 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple" />
            衣物类型占比
          </h3>
          <div className="h-80">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} 件`, '数量']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E6EB',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                暂无数据
              </div>
            )}
          </div>
        </div>
      </div>

      {stats && stats.typeStats.length > 0 && (
        <div className="card p-6 mt-6 animate-fade-in animate-stagger-5">
          <h3 className="text-lg font-semibold text-gray-600 mb-4">类型明细</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">排名</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">衣物类型</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">数量</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">占比</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">进度条</th>
                </tr>
              </thead>
              <tbody>
                {stats.typeStats.map((item, index) => {
                  const percentage = stats.totalCount > 0 ? (item.count / stats.totalCount) * 100 : 0;
                  return (
                    <tr key={item.type} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-accent-500 text-white' :
                          index === 1 ? 'bg-gray-300 text-white' :
                          index === 2 ? 'bg-yellow-600 text-white' :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-600">{item.typeName}</td>
                      <td className="py-4 px-4 text-right font-mono font-semibold">{item.count} 件</td>
                      <td className="py-4 px-4 text-right text-gray-400">{percentage.toFixed(1)}%</td>
                      <td className="py-4 px-4 w-48">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
