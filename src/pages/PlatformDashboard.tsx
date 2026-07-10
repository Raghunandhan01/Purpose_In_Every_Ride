import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Wallet, Clock, Navigation, TrendingUp, Download, 
  CheckCircle2, Edit2, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Calendar
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { formatCurrency } from '../utils/formatCurrency';
import api from '../lib/api';

const defaultPlatformLogos: Record<string, any> = {
  swiggy: { name: 'Swiggy', color: 'bg-orange-500', logo: 'S' },
  zomato: { name: 'Zomato', color: 'bg-red-500', logo: 'Z' },
  rapido: { name: 'Rapido', color: 'bg-yellow-400 text-black', logo: 'R' },
  blinkit: { name: 'Blinkit', color: 'bg-yellow-500 text-black', logo: 'B' },
  zepto: { name: 'Zepto', color: 'bg-purple-600', logo: 'Z' },
  instamart: { name: 'Instamart', color: 'bg-pink-500', logo: 'I' },
};

export default function PlatformDashboard() {
  const { platformId } = useParams();
  const navigate = useNavigate();
  
  const [platform, setPlatform] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal & Form States
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Detail View State
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<any | null>(null);

  // Table Interaction States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const calculateHours = (login: string, logout: string) => {
    if (!login || !logout) return 8;
    const [loginH, loginM] = login.split(':').map(Number);
    const [logoutH, logoutM] = logout.split(':').map(Number);
    let diff = (logoutH + logoutM / 60) - (loginH + loginM / 60);
    if (diff < 0) diff += 24; // Handle overnight shifts
    return Number(diff.toFixed(1));
  };

  const fetchData = async () => {
    try {
      const platformsRes = await api.get('/platforms');
      const plt = platformsRes.data.data.find((p: any) => p.id === platformId);
      if (plt) {
        const fallback = defaultPlatformLogos[plt.id] || { color: 'bg-primary', logo: plt.logo };
        setPlatform({ ...plt, color: fallback.color });
      }

      const logsRes = await api.get(`/worklogs?platform=${platformId}`);
      const data = logsRes.data.data || [];
      setLogs(data);

      // Compute advanced stats based on actual dates
      const todayStr = new Date().toISOString().split('T')[0];
      
      const dWeek = new Date();
      dWeek.setDate(dWeek.getDate() - 7);
      const lastWeekStr = dWeek.toISOString().split('T')[0];
      
      const dMonth = new Date();
      dMonth.setDate(dMonth.getDate() - 30);
      const lastMonthStr = dMonth.toISOString().split('T')[0];

      let totalE = 0, totalO = 0, totalH = 0, totalD = 0, totalT = 0, totalF = 0, totalI = 0, totalOther = 0;
      let todayE = 0, weeklyE = 0, monthlyE = 0;

      data.forEach((log: any) => {
        totalE += log.totalEarnings || 0;
        totalO += log.ordersCompleted || 0;
        totalH += log.hoursWorked || 0;
        totalD += log.distanceTravelled || 0;
        totalT += log.tips || 0;
        totalF += log.fuelCost || 0;
        totalI += log.bonusIncentives || 0;
        totalOther += log.otherExpenses || 0;

        if (log.date === todayStr) todayE += log.totalEarnings || 0;
        if (log.date >= lastWeekStr) weeklyE += log.totalEarnings || 0;
        if (log.date >= lastMonthStr) monthlyE += log.totalEarnings || 0;
      });

      setStats({
        todayEarnings: todayE,
        weeklyEarnings: weeklyE,
        monthlyEarnings: monthlyE,
        totalEarnings: totalE,
        totalOrders: totalO,
        totalHours: totalH,
        totalDistance: totalD,
        totalTips: totalT,
        totalIncentives: totalI,
        totalFuel: totalF,
        totalOther: totalOther,
        netProfit: totalE - totalF - totalOther,
        avgHours: data.length ? (totalH / data.length).toFixed(1) : 0,
        avgDistance: data.length ? (totalD / data.length).toFixed(1) : 0,
        avgOrder: totalO ? (totalE / totalO).toFixed(2) : 0,
      });

    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (platformId) {
      fetchData();
    }
  }, [platformId]);

  const onSubmit = async (data: any) => {
    try {
      const calculatedHours = calculateHours(data.loginTime, data.logoutTime);
      const payload = {
        platform: platformId,
        date: data.date,
        loginTime: data.loginTime,
        logoutTime: data.logoutTime,
        ordersCompleted: Number(data.orders),
        hoursWorked: calculatedHours,
        grossEarnings: Number(data.grossEarnings),
        tips: Number(data.tips || 0),
        bonusIncentives: Number(data.incentives || 0),
        distanceTravelled: Number(data.distance || 0),
        fuelCost: Number(data.fuelCost || 0),
        otherExpenses: Number(data.otherExpenses || 0),
        notes: data.notes
      };

      if (editingLogId) {
        const res = await api.put(`/worklogs/${editingLogId}`, payload);
        if (res.data.success) {
          toast.success('Log updated successfully!');
          fetchData();
        }
      } else {
        const res = await api.post('/worklogs', payload);
        if (res.data.success) {
          toast.success('Log added successfully!');
          fetchData();
        }
      }
      setIsLogModalOpen(false);
      reset();
      setEditingLogId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error saving log');
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this work log?')) return;
    try {
      await api.delete(`/worklogs/${id}`);
      toast.success('Log deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete log');
    }
  };

  const handleEdit = (log: any) => {
    setEditingLogId(log._id);
    setValue('date', log.date);
    setValue('orders', log.ordersCompleted);
    setValue('loginTime', log.loginTime);
    setValue('logoutTime', log.logoutTime);
    setValue('grossEarnings', log.grossEarnings);
    setValue('tips', log.tips);
    setValue('incentives', log.bonusIncentives);
    setValue('distance', log.distanceTravelled);
    setValue('fuelCost', log.fuelCost);
    setValue('otherExpenses', log.otherExpenses);
    setValue('notes', log.notes);
    setIsLogModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!platform) {
    return <div className="p-8 text-center text-text-secondary">Platform not found</div>;
  }

  // Generate Charts Data
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData = [
    { name: 'Mon', earnings: 0, orders: 0 },
    { name: 'Tue', earnings: 0, orders: 0 },
    { name: 'Wed', earnings: 0, orders: 0 },
    { name: 'Thu', earnings: 0, orders: 0 },
    { name: 'Fri', earnings: 0, orders: 0 },
    { name: 'Sat', earnings: 0, orders: 0 },
    { name: 'Sun', earnings: 0, orders: 0 },
  ];
  
  // Aggregate last 14 logs for day-of-week trends
  logs.slice(0, 14).forEach(log => {
    const day = new Date(log.date).getDay();
    const idx = day === 0 ? 6 : day - 1; // Mon=0..Sun=6
    weeklyData[idx].earnings += log.totalEarnings;
    weeklyData[idx].orders += log.ordersCompleted;
  });

  // Monthly breakdown trend (last 4 weeks)
  const monthlyData = [
    { name: 'Week 1', earnings: 0, orders: 0 },
    { name: 'Week 2', earnings: 0, orders: 0 },
    { name: 'Week 3', earnings: 0, orders: 0 },
    { name: 'Week 4', earnings: 0, orders: 0 },
  ];
  logs.forEach(log => {
    const dateDiff = Math.floor((new Date().getTime() - new Date(log.date).getTime()) / (1000 * 60 * 60 * 24));
    if (dateDiff < 7) {
      monthlyData[3].earnings += log.totalEarnings;
      monthlyData[3].orders += log.ordersCompleted;
    } else if (dateDiff < 14) {
      monthlyData[2].earnings += log.totalEarnings;
      monthlyData[2].orders += log.ordersCompleted;
    } else if (dateDiff < 21) {
      monthlyData[1].earnings += log.totalEarnings;
      monthlyData[1].orders += log.ordersCompleted;
    } else if (dateDiff < 30) {
      monthlyData[0].earnings += log.totalEarnings;
      monthlyData[0].orders += log.ordersCompleted;
    }
  });

  // Simple daily trend chart (chronological order)
  const dailyTrendData = [...logs]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10)
    .map(log => ({
      date: new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      Earnings: log.totalEarnings,
      Orders: log.ordersCompleted
    }));

  // Handle filtering & searching & sorting client-side
  const filteredLogs = logs
    .filter(log => {
      const matchSearch = (log.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.date.includes(searchQuery);
      const matchStatus = statusFilter === 'All' || 
                          (statusFilter === 'High Earning' && log.totalEarnings >= 1000) ||
                          (statusFilter === 'Low Earning' && log.totalEarnings < 1000);
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'date') {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination calculations
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard/apps')}
            className="p-2 bg-surface hover:bg-surface-card border border-border rounded-xl text-text-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-sm ${platform.color}`}>
              {platform.logo}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{platform.name} Dashboard</h1>
              <p className="text-text-secondary text-sm">Professional shift and revenue analytics</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="gap-2 flex-1 sm:flex-initial" 
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," 
                + ["Date,Login Time,LogoutTime,Orders,Hours,Gross,Tips,Incentives,Fuel,Net"].join(",") + "\n"
                + logs.map(l => [l.date, l.loginTime, l.logoutTime, l.ordersCompleted, l.hoursWorked, l.grossEarnings, l.tips, l.bonusIncentives, l.fuelCost, l.netProfit].join(",")).join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `${platform.name}_worklogs.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success('Platform worklogs exported successfully!');
            }}
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button className="gap-2 flex-1 sm:flex-initial" onClick={() => { reset(); setEditingLogId(null); setIsLogModalOpen(true); }}>
            <Plus className="w-4 h-4" /> Log Shift
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Today's Earnings</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.todayEarnings)}</p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-text-secondary">
              <Calendar className="w-3.5 h-3.5 text-primary-light" />
              <span>Current day stats</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Weekly Earnings</p>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.weeklyEarnings)}</p>
            <p className="text-xs text-success font-medium mt-2">Last 7 days total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Monthly Earnings</p>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.monthlyEarnings)}</p>
            <p className="text-xs text-success font-medium mt-2">Last 30 days total</p>
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-success uppercase tracking-wider mb-1">Cumulative Net Profit</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(stats.netProfit)}</p>
            <p className="text-xs text-text-secondary mt-2">Gross less expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Auxiliary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 text-center">
          <Clock className="w-5 h-5 text-primary mx-auto mb-1.5" />
          <p className="text-xs text-text-secondary">Hours Logged</p>
          <p className="text-lg font-bold text-text-primary mt-1">{stats.totalHours?.toFixed(1)}h</p>
        </Card>

        <Card className="p-4 text-center">
          <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1.5" />
          <p className="text-xs text-text-secondary">Completed Orders</p>
          <p className="text-lg font-bold text-text-primary mt-1">{stats.totalOrders}</p>
        </Card>

        <Card className="p-4 text-center">
          <Navigation className="w-5 h-5 text-accent mx-auto mb-1.5" />
          <p className="text-xs text-text-secondary">Distance Run</p>
          <p className="text-lg font-bold text-text-primary mt-1">{stats.totalDistance} km</p>
        </Card>

        <Card className="p-4 text-center">
          <TrendingUp className="w-5 h-5 text-primary-light mx-auto mb-1.5" />
          <p className="text-xs text-text-secondary">Avg per Order</p>
          <p className="text-lg font-bold text-text-primary mt-1">{formatCurrency(Number(stats.avgOrder))}</p>
        </Card>

        <Card className="p-4 text-center">
          <Wallet className="w-5 h-5 text-warning mx-auto mb-1.5" />
          <p className="text-xs text-text-secondary">Tips & Incentives</p>
          <p className="text-lg font-bold text-text-primary mt-1">{formatCurrency(stats.totalTips + stats.totalIncentives)}</p>
        </Card>

        <Card className="p-4 text-center">
          <Wallet className="w-5 h-5 text-danger mx-auto mb-1.5" />
          <p className="text-xs text-text-secondary">Fuel & Expenses</p>
          <p className="text-lg font-bold text-text-primary mt-1">{formatCurrency(stats.totalFuel + stats.totalOther)}</p>
        </Card>
      </div>

      {/* Analytics Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Daily Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-base font-semibold">Daily Earnings Trend (Recent Shifts)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6F4E37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6F4E37" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7DED5" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B5B53', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B5B53', fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} />
                  <Area type="monotone" dataKey="Earnings" stroke="#6F4E37" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEarnings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly vs Monthly Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Weekly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7DED5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B5B53', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B5B53', fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="earnings" name="Earnings" fill="#6F4E37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Monthly breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Performance Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7DED5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B5B53', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B5B53', fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="earnings" name="Earnings" fill="#8B5E37" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="orders" name="Orders" fill="#D2B48C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <CardTitle className="text-lg font-bold">Shift Log History</CardTitle>
            <p className="text-xs text-text-secondary mt-0.5">Search, sort and filter all recorded shifts</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
              <input 
                type="text" 
                placeholder="Search notes or dates..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-border bg-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-border bg-surface rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All Earnings</option>
              <option value="High Earning">High Earnings (≥ ₹1000)</option>
              <option value="Low Earning">Low Earnings (&lt; ₹1000)</option>
            </select>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => toggleSort('date')}>
                    <div className="flex items-center gap-1">
                      Date <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead>Hours Logged</TableHead>
                  <TableHead className="cursor-pointer text-center" onClick={() => toggleSort('ordersCompleted')}>
                    <div className="flex items-center justify-center gap-1">
                      Orders <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Tips</TableHead>
                  <TableHead className="text-right">Incentives</TableHead>
                  <TableHead className="text-right text-danger">Fuel & Exp</TableHead>
                  <TableHead className="cursor-pointer text-right font-bold text-success" onClick={() => toggleSort('netProfit')}>
                    <div className="flex items-center justify-end gap-1">
                      Net Profit <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-text-secondary">
                      No matching shift logs found. Try adjusting your filters or log a new shift!
                    </TableCell>
                  </TableRow>
                ) : paginatedLogs.map((t) => (
                  <TableRow key={t._id} className="hover:bg-surface/10 transition-colors">
                    <TableCell className="font-semibold whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary whitespace-nowrap">
                      {t.loginTime} - {t.logoutTime} ({t.hoursWorked}h)
                    </TableCell>
                    <TableCell className="text-center font-medium">{t.ordersCompleted}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(t.grossEarnings)}</TableCell>
                    <TableCell className="text-right text-success">+{formatCurrency(t.tips)}</TableCell>
                    <TableCell className="text-right text-success">+{formatCurrency(t.bonusIncentives)}</TableCell>
                    <TableCell className="text-right text-danger">-{formatCurrency(t.fuelCost + t.otherExpenses)}</TableCell>
                    <TableCell className="text-right font-bold text-success">{formatCurrency(t.netProfit)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-text-secondary" 
                          onClick={() => setSelectedLogForDetails(t)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-text-secondary" 
                          onClick={() => handleEdit(t)}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-danger" 
                          onClick={() => deleteTransaction(t._id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface/10">
              <p className="text-xs text-text-secondary">
                Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-semibold">{totalItems}</span> shifts
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-border rounded-lg bg-surface hover:bg-surface-card disabled:opacity-50 text-text-secondary transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-border rounded-lg bg-surface hover:bg-surface-card disabled:opacity-50 text-text-secondary transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Modal */}
      <Modal 
        isOpen={selectedLogForDetails !== null} 
        onClose={() => setSelectedLogForDetails(null)} 
        title="Shift Log Detailed Summary"
      >
        {selectedLogForDetails && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white ${platform.color}`}>
                {platform.logo}
              </div>
              <div>
                <h4 className="font-bold text-text-primary">{platform.name}</h4>
                <p className="text-xs text-text-secondary">
                  Shift date: {new Date(selectedLogForDetails.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-surface rounded-xl">
                <p className="text-xs text-text-secondary">Shift Timings</p>
                <p className="font-semibold text-text-primary mt-0.5">{selectedLogForDetails.loginTime} - {selectedLogForDetails.logoutTime}</p>
                <p className="text-xs text-text-secondary mt-0.5">({selectedLogForDetails.hoursWorked} hours logged)</p>
              </div>
              <div className="p-3 bg-surface rounded-xl">
                <p className="text-xs text-text-secondary">Deliveries Completed</p>
                <p className="font-semibold text-text-primary text-lg mt-0.5">{selectedLogForDetails.ordersCompleted} orders</p>
                <p className="text-xs text-text-secondary mt-0.5">{selectedLogForDetails.distanceTravelled} km distance run</p>
              </div>
            </div>

            <h5 className="font-semibold text-sm text-text-primary pt-2">Financial Breakdown</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-dashed border-border">
                <span className="text-text-secondary">Base Gross Pay</span>
                <span className="font-medium text-text-primary">{formatCurrency(selectedLogForDetails.grossEarnings)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-border">
                <span className="text-text-secondary">Tips Received</span>
                <span className="font-medium text-success">+{formatCurrency(selectedLogForDetails.tips)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-border">
                <span className="text-text-secondary">Bonus & Incentives</span>
                <span className="font-medium text-success">+{formatCurrency(selectedLogForDetails.bonusIncentives)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-border">
                <span className="text-text-secondary">Fuel Expenses</span>
                <span className="font-medium text-danger">-{formatCurrency(selectedLogForDetails.fuelCost)}</span>
              </div>
              {selectedLogForDetails.otherExpenses > 0 && (
                <div className="flex justify-between py-1 border-b border-dashed border-border">
                  <span className="text-text-secondary">Other Miscellaneous Expenses</span>
                  <span className="font-medium text-danger">-{formatCurrency(selectedLogForDetails.otherExpenses)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-base font-bold pt-3">
                <span className="text-text-primary">Net Profit</span>
                <span className="text-success">{formatCurrency(selectedLogForDetails.netProfit)}</span>
              </div>
            </div>

            {selectedLogForDetails.notes && (
              <div className="pt-2">
                <h5 className="font-semibold text-sm text-text-primary">Shift Notes</h5>
                <p className="text-xs text-text-secondary bg-surface p-3 rounded-xl mt-1 italic">
                  "{selectedLogForDetails.notes}"
                </p>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button onClick={() => setSelectedLogForDetails(null)}>Close View</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Log Work Log Modal Form */}
      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title={`${editingLogId ? 'Edit' : 'Record'} ${platform.name} Shift Log`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Date" type="date" {...register('date', { required: true })} />
            <Input label="Orders Completed" type="number" placeholder="e.g. 12" {...register('orders', { required: true })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Login Time" type="time" {...register('loginTime', { required: true })} />
            <Input label="Logout Time" type="time" {...register('logoutTime', { required: true })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Gross Earnings" type="number" icon={<span className="text-text-secondary">₹</span>} placeholder="Base and surge pay" {...register('grossEarnings', { required: true })} />
            <Input label="Tips" type="number" icon={<span className="text-text-secondary">₹</span>} placeholder="Customer tips" {...register('tips')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Incentives" type="number" icon={<span className="text-text-secondary">₹</span>} placeholder="Daily bonus/incentives" {...register('incentives')} />
            <Input label="Distance Travelled (km)" type="number" placeholder="e.g. 45" {...register('distance')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Fuel Cost" type="number" icon={<span className="text-text-secondary">₹</span>} placeholder="Petrol expense" {...register('fuelCost')} />
            <Input label="Other Expenses" type="number" icon={<span className="text-text-secondary">₹</span>} placeholder="e.g. food/toll" {...register('otherExpenses')} />
          </div>
          <Input label="Shift Notes" type="text" placeholder="Traffic issues, weather conditions, customer comments..." {...register('notes')} />

          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsLogModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Shift Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
