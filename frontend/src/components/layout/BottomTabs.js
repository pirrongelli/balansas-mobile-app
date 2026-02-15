import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, ArrowLeftRight, SendHorizontal, MoreHorizontal } from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'accounts', label: 'Accounts', icon: Wallet, path: '/accounts' },
  { id: 'transactions', label: 'Activity', icon: ArrowLeftRight, path: '/transactions' },
  { id: 'payments', label: 'Payments', icon: SendHorizontal, path: '/payments' },
  { id: 'more', label: 'More', icon: MoreHorizontal, path: '/more' },
];

export const BottomTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      data-testid="bottom-tabs"
      className="fixed bottom-0 inset-x-0 z-50 border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/0.72)] backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--card)/0.58)] pb-safe"
    >
      <div className="flex items-center justify-around max-w-[480px] mx-auto h-16">
        {tabs.map(tab => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              data-testid={`bottom-tab-${tab.id}`}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[48px] min-w-[48px] px-2 py-1 rounded-xl transition-colors duration-150 ${
                active
                  ? 'text-[hsl(var(--accent-teal))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.2 : 1.8} />
              <span className={`text-[10px] leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
