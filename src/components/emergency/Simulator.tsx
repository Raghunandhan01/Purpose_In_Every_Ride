import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  Zap, 
  TrendingUp, 
  ArrowRight,
  Gauge
} from 'lucide-react';
import { EmergencyFund, SimulationResult } from '../../types/emergencyFund';

interface SimulatorProps {
  funds: EmergencyFund[];
}

export default function Simulator({ funds }: SimulatorProps) {
  const activeFunds = funds.filter(f => f.status === 'Active' && f.currentSavings < f.targetAmount);
  
  const [selectedFundId, setSelectedFundId] = useState<string>('');
  const [dailyEarnings, setDailyEarnings] = useState<number>(1200); // Baseline average
  const [dailyExpenses, setDailyExpenses] = useState<number>(350);  // Fuel, snacks, vehicle wear
  const [savingsRate, setSavingsRate] = useState<number>(10);       // Allocate 10%
  
  const [result, setResult] = useState<SimulationResult | null>(null);

  // Set default selected fund when funds are loaded
  useEffect(() => {
    if (activeFunds.length > 0 && !selectedFundId) {
      setSelectedFundId(activeFunds[0]._id);
    }
  }, [activeFunds, selectedFundId]);

  // Recalculate simulation results on any slider change
  useEffect(() => {
    const fund = funds.find(f => f._id === selectedFundId);
    if (!fund) {
      setResult(null);
      return;
    }

    const remaining = Math.max(0, fund.targetAmount - fund.currentSavings);
    const dailySavingsSimulated = Math.max(0, (dailyEarnings - dailyExpenses) * (savingsRate / 100));

    let daysToTarget = Infinity;
    let simulatedCompletionDate = 'Never';

    if (dailySavingsSimulated > 0) {
      daysToTarget = Math.ceil(remaining / dailySavingsSimulated);
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + daysToTarget);
      simulatedCompletionDate = dateObj.toISOString().split('T')[0];
    }

    // Baseline calculation based on fund's own recommended daily savings
    const baselineDaysRemaining = fund.daysRemaining || 30;

    const completionDifferenceDays = isFinite(daysToTarget) 
      ? (baselineDaysRemaining - daysToTarget) 
      : 0;

    setResult({
      currentSavings: fund.currentSavings,
      targetAmount: fund.targetAmount,
      remaining,
      dailySavingsSimulated,
      daysToTarget,
      simulatedCompletionDate,
      baselineDaysRemaining,
      baselineCompletionDate: fund.preferredCompletionDate,
      completionDifferenceDays
    });

  }, [selectedFundId, dailyEarnings, dailyExpenses, savingsRate, funds]);

  if (activeFunds.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface-card p-6 h-full flex flex-col justify-center items-center text-center">
        <Gauge className="w-12 h-12 text-text-secondary/40 mb-3" />
        <h4 className="text-base font-bold text-text-primary">What-If Simulation</h4>
        <p className="text-xs text-text-secondary mt-1 max-w-sm">
          Please create an active, incomplete emergency fund first to test simulation parameters.
        </p>
      </div>
    );
  }

  const selectedFund = funds.find(f => f._id === selectedFundId);

  return (
    <div className="rounded-2xl border border-border bg-surface-card p-6 h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-text-primary tracking-tight">What-If Playground</h3>
        </div>
        <p className="text-xs text-text-secondary mb-6">
          Simulate how shifts in daily gig profits and custom savings allocations affect your timeline.
        </p>

        {/* Inputs */}
        <div className="space-y-5">
          {/* Fund Selector */}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-2 block">
              Choose Active Fund
            </label>
            <select
              value={selectedFundId}
              onChange={(e) => setSelectedFundId(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm font-medium text-text-primary focus:outline-none focus:border-primary cursor-pointer"
            >
              {activeFunds.map(f => (
                <option key={f._id} value={f._id}>{f.name} ({f.category})</option>
              ))}
            </select>
          </div>

          {/* Daily Earnings slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-text-secondary">Estimated Daily Earnings</span>
              <span className="font-bold text-text-primary">₹{dailyEarnings}</span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={dailyEarnings}
              onChange={(e) => setDailyEarnings(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer h-1.5 rounded-lg bg-surface border border-border"
            />
          </div>

          {/* Daily Expenses slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-text-secondary">Daily Operating Expenses (Fuel/Food)</span>
              <span className="font-bold text-text-primary text-danger">₹{dailyExpenses}</span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={dailyExpenses}
              onChange={(e) => setDailyExpenses(Number(e.target.value))}
              className="w-full accent-danger cursor-pointer h-1.5 bg-surface rounded-lg border border-border"
            />
          </div>

          {/* Savings Rate slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-text-secondary">Emergency Fund Savings Allocation</span>
              <span className="font-bold text-text-primary text-emerald-500">{savingsRate}% of Profit</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={savingsRate}
              onChange={(e) => setSavingsRate(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-surface rounded-lg border border-border"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Simulation Outputs */}
      {result && selectedFund && (
        <div className="mt-6 pt-5 border-t border-border/60 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface/50 p-3 rounded-xl border border-border/40">
              <span className="text-[10px] font-semibold text-text-secondary block">DAILY SAVINGS</span>
              <span className="text-base font-extrabold text-emerald-500">₹{Math.round(result.dailySavingsSimulated)}</span>
            </div>
            <div className="bg-surface/50 p-3 rounded-xl border border-border/40 text-right">
              <span className="text-[10px] font-semibold text-text-secondary block">DAYS TO GOAL</span>
              <span className="text-base font-extrabold text-text-primary">
                {isFinite(result.daysToTarget) ? `${result.daysToTarget} days` : 'Infinite'}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/5 to-emerald-500/5 p-4 rounded-xl border border-primary/10 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">PROJECTED FINISH</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                <span>{result.baselineCompletionDate}</span>
                <ArrowRight className="w-3 h-3 text-text-secondary" />
                <span className="text-emerald-500 font-bold">{result.simulatedCompletionDate}</span>
              </div>
            </div>

            {result.completionDifferenceDays > 0 ? (
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Zap className="w-3.5 h-3.5 fill-emerald-500" />
                  {result.completionDifferenceDays} Days Faster!
                </span>
              </div>
            ) : result.completionDifferenceDays < 0 ? (
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-danger/10 text-danger border border-danger/20">
                  Delayed by {Math.abs(result.completionDifferenceDays)} Days
                </span>
              </div>
            ) : (
              <div className="text-right">
                <span className="text-xs font-bold text-text-secondary">On Track</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
