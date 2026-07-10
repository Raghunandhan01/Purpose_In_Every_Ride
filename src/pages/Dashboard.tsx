import React, { useEffect, useState } from 'react';
import { IndianRupee, Clock, CheckCircle2, TrendingUp, Wallet, Receipt, PieChart, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../components/dashboard/StatCard';
import EarningsChart from '../components/charts/EarningsChart';
import PlatformDistributionChart from '../components/charts/PlatformDistributionChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { formatCurrency } from '../utils/formatCurrency';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useLanguageTheme } from '../context/LanguageThemeContext';

const notifications = [
  { id: 1, title: 'Weekly Goal Achieved', time: '2 hours ago', type: 'success' },
  { id: 2, title: 'New Platform Added', time: '5 hours ago', type: 'info' },
  { id: 3, title: 'Fuel Expense High', time: '1 day ago', type: 'warning' },
];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguageTheme();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        if (res?.data?.success) {
          setStats(res.data.data);
        }
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-text-secondary">{t('loading', 'Loading dashboard...')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('dashboard_overview', 'Dashboard Overview')}</h1>
          <p className="text-text-secondary mt-1">{t('dashboard_subtitle', "Here's what's happening with your earnings today.")}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/reports')}>{t('export_report', 'Export Report')}</Button>
          <Button size="sm" onClick={() => navigate('/dashboard/apps')}>{t('add_entry', '+ Add Entry')}</Button>
        </div>
      </div>



      {/* Primary Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard 
          title={t('total_earnings', 'Total Earnings')} 
          value={formatCurrency(stats?.totalEarnings || 0)} 
          trend="+15.2%" 
          isPositive={true} 
          icon={Wallet} 
        />
        <StatCard 
          title={t('total_expenses', 'Total Expenses')} 
          value={formatCurrency(stats?.totalExpenses || 0)} 
          trend="-2.4%" 
          isPositive={true} 
          icon={Receipt} 
        />
        <StatCard 
          title={t('net_profit', 'Net Profit')} 
          value={formatCurrency(stats?.netProfit || 0)} 
          trend="+18.1%" 
          isPositive={true} 
          icon={PieChart} 
        />
      </div>

      {/* Secondary Metric Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-text-secondary mb-1">{t('todays_earnings', "Today's Earnings")}</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(stats?.todaysEarnings || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-text-secondary mb-1">{t('weekly_earnings', 'Weekly Earnings')}</p>
            <p className="text-xl font-bold text-text-primary">{formatCurrency(stats?.weeklyEarnings || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-text-secondary mb-1">{t('monthly_earnings', 'Monthly Earnings')}</p>
            <p className="text-xl font-bold text-text-primary">{formatCurrency(stats?.monthlyEarnings || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-text-secondary mb-1">{t('total_orders', 'Total Orders')}</p>
            <p className="text-xl font-bold text-text-primary">{stats?.totalOrders || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center col-span-2 lg:col-span-1">
            <p className="text-sm font-medium text-text-secondary mb-1">{t('working_hours', 'Working Hours')}</p>
            <p className="text-xl font-bold text-text-primary">{stats?.workingHours || 0} hrs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EarningsChart data={stats?.earningsChart || []} />
        </div>
        <div>
          <PlatformDistributionChart data={stats?.platformChart || []} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity logs={stats?.recentActivity || []} />
        </div>
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" /> {t('notifications_title', 'Notifications')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-2">
                {notifications.map(notification => (
                  <div key={notification.id} className="flex gap-3 items-start p-3 rounded-xl bg-surface/50 border border-border">
                    <div className={`w-2 h-2 mt-1.5 rounded-full ${
                      notification.type === 'success' ? 'bg-success' :
                      notification.type === 'warning' ? 'bg-danger' : 'bg-primary'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{notification.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{notification.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-sm">{t('view_all_notifications', 'View All Notifications')}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
