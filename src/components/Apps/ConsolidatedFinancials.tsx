import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, Award, Wallet, Coins, Percent, Calendar, Heart, Shield, Plus, Target, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

interface ConsolidatedFinancialsProps {
  workLogs: any[];
  connectedPlatforms: string[];
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'vehicle' | 'insurance' | 'emergency' | 'general';
}

export default function ConsolidatedFinancials({ workLogs, connectedPlatforms }: ConsolidatedFinancialsProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  
  // Savings Goal states
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([
    { id: '1', name: 'Electric Scooter Downpayment', targetAmount: 25000, currentAmount: 18400, targetDate: '2026-09-30', category: 'vehicle' },
    { id: '2', name: 'Annual Insurance Renewal', targetAmount: 6000, currentAmount: 4200, targetDate: '2026-11-15', category: 'insurance' },
    { id: '3', name: 'Emergency Contingency Fund', targetAmount: 15000, currentAmount: 3500, targetDate: '2026-12-31', category: 'emergency' }
  ]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<'vehicle' | 'insurance' | 'emergency' | 'general'>('vehicle');
  const [fundingGoalId, setFundingGoalId] = useState<string | null>(null);
  const [fundingAmount, setFundingAmount] = useState('');

  // 1. Process and aggregate financial data based on timeframe
  const aggregateData = () => {
    const today = new Date();
    let cutoffDate = new Date();

    if (timeframe === 'daily') {
      cutoffDate.setDate(today.getDate() - 1);
    } else if (timeframe === 'weekly') {
      cutoffDate.setDate(today.getDate() - 7);
    } else if (timeframe === 'monthly') {
      cutoffDate.setMonth(today.getMonth() - 1);
    } else if (timeframe === 'yearly') {
      cutoffDate.setFullYear(today.getFullYear() - 1);
    }

    const filteredLogs = workLogs.filter(log => new Date(log.date) >= cutoffDate);

    let grossEarnings = 0;
    let tips = 0;
    let bonusIncentives = 0;
    let fuelCost = 0;
    let maintenanceCost = 0;
    let foodExpense = 0;
    let otherExpenses = 0;
    let ordersCompleted = 0;
    let distanceTravelled = 0;
    let totalMinutes = 0;

    const platformBreakdown: Record<string, { gross: number; tips: number; bonus: number; orders: number; hours: number }> = {};

    filteredLogs.forEach(log => {
      const pKey = (log.platform || 'unknown').toLowerCase();
      
      const logGross = Number(log.grossEarnings || 0);
      const logTips = Number(log.tips || 0);
      const logBonus = Number(log.bonusIncentives || 0);
      const logFuel = Number(log.fuelCost || 0);
      const logMaint = Number(log.maintenanceCost || 0);
      const logFood = Number(log.foodExpense || 0);
      const logOther = Number(log.otherExpenses || 0);
      const logOrders = Number(log.ordersCompleted || 0);
      const logDistance = Number(log.distanceTravelled || 0);

      // Parse hours
      let logHours = 0;
      if (log.loginTime && log.logoutTime) {
        const [linH, linM] = log.loginTime.split(':').map(Number);
        const [loutH, loutM] = log.logoutTime.split(':').map(Number);
        if (!isNaN(linH) && !isNaN(loutH)) {
          logHours = (loutH + loutM/60) - (linH + linM/60);
          if (logHours < 0) logHours += 24; // Handle overnight shifts
        }
      } else {
        logHours = Number(log.hoursWorked || 8);
      }

      grossEarnings += logGross;
      tips += logTips;
      bonusIncentives += logBonus;
      fuelCost += logFuel;
      maintenanceCost += logMaint;
      foodExpense += logFood;
      otherExpenses += logOther;
      ordersCompleted += logOrders;
      distanceTravelled += logDistance;
      totalMinutes += logHours * 60;

      if (!platformBreakdown[pKey]) {
        platformBreakdown[pKey] = { gross: 0, tips: 0, bonus: 0, orders: 0, hours: 0 };
      }
      platformBreakdown[pKey].gross += logGross;
      platformBreakdown[pKey].tips += logTips;
      platformBreakdown[pKey].bonus += logBonus;
      platformBreakdown[pKey].orders += logOrders;
      platformBreakdown[pKey].hours += logHours;
    });

    const totalExpenses = fuelCost + maintenanceCost + foodExpense + otherExpenses;
    const taxesAndCommissions = Math.floor((grossEarnings + bonusIncentives) * 0.05); // Estimated 5% platform taxes / commission deduction
    const netProfit = (grossEarnings + tips + bonusIncentives) - totalExpenses - taxesAndCommissions;

    const totalHours = totalMinutes / 60;
    const earningsPerHour = totalHours > 0 ? (grossEarnings + tips + bonusIncentives) / totalHours : 0;
    const earningsPerKm = distanceTravelled > 0 ? (grossEarnings + tips + bonusIncentives) / distanceTravelled : 0;

    // Build platform charts
    const chartColors = ['#6F4E37', '#A67B5B', '#C19A6B', '#D2B48C', '#E6C280', '#ECB176', '#E4CDA2'];
    const pieData = Object.keys(platformBreakdown).map((p, idx) => ({
      name: p.charAt(0).toUpperCase() + p.slice(1),
      value: platformBreakdown[p].gross + platformBreakdown[p].tips + platformBreakdown[p].bonus,
      color: chartColors[idx % chartColors.length]
    }));

    const barData = Object.keys(platformBreakdown).map(p => ({
      name: p.charAt(0).toUpperCase() + p.slice(1),
      Gross: platformBreakdown[p].gross,
      Tips: platformBreakdown[p].tips,
      Incentives: platformBreakdown[p].bonus
    }));

    return {
      grossEarnings,
      tips,
      bonusIncentives,
      fuelCost,
      maintenanceCost,
      foodExpense,
      otherExpenses,
      totalExpenses,
      taxesAndCommissions,
      netProfit,
      ordersCompleted,
      distanceTravelled,
      totalHours,
      earningsPerHour,
      earningsPerKm,
      pieData,
      barData,
      logsCount: filteredLogs.length
    };
  };

  const financials = aggregateData();

  // 2. Add Savings Goal handler
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName || !newGoalTarget || !newGoalDate) {
      toast.error('Please fill in all goal parameters.');
      return;
    }

    const targetVal = parseFloat(newGoalTarget);
    if (isNaN(targetVal) || targetVal <= 0) {
      toast.error('Please enter a valid target payout amount.');
      return;
    }

    const newGoal: SavingsGoal = {
      id: Math.random().toString(),
      name: newGoalName,
      targetAmount: targetVal,
      currentAmount: 0,
      targetDate: newGoalDate,
      category: newGoalCategory
    };

    setSavingsGoals(prev => [...prev, newGoal]);
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalDate('');
    setShowAddGoal(false);
    toast.success(`🎯 Savings Goal "${newGoalName}" successfully created!`);
  };

  // 3. Fund Savings Goal
  const handleFundGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundingGoalId || !fundingAmount) return;

    const amt = parseFloat(fundingAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid transfer amount.');
      return;
    }

    if (amt > financials.netProfit) {
      toast.error('Insufficient calculated net profit in this timeframe to fund this amount!');
      return;
    }

    setSavingsGoals(prev => prev.map(g => {
      if (g.id === fundingGoalId) {
        const nextAmount = Math.min(g.currentAmount + amt, g.targetAmount);
        return { ...g, currentAmount: nextAmount };
      }
      return g;
    }));

    setFundingGoalId(null);
    setFundingAmount('');
    toast.success(`💰 Goal successfully funded with ${formatCurrency(amt)}!`);
  };

  return (
    <div className="space-y-8">
      {/* Timeframe Selector & Total Net Profit Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface border border-border p-6 rounded-2xl">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-text-primary">Consolidated Analytics Center</h3>
          <p className="text-xs text-text-secondary">Financial overview aggregate across all configured delivery partner connections.</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                timeframe === t
                  ? 'border-primary bg-primary text-white'
                  : 'border-border hover:bg-surface/50 text-text-secondary bg-surface-card'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Gross Income</span>
            <h4 className="text-xl font-black text-text-primary mt-0.5">
              {formatCurrency(financials.grossEarnings + financials.tips + financials.bonusIncentives)}
            </h4>
            <span className="text-[10px] text-text-secondary">Incl. Tips & Incentives</span>
          </div>
        </div>

        <div className="bg-surface border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Total Expenses</span>
            <h4 className="text-xl font-black text-text-primary mt-0.5">
              {formatCurrency(financials.totalExpenses)}
            </h4>
            <span className="text-[10px] text-error font-medium">Fuel: {formatCurrency(financials.fuelCost)}</span>
          </div>
        </div>

        <div className="bg-surface border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Estimated Taxes</span>
            <h4 className="text-xl font-black text-text-primary mt-0.5">
              {formatCurrency(financials.taxesAndCommissions)}
            </h4>
            <span className="text-[10px] text-text-secondary">5% Service & TDS</span>
          </div>
        </div>

        <div className="bg-surface border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm ring-2 ring-primary/20 bg-primary/5">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Net Profit</span>
            <h4 className="text-xl font-black text-success mt-0.5">
              {formatCurrency(financials.netProfit)}
            </h4>
            <span className="text-[10px] text-text-secondary">Net Margin Payout</span>
          </div>
        </div>
      </div>

      {/* Advanced Performance Metrics Row */}
      <div className="bg-surface border border-border p-6 rounded-2xl">
        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4">Rider Productivity Indices</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="border-r border-border/60 last:border-0">
            <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider block">Completed Shifts</span>
            <strong className="text-lg font-black text-text-primary block mt-1">{financials.logsCount} logs</strong>
          </div>
          <div className="border-r border-border/60 last:border-0">
            <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider block">Trips Completed</span>
            <strong className="text-lg font-black text-text-primary block mt-1">{financials.ordersCompleted} drops</strong>
          </div>
          <div className="border-r border-border/60 last:border-0">
            <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider block">Hourly Rate (Avg)</span>
            <strong className="text-lg font-black text-success block mt-1">{formatCurrency(financials.earningsPerHour)}/hr</strong>
          </div>
          <div className="last:border-0">
            <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider block">Kilometer Yield (Avg)</span>
            <strong className="text-lg font-black text-primary block mt-1">{formatCurrency(financials.earningsPerKm)}/km</strong>
          </div>
        </div>
      </div>

      {/* Charts & Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Earnings Share Chart */}
        <div className="lg:col-span-4 bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between min-h-[350px]">
          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Platform Earnings Share</h4>
            <p className="text-[10px] text-text-secondary mt-0.5">Gross payout distribution across connected clients.</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center relative">
            {financials.pieData.length === 0 ? (
              <span className="text-xs text-text-secondary">No data available for charts.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financials.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {financials.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend indicator list */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {financials.pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: d.color }} />
                <span className="text-text-secondary font-medium truncate">{d.name} ({formatCurrency(d.value)})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform breakdown metrics chart */}
        <div className="lg:col-span-8 bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between min-h-[350px]">
          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Revenue Breakdown by Platform</h4>
            <p className="text-[10px] text-text-secondary mt-0.5">Comparison of base pay, tips, and incentive achievements.</p>
          </div>

          <div className="h-64 w-full pt-4">
            {financials.barData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-text-secondary">No data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financials.barData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v: any) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Gross" fill="#6F4E37" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Tips" fill="#8E6F57" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Incentives" fill="#C19A6B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Profit & Loss Report Sheet */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border bg-surface-card flex justify-between items-center">
          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Rider Profit & Loss (P&L) Statement</h4>
            <p className="text-[10px] text-text-secondary mt-0.5">Detailed business statement tracking revenue vs costs of delivery.</p>
          </div>
          <span className="text-[10px] font-bold border border-border bg-surface px-2.5 py-1 rounded-lg text-text-primary">
            TIMEFRAME: {timeframe.toUpperCase()}
          </span>
        </div>

        <div className="divide-y divide-border text-xs">
          {/* Revenue */}
          <div className="p-4 bg-success/5 font-semibold text-success flex justify-between">
            <span>OPERATING REVENUE</span>
            <span>{formatCurrency(financials.grossEarnings + financials.tips + financials.bonusIncentives)}</span>
          </div>
          <div className="p-4 pl-8 flex justify-between text-text-secondary">
            <span>Base & Distance Fare</span>
            <span>{formatCurrency(financials.grossEarnings)}</span>
          </div>
          <div className="p-4 pl-8 flex justify-between text-text-secondary">
            <span>Incentives & Milestones</span>
            <span>{formatCurrency(financials.bonusIncentives)}</span>
          </div>
          <div className="p-4 pl-8 flex justify-between text-text-secondary">
            <span>Customer Tips (Direct)</span>
            <span>{formatCurrency(financials.tips)}</span>
          </div>

          {/* Operating Costs */}
          <div className="p-4 bg-error/5 font-semibold text-error flex justify-between">
            <span>DIRECT OPERATING COSTS</span>
            <span>{formatCurrency(financials.totalExpenses)}</span>
          </div>
          <div className="p-4 pl-8 flex justify-between text-text-secondary">
            <span>Fuel & Transit Expense</span>
            <span>{formatCurrency(financials.fuelCost)}</span>
          </div>
          <div className="p-4 pl-8 flex justify-between text-text-secondary">
            <span>Vehicle Maintenance & Repairs</span>
            <span>{formatCurrency(financials.maintenanceCost)}</span>
          </div>
          <div className="p-4 pl-8 flex justify-between text-text-secondary">
            <span>On-duty Food & Beverage</span>
            <span>{formatCurrency(financials.foodExpense)}</span>
          </div>
          <div className="p-4 pl-8 flex justify-between text-text-secondary">
            <span>Other Operating Overhead</span>
            <span>{formatCurrency(financials.otherExpenses)}</span>
          </div>

          {/* Deductions */}
          <div className="p-4 bg-surface-card font-semibold text-text-secondary flex justify-between">
            <span>PLATFORM DEDUCTIONS & TDS (5%)</span>
            <span>{formatCurrency(financials.taxesAndCommissions)}</span>
          </div>

          {/* Net Margin */}
          <div className="p-4 bg-primary/10 font-bold text-primary flex justify-between text-sm">
            <span>NET OPERATING PROFIT</span>
            <span>{formatCurrency(financials.netProfit)}</span>
          </div>
          <div className="p-4 pl-8 flex justify-between text-[11px] font-bold text-text-secondary">
            <span>Net Profit Margin Percentage</span>
            <span className="text-success">
              {financials.grossEarnings > 0 
                ? `${((financials.netProfit / (financials.grossEarnings + financials.tips + financials.bonusIncentives)) * 100).toFixed(1)}%`
                : '0.0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Savings Goals Tracker */}
      <div className="bg-surface border border-border p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Rider Savings Goals Tracker
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Lock in a portion of your delivery net profits towards long-term savings targets.
            </p>
          </div>

          {!showAddGoal && (
            <Button onClick={() => setShowAddGoal(true)} className="text-xs py-2">
              <Plus className="w-4 h-4 mr-1.5" /> New Savings Goal
            </Button>
          )}
        </div>

        {/* Add Goal Form overlay */}
        {showAddGoal && (
          <form onSubmit={handleAddGoal} className="p-5 border border-border bg-surface-card rounded-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">Create Savings Target</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-text-secondary mb-1">Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g. EV Scooter Battery"
                  className="w-full text-xs px-3 py-2 bg-surface border border-border rounded-xl text-text-primary"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-text-secondary mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  className="w-full text-xs px-3 py-2 bg-surface border border-border rounded-xl text-text-primary"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-text-secondary mb-1">Target Date</label>
                <input
                  type="date"
                  className="w-full text-xs px-3 py-2 bg-surface border border-border rounded-xl text-text-primary text-text-primary"
                  value={newGoalDate}
                  onChange={(e) => setNewGoalDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-text-secondary mb-1">Category</label>
                <select
                  className="w-full text-xs px-3 py-2 bg-surface border border-border rounded-xl text-text-primary"
                  value={newGoalCategory}
                  onChange={(e) => setNewGoalCategory(e.target.value as any)}
                >
                  <option value="vehicle">Vehicle / Scooter Maintenance</option>
                  <option value="insurance">Rider Insurance</option>
                  <option value="emergency">Emergency Reserves</option>
                  <option value="general">General Savings</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" className="text-xs" onClick={() => setShowAddGoal(false)}>Cancel</Button>
              <Button type="submit" className="text-xs">Create Goal</Button>
            </div>
          </form>
        )}

        {/* Funding Goal Dialog overlay */}
        {fundingGoalId && (
          <form onSubmit={handleFundGoal} className="p-4 border border-primary/20 bg-primary/5 rounded-xl flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-bold text-primary uppercase">Allocate Payout Net Profit</h4>
              <p className="text-[10px] text-text-secondary">
                Transfer money from your net profit: <strong className="text-success">{formatCurrency(financials.netProfit)}</strong> to your goal.
              </p>
            </div>
            
            <div className="w-full md:w-48">
              <label className="block text-[10px] font-semibold text-text-secondary mb-1">Allocation Amount (₹)</label>
              <input
                type="number"
                placeholder="₹1,000"
                className="w-full text-xs px-3 py-2 bg-surface border border-border rounded-xl text-text-primary"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="text-xs" onClick={() => setFundingGoalId(null)}>Cancel</Button>
              <Button type="submit" className="text-xs">Confirm Transfer</Button>
            </div>
          </form>
        )}

        {/* Goals List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {savingsGoals.map((goal) => {
            const pct = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
            return (
              <div key={goal.id} className="border border-border rounded-xl p-4.5 space-y-4 bg-surface-card flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-primary/10 text-primary rounded">
                      {goal.category}
                    </span>
                    <span className="text-[10px] text-text-secondary flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> By {goal.targetDate}
                    </span>
                  </div>
                  <h4 className="font-bold text-text-primary text-sm">{goal.name}</h4>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-text-secondary">Progress: <strong className="text-text-primary">{pct}%</strong></span>
                    <span className="text-text-primary">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border/40">
                    <div className="bg-success h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 flex justify-end">
                  {pct >= 100 ? (
                    <div className="text-success text-xs font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Goal Achieved!
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setFundingGoalId(goal.id);
                        setFundingAmount('');
                      }}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      Allocate Profits <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
