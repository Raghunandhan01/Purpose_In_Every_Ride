import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, Receipt, BarChart3, FileText, User, Settings, LogOut, Briefcase, ListOrdered, LayoutGrid, Sparkles, PiggyBank } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { useLanguageTheme } from '../../context/LanguageThemeContext';
import Logo from '../ui/Logo';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, translationKey: 'dashboard' },
  { name: 'Earnings', href: '/dashboard/earnings', icon: Wallet, translationKey: 'earnings' },
  { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt, translationKey: 'expenses' },
  { name: 'Emergency Fund', href: '/dashboard/emergency-fund', icon: PiggyBank, translationKey: 'emergency_fund' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, translationKey: 'analytics' },
  { name: 'AI Predictor', href: '/dashboard/predictor', icon: Sparkles, translationKey: 'ai_predictor' },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText, translationKey: 'reports' },
  { name: 'Transactions', href: '/dashboard/transactions', icon: ListOrdered, translationKey: 'transactions' },
  { name: 'Platforms', href: '/dashboard/platforms', icon: Briefcase, translationKey: 'platforms' },
  { name: 'Apps', href: '/dashboard/apps', icon: LayoutGrid, translationKey: 'apps' },
];

const bottomNavItems = [
  { name: 'Profile', href: '/dashboard/profile', icon: User, translationKey: 'profile' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, translationKey: 'settings' },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useLanguageTheme();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
    if (onNavigate) onNavigate();
  };

  const handleLinkClick = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <div className="flex flex-col w-64 bg-surface-card border-r border-border h-screen sticky top-0">
      <div className="p-6 flex items-center gap-2.5 cursor-pointer" onClick={() => { navigate('/dashboard'); handleLinkClick(); }}>
        <Logo size={32} id="sidebar-logo" />
        <span className="text-xl font-bold text-primary tracking-tight">
          {t('scooter', 'Scooter')}
        </span>
      </div>

      <div className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-2 mt-4">
          {t('menu', 'Menu')}
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/dashboard'}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {t(item.translationKey, item.name)}
          </NavLink>
        ))}

        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-2 mt-8">
          {t('system', 'System')}
        </div>
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {t(item.translationKey, item.name)}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          {t('logout', 'Logout')}
        </button>
      </div>
    </div>
  );
}
