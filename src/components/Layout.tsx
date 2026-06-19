import { NavLink } from 'react-router-dom';
import { Shirt, ClipboardList, Search, BarChart3, Shirt as ShirtIcon, Users, Calculator } from 'lucide-react';
import { ReactNode } from 'react';
import { useStore } from '../store/useStore';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { overdueList } = useStore();
  const navItems = [
    { path: '/', label: '收衣登记', icon: Shirt },
    { path: '/status', label: '状态管理', icon: ClipboardList },
    { path: '/pickup', label: '取衣查询', icon: Search },
    { path: '/customer', label: '客户档案', icon: Users },
    { path: '/reconciliation', label: '日结对账', icon: Calculator },
    { path: '/statistics', label: '统计分析', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm no-print">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <ShirtIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-600">洁衣管家</h1>
              <p className="text-xs text-gray-400">干洗店管理系统</p>
            </div>
          </div>

          {overdueList.length > 0 && (
            <div className="flex items-center gap-2 bg-danger/10 text-danger px-4 py-2 rounded-lg animate-pulse-soft">
              <span className="w-2 h-2 bg-danger rounded-full animate-pulse"></span>
              <span className="text-sm font-medium">
                {overdueList.length} 件逾期未取
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex">
        <aside className="w-56 bg-white border-r border-gray-100 py-6 no-print">
          <nav className="space-y-1 px-3">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                        : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          <div className="container mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
