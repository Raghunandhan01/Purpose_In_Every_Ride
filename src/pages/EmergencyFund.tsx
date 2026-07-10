import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles,
  ChevronRight,
  RefreshCw,
  Coins,
  DollarSign,
  CalendarDays,
  Percent
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import { EmergencyFund as FundType, EmergencyFundTransaction as TransType, FundSummary } from '../types/emergencyFund';
import FundCard from '../components/emergency/FundCard';
import Simulator from '../components/emergency/Simulator';
import AiAdvisor from '../components/emergency/AiAdvisor';
import TransactionList from '../components/emergency/TransactionList';
import FundFormModal from '../components/emergency/FundFormModal';
import TransactionModal from '../components/emergency/TransactionModal';

export default function EmergencyFund() {
  const [funds, setFunds] = useState<FundType[]>([]);
  const [summary, setSummary] = useState<FundSummary>({
    totalTarget: 0,
    totalSaved: 0,
    totalRemaining: 0,
    overallPercentage: 0,
    totalMonthlyExpenseEstimate: 0
  });
  const [transactions, setTransactions] = useState<TransType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal States
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  
  const [selectedFund, setSelectedFund] = useState<FundType | null>(null);
  const [activeTransType, setActiveTransType] = useState<'Contribution' | 'Withdrawal'>('Contribution');

  // Fetch all funds and summaries
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch funds
      const fundRes = await fetch('/api/emergency-fund', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const fundData = await fundRes.json();
      
      if (fundData.success) {
        setFunds(fundData.data || []);
        if (fundData.summary) {
          setSummary(fundData.summary);
        }
      }

      // Fetch transactions
      const transRes = await fetch('/api/emergency-fund/transactions/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const transData = await transRes.json();
      
      if (transData.success) {
        setTransactions(transData.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error. Failed to load emergency tracker details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handlers for Goal creation/update
  const handleFundSubmit = async (formData: any) => {
    try {
      const token = localStorage.getItem('token');
      const method = selectedFund ? 'PUT' : 'POST';
      const url = selectedFund ? `/api/emergency-fund/${selectedFund._id}` : '/api/emergency-fund';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        toast.success(selectedFund ? 'Emergency goal adjusted!' : 'New emergency goal launched! 🚀');
        fetchDashboardData();
      } else {
        toast.error(data.message || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit form.');
    }
  };

  // Handler for goal deletion
  const handleFundDelete = async (fund: FundType) => {
    if (!window.confirm(`Are you sure you want to permanently delete your "${fund.name}" goal? This will erase historical records.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/emergency-fund/${fund._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Goal deleted successfully');
        fetchDashboardData();
      } else {
        toast.error(data.message || 'Delete failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete goal.');
    }
  };

  // Handler for deposit / withdrawal
  const handleTransactionSubmit = async (fundId: string, transData: any) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/emergency-fund/${fundId}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(transData)
      });
      const data = await res.json();

      if (data.success) {
        toast.success(
          transData.type === 'Contribution' 
            ? 'Deposit added successfully! 💰' 
            : 'Withdrawal recorded.'
        );
        fetchDashboardData();
      } else {
        toast.error(data.message || 'Transaction failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to record transaction.');
    }
  };

  // Trigger deposit modal
  const triggerDeposit = (fund: FundType) => {
    setSelectedFund(fund);
    setActiveTransType('Contribution');
    setIsTransModalOpen(true);
  };

  // Trigger withdrawal modal
  const triggerWithdrawal = (fund: FundType) => {
    setSelectedFund(fund);
    setActiveTransType('Withdrawal');
    setIsTransModalOpen(true);
  };

  // Trigger Edit Goal modal
  const triggerEdit = (fund: FundType) => {
    setSelectedFund(fund);
    setIsFundModalOpen(true);
  };

  // Trigger Create Goal modal
  const triggerCreate = () => {
    setSelectedFund(null);
    setIsFundModalOpen(true);
  };

  // Generate Cumulative Savings Area Chart Data
  const generateChartData = () => {
    if (transactions.length === 0) return [];
    
    // Sort transactions by date ascending
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    
    let cumulative = 0;
    const datePoints: { [key: string]: number } = {};

    sorted.forEach(t => {
      if (t.type === 'Contribution') {
        cumulative += t.amount;
      } else {
        cumulative = Math.max(0, cumulative - t.amount);
      }
      // Group by date, overwrite with latest cumulative value on that date
      datePoints[t.date] = cumulative;
    });

    // Translate to recharts array
    return Object.entries(datePoints).map(([date, savings]) => ({
      date,
      savings
    })).sort((a, b) => a.date.localeCompare(b.date));
  };

  const chartData = generateChartData();

  // Smart notification banners
  const getSmartNotifications = () => {
    const notices = [];
    
    // Milestone congratulations
    funds.forEach(f => {
      if (f.percentage >= 100) {
        notices.push({
          type: 'success',
          text: `🎉 Congratulations! You fully funded your "${f.name}" target of ₹${f.targetAmount.toLocaleString('en-IN')}. Outstanding financial security built!`
        });
      } else if (f.percentage >= 75) {
        notices.push({
          type: 'info',
          text: `🚀 Milestone reached! Your "${f.name}" fund is 75% complete. You are extremely close to full cover.`
        });
      } else if (f.percentage >= 50) {
        notices.push({
          type: 'info',
          text: `👍 Halfway cover secured! Your "${f.name}" fund has surpassed the 50% milestone. Keep allocating those surplus tips!`
        });
      }
    });

    // Warning about low progress vs completion dates
    const incompleteFunds = funds.filter(f => f.percentage < 100);
    incompleteFunds.forEach(f => {
      if (f.daysRemaining < 15 && f.percentage < 50) {
        notices.push({
          type: 'warning',
          text: `⚠️ Timeline warning: Your "${f.name}" goal date is in ${f.daysRemaining} days, but you've completed only ${f.percentage}%. Consider allocating a higher surplus percentage.`
        });
      }
    });

    if (funds.length === 0) {
      notices.push({
        type: 'warning',
        text: '🛡️ Safety-Net Missing: You do not have any active emergency fund goals. Create a Medical or Vehicle Repair goal today to protect yourself from road surprises.'
      });
    }

    return notices;
  };

  const notifications = getSmartNotifications();

  // Compute total recommended savings rate
  const totalRecommendedDailySavings = funds
    .filter(f => f.status === 'Active')
    .reduce((sum, f) => sum + (f.recommendedDaily || 0), 0);

  const totalRecommendedMonthlySavings = funds
    .filter(f => f.status === 'Active')
    .reduce((sum, f) => sum + (f.recommendedMonthly || 0), 0);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-semibold text-text-secondary animate-pulse">Loading Emergency Fund Manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Upper Dashboard Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            Emergency Fund Tracker
          </h1>
          <p className="text-sm text-text-secondary">
            Protect your gig livelihoods. Set custom goals, manage allocations, and get Gemini AI strategies to save faster.
          </p>
        </div>
        <button
          onClick={triggerCreate}
          className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-surface font-semibold text-sm cursor-pointer shadow-md self-start md:self-auto transition-colors"
        >
          <Plus className="w-4 h-4" /> Launch Savings Goal
        </button>
      </div>

      {/* Smart Notification warnings slider */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((note, idx) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={idx}
              className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                note.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                  : note.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{note.text}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dynamic Summary Stats Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Total Target Card */}
        <div className="rounded-2xl border border-border bg-surface-card p-5 relative overflow-hidden">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Goal Target</div>
          <div className="text-2xl font-extrabold text-text-primary mt-1.5">
            ₹{summary.totalTarget.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-text-secondary mt-1">Sum of all emergency subcategories</div>
          <Coins className="w-10 h-10 text-text-secondary/10 absolute right-3 bottom-3" />
        </div>

        {/* Total Saved Card */}
        <div className="rounded-2xl border border-border bg-surface-card p-5 relative overflow-hidden">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Accrued Emergency Savings</div>
          <div className="text-2xl font-extrabold text-emerald-500 mt-1.5">
            ₹{summary.totalSaved.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-text-secondary mt-1">
            {summary.totalRemaining > 0 ? `₹${summary.totalRemaining.toLocaleString('en-IN')} remaining` : 'Fully funded! 🎉'}
          </div>
          <DollarSign className="w-10 h-10 text-emerald-500/5 absolute right-3 bottom-3" />
        </div>

        {/* Overall Completion Percentage */}
        <div className="rounded-2xl border border-border bg-surface-card p-5 relative overflow-hidden">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Buffer Protection</div>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-2xl font-extrabold text-primary">{summary.overallPercentage}%</span>
            <span className="text-xs font-semibold text-text-secondary">covered</span>
          </div>
          {/* Custom overall bar progress */}
          <div className="h-1.5 w-full bg-surface border border-border rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${summary.overallPercentage}%` }} />
          </div>
          <Percent className="w-10 h-10 text-primary/10 absolute right-3 bottom-3" />
        </div>

        {/* Recommended Daily Rate */}
        <div className="rounded-2xl border border-border bg-surface-card p-5 relative overflow-hidden">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Required Saving Pace</div>
          <div className="text-2xl font-extrabold text-text-primary mt-1.5">
            ₹{Math.round(totalRecommendedDailySavings)}<span className="text-xs text-text-secondary font-medium">/day</span>
          </div>
          <div className="text-xs text-text-secondary mt-1">
            or ₹{Math.round(totalRecommendedMonthlySavings).toLocaleString('en-IN')} per month
          </div>
          <CalendarDays className="w-10 h-10 text-text-secondary/10 absolute right-3 bottom-3" />
        </div>
      </div>

      {/* Main Core split section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals List - Takes 2 cols on Desktop */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary tracking-tight">Active Emergency Allocations</h2>
            <span className="text-xs font-semibold text-text-secondary">{funds.length} Active Goals</span>
          </div>

          {funds.length === 0 ? (
            <div className="rounded-2xl border border-border border-dashed p-12 text-center bg-surface-card/40 flex flex-col items-center justify-center">
              <ShieldCheck className="w-12 h-12 text-text-secondary/40 mb-3" />
              <h4 className="text-base font-bold text-text-primary">No emergency goals configured</h4>
              <p className="text-xs text-text-secondary mt-1 max-w-sm">
                Every delivery driver needs a backup fund to protect themselves from accidental damages, medical trips, and off-road downtime.
              </p>
              <button
                onClick={triggerCreate}
                className="mt-5 inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-primary hover:bg-primary-hover text-surface font-semibold text-xs cursor-pointer shadow-sm"
              >
                Create Medical or Vehicle Fund
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {funds.map(fund => (
                <FundCard
                  key={fund._id}
                  fund={fund}
                  onContribute={triggerDeposit}
                  onWithdraw={triggerWithdrawal}
                  onEdit={triggerEdit}
                  onDelete={handleFundDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Live Simulator - Takes 1 col */}
        <div>
          <Simulator funds={funds} />
        </div>
      </div>

      {/* Savings Trend and Gemini Advice Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cumulative Savings Trend AreaChart */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary tracking-tight">Accumulated Savings Growth</h3>
            <span className="text-xs text-text-secondary">Historical cumulative trajectory across all active safety-net funds.</span>
          </div>

          <div className="h-64 mt-6">
            {chartData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-text-secondary border border-border border-dashed rounded-xl bg-surface/30">
                Deposit money into any fund to generate historical trajectory charts.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary, #facc15)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="var(--color-primary, #facc15)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10}
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10} 
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px'
                    }}
                    labelStyle={{ fontSize: '10px', color: '#94a3b8' }}
                    itemStyle={{ fontSize: '12px', color: '#facc15', fontWeight: 'bold' }}
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Total Savings']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="savings" 
                    stroke="var(--color-primary, #facc15)" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#savingsGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gemini copilot */}
        <div className="lg:col-span-1">
          <AiAdvisor />
        </div>
      </div>

      {/* Detailed transaction grid & exports */}
      <TransactionList funds={funds} transactions={transactions} />

      {/* Modal - Fund Creation & Adjustments */}
      <FundFormModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
        onSubmit={handleFundSubmit}
        fund={selectedFund}
      />

      {/* Modal - Manual Cash Allocations */}
      <TransactionModal
        isOpen={isTransModalOpen}
        onClose={() => setIsTransModalOpen(false)}
        onSubmit={handleTransactionSubmit}
        fund={selectedFund}
        type={activeTransType}
      />
    </div>
  );
}
