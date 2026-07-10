import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Target, 
  Sliders, 
  TrendingUp, 
  PiggyBank, 
  TrendingDown, 
  Calendar, 
  Smartphone, 
  Laptop, 
  Home, 
  GraduationCap, 
  ShieldAlert, 
  Palmtree, 
  ChevronRight, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Award, 
  DollarSign, 
  Clock, 
  Package, 
  ArrowUpRight, 
  RefreshCw,
  Gauge
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguageTheme } from '../context/LanguageThemeContext';
import { formatCurrency } from '../utils/formatCurrency';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';

interface Goal {
  id: string;
  name: string;
  type: string;
  targetAmount: number;
  targetDate: string;
  savedAmount: number;
  createdAt: string;
}

interface Budget {
  category: string;
  limit: number;
}

const GOAL_TYPES = [
  { value: 'scooter', label: 'Scooter / Bike', icon: Gauge },
  { value: 'phone', label: 'Mobile Phone', icon: Smartphone },
  { value: 'laptop', label: 'Laptop', icon: Laptop },
  { value: 'house', label: 'House / Rent', icon: Home },
  { value: 'education', label: 'Education', icon: GraduationCap },
  { value: 'emergency', label: 'Emergency Fund', icon: ShieldAlert },
  { value: 'vacation', label: 'Vacation', icon: Palmtree },
  { value: 'other', label: 'Other Goal', icon: Target },
];

export default function AiPredictor() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguageTheme();

  // Loading States
  const [isCalculationsLoading, setIsCalculationsLoading] = useState(true);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Predictions State from Server
  const [predictionData, setPredictionData] = useState<any>(null);

  // What-If Simulation Controls (Defaults mapped to server state dynamically)
  const [simHours, setSimHours] = useState(8);
  const [simIncentives, setSimIncentives] = useState(1); // 1x, 1.2x etc
  const [simExpenses, setSimExpenses] = useState(150);
  const [simOrders, setSimOrders] = useState(10);

  // Future Goals State
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    type: 'scooter',
    targetAmount: 20000,
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 months out
    savedAmount: 0
  });

  // Budget State
  const [budgets, setBudgets] = useState<Budget[]>([
    { category: 'Fuel', limit: 3000 },
    { category: 'Food', limit: 2000 },
    { category: 'Maintenance', limit: 1500 },
    { category: 'EMI', limit: 1500 },
    { category: 'Rent', limit: 4000 },
    { category: 'Insurance', limit: 500 },
    { category: 'Miscellaneous', limit: 1000 }
  ]);
  const [editingBudgets, setEditingBudgets] = useState(false);

  // Load Saved Goals and Budgets from User document
  useEffect(() => {
    if (user) {
      if (user.goals) {
        try {
          setGoals(JSON.parse(user.goals));
        } catch (e) {
          console.error('Error parsing user goals:', e);
        }
      }
      if (user.budgets) {
        try {
          const parsedBudgets = JSON.parse(user.budgets);
          if (Array.isArray(parsedBudgets) && parsedBudgets.length > 0) {
            setBudgets(parsedBudgets);
          }
        } catch (e) {
          console.error('Error parsing user budgets:', e);
        }
      }
    }
  }, [user]);

  // Sync predictions and AI insights from server based on simulators
  const fetchPredictions = async (useSimValues = false) => {
    try {
      setIsCalculationsLoading(true);
      const queryParams = new URLSearchParams();
      if (useSimValues) {
        queryParams.append('simHours', simHours.toString());
        queryParams.append('simIncentives', simIncentives.toString());
        queryParams.append('simExpenses', simExpenses.toString());
        queryParams.append('simOrders', simOrders.toString());
      }

      const res = await api.get(`/predictions?${queryParams.toString()}`);
      if (res.data.success) {
        setPredictionData(res.data.data);
        
        // Update sliders with database averages on initial load
        if (!useSimValues) {
          setSimHours(res.data.data.historicalStats.avgHoursPerDay || 8);
          setSimExpenses(res.data.data.historicalStats.avgDailyExpenses || 120);
          setSimOrders(res.data.data.historicalStats.avgOrdersPerDay || 10);
        }
      }
    } catch (err: any) {
      toast.error('Could not fetch predictions from server');
    } finally {
      setIsCalculationsLoading(false);
    }
  };

  // Run initial fetch on mount
  useEffect(() => {
    fetchPredictions(false);
  }, []);

  // Handle saving goals list to cloud user profile
  const saveGoalsToCloud = async (updatedGoals: Goal[]) => {
    try {
      await updateUser({ goals: JSON.stringify(updatedGoals) });
    } catch (e) {
      toast.error('Failed to sync goals online');
    }
  };

  // Handle saving budgets list to cloud user profile
  const saveBudgetsToCloud = async (updatedBudgets: Budget[]) => {
    try {
      await updateUser({ budgets: JSON.stringify(updatedBudgets) });
      toast.success('Budgets updated successfully');
    } catch (e) {
      toast.error('Failed to sync budgets online');
    }
  };

  // Goal operations
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name) {
      toast.error('Please enter a goal name');
      return;
    }
    const added: Goal = {
      id: Math.random().toString(36).substring(2, 9),
      name: newGoal.name,
      type: newGoal.type,
      targetAmount: Number(newGoal.targetAmount),
      targetDate: newGoal.targetDate,
      savedAmount: Number(newGoal.savedAmount) || 0,
      createdAt: new Date().toISOString()
    };
    const updated = [...goals, added];
    setGoals(updated);
    saveGoalsToCloud(updated);
    setShowAddGoal(false);
    setNewGoal({
      name: '',
      type: 'scooter',
      targetAmount: 20000,
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      savedAmount: 0
    });
    toast.success('Financial goal created!');
  };

  const handleDeleteGoal = (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    saveGoalsToCloud(updated);
    toast.success('Goal removed');
  };

  const handleUpdateSavedAmount = (id: string, amount: number) => {
    const updated = goals.map(g => {
      if (g.id === id) {
        const val = Math.min(g.targetAmount, Math.max(0, amount));
        return { ...g, savedAmount: val };
      }
      return g;
    });
    setGoals(updated);
    saveGoalsToCloud(updated);
  };

  // Budget operations
  const handleBudgetLimitChange = (index: number, val: number) => {
    const next = [...budgets];
    next[index].limit = Math.max(0, val);
    setBudgets(next);
  };

  const handleSaveBudgets = () => {
    saveBudgetsToCloud(budgets);
    setEditingBudgets(false);
  };

  // Calculate days remaining helper
  const getDaysRemaining = (targetDateStr: string) => {
    const diff = new Date(targetDateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Milestone Badge Helper
  const getMilestoneBadge = (pct: number) => {
    if (pct >= 100) return { label: 'Diamond Achiever', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    if (pct >= 75) return { label: 'Gold Saver', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    if (pct >= 50) return { label: 'Silver Earner', color: 'bg-slate-400/10 text-slate-300 border-slate-400/20' };
    if (pct >= 25) return { label: 'Bronze Starter', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
    return { label: 'Early Phase', color: 'bg-primary/10 text-primary border-primary/20' };
  };

  // Strategy recommender calculator
  const calculateGoalStrategy = (goal: Goal, avgDailyProfit: number) => {
    const daysLeft = getDaysRemaining(goal.targetDate);
    const amountNeeded = Math.max(0, goal.targetAmount - goal.savedAmount);
    if (daysLeft === 0) return { dailySave: amountNeeded, extraHours: 0, strategy: 'Target date reached' };
    
    const dailySave = amountNeeded / daysLeft;
    
    // extra working hours = (dailySave - current average savings rate) / earningPerHour
    const currentSaveRate = avgDailyProfit * 0.4;
    const gap = Math.max(0, dailySave - currentSaveRate);
    const extraHours = predictionData?.historicalStats?.avgEarningsPerHour ? gap / predictionData.historicalStats.avgEarningsPerHour : gap / 100;
    
    let strategy = '';
    if (gap === 0) {
      strategy = 'On track! Your historical average saving speed easily clears this target.';
    } else if (extraHours <= 1) {
      strategy = 'Slightly short. Work 45-60 mins extra daily or log into premium Swiggy surge slots on weekends.';
    } else if (extraHours <= 3) {
      strategy = 'Action Required! Work 2 extra hours daily and focus on peak-hour deliveries on 2 high-paying platforms.';
    } else {
      strategy = 'Aggressive target. Consider extending target date by 30 days or using multi-platform login routines.';
    }

    return {
      dailySave: Math.round(dailySave),
      weeklySave: Math.round(dailySave * 7),
      extraHours: Number(extraHours.toFixed(1)),
      strategy
    };
  };

  return (
    <div className="space-y-8" id="ai-predictions-page">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            AI Predictions & Future Planner
          </h1>
          <p className="text-text-secondary mt-1">
            Predict future gig earnings, manage micro-budgets, and calculate custom financial strategies powered by Gemini.
          </p>
        </div>
        <button 
          onClick={() => fetchPredictions(true)}
          className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/20 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Recalculate Projections
        </button>
      </div>

      {/* Grid: 1. Gemini AI Advisory Box & What-If Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gemini AI Advice Card */}
        <div className="lg:col-span-2 bg-surface-card border border-border rounded-2xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Gemini Financial Advisor
              </h2>
              <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-mono">
                Gemini 3.5 Flash
              </span>
            </div>
            
            <div className="text-sm text-text-secondary space-y-4 leading-relaxed max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
              {predictionData?.aiAdvice ? (
                <div className="space-y-4 text-text-primary prose prose-invert max-w-none">
                  {predictionData.aiAdvice.split('\n\n').map((paragraph: string, i: number) => {
                    if (paragraph.startsWith('###')) {
                      return (
                        <h4 key={i} className="text-sm font-bold text-primary flex items-center gap-1.5 mt-4">
                          {paragraph.replace('###', '').trim()}
                        </h4>
                      );
                    }
                    return <p key={i} className="text-text-secondary text-xs">{paragraph}</p>;
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-text-secondary flex flex-col items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-border animate-spin mb-3" />
                  <p>Assembling historical worklogs and loading Gemini Advisor...</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border mt-6 pt-4 flex justify-between items-center text-xs text-text-secondary">
            <span>Powered by dynamic context injection</span>
            <button 
              onClick={() => {
                setIsAiGenerating(true);
                fetchPredictions(true).then(() => {
                  setIsAiGenerating(false);
                  toast.success('Gemini analysis updated!');
                });
              }}
              disabled={isAiGenerating}
              className="flex items-center gap-1.5 text-primary font-semibold hover:underline cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
              Ask Advisor to Refine Tips
            </button>
          </div>
        </div>

        {/* What-If Simulation Sandbox */}
        <div className="bg-surface-card border border-border rounded-2xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-2">
              <Sliders className="w-5 h-5 text-primary" />
              What-If Sandbox
            </h2>
            <p className="text-xs text-text-secondary mb-6">
              Simulate adjusting shifts, surge bonuses, or fuel costs to forecast earnings and savings immediately.
            </p>

            <div className="space-y-5 text-sm">
              {/* Daily hours slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-text-secondary">Daily Work Shift</span>
                  <span className="text-primary">{simHours} hours</span>
                </div>
                <input 
                  type="range" 
                  min="4" 
                  max="16" 
                  step="0.5"
                  value={simHours}
                  onChange={(e) => setSimHours(Number(e.target.value))}
                  className="w-full accent-primary bg-border h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Order volume slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-text-secondary">Completed Deliveries</span>
                  <span className="text-primary">{simOrders} orders</span>
                </div>
                <input 
                  type="range" 
                  min="3" 
                  max="25" 
                  value={simOrders}
                  onChange={(e) => setSimOrders(Number(e.target.value))}
                  className="w-full accent-primary bg-border h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Incentives / peak multipliers slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-text-secondary">Incentives / Surge</span>
                  <span className="text-primary">{simIncentives}x Multiplier</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.1"
                  value={simIncentives}
                  onChange={(e) => setSimIncentives(Number(e.target.value))}
                  className="w-full accent-primary bg-border h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Daily Fuel/Other Expenses slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-text-secondary">Daily Expenses (Fuel/Food)</span>
                  <span className="text-primary">{formatCurrency(simExpenses)}</span>
                </div>
                <input 
                  type="range" 
                  min="30" 
                  max="400" 
                  step="10"
                  value={simExpenses}
                  onChange={(e) => setSimExpenses(Number(e.target.value))}
                  className="w-full accent-primary bg-border h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-6">
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Simulated Daily Net Profit</span>
              <span className="font-semibold text-text-primary">
                {formatCurrency(predictionData?.simulationResult?.predictedDailyNetProfit || 0)}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-text-secondary">Simulated Monthly Savings (40%)</span>
              <span className="text-lg font-extrabold text-primary">
                {formatCurrency(predictionData?.simulationResult?.predictedMonthlySavings || 0)}
              </span>
            </div>
            <button 
              onClick={() => fetchPredictions(true)}
              className="w-full mt-3 bg-primary text-background font-bold text-xs py-2 rounded-lg hover:bg-primary-hover transition-colors cursor-pointer"
            >
              Apply Simulation Parameters
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 2. Confidence Predictions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Earning Predictions & Confidence Ranges
          </h2>
          <span className="text-xs text-text-secondary">Based on historical work logs</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {predictionData?.predictions && Object.entries(predictionData.predictions).map(([interval, data]: [string, any]) => (
            <div key={interval} className="bg-surface-card border border-border rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-1 bg-primary" style={{ width: `${data.confidence}%` }} />
              
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">{interval} Forecast</span>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-mono">
                  {data.confidence}% Confidence
                </span>
              </div>

              <div>
                <p className="text-xs text-text-secondary">Expected Gross</p>
                <p className="text-2xl font-black text-text-primary mt-1">
                  {formatCurrency(data.expected)}
                </p>
              </div>

              <div className="space-y-1.5 border-t border-border/50 pt-3 text-xs text-text-secondary">
                <div className="flex justify-between">
                  <span>Lower Range:</span>
                  <span className="font-semibold text-danger">{formatCurrency(data.low)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Upper Range:</span>
                  <span className="font-semibold text-emerald-400">{formatCurrency(data.high)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Expenses:</span>
                  <span className="font-medium text-text-primary">{formatCurrency(data.expenses)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-border/50 pt-1.5">
                  <span className="font-semibold text-primary">Est. Net Profit:</span>
                  <span className="font-bold text-primary">{formatCurrency(data.netProfit)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: 3. Visual Charts & Budget Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cash Flow Forecast (Area Chart) */}
        <div className="lg:col-span-2 bg-surface-card border border-border rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-primary" />
                12-Month Cash Flow & Savings Forecast
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Forecasting net profits and growing savings balances factoring seasonal gig spikes.
              </p>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {predictionData?.cashFlowForecast ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={predictionData.cashFlowForecast}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary, #10B981)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="var(--color-primary, #10B981)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="rgba(255,255,255,0.4)" 
                    fontSize={11} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.4)" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${v}`} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(24, 24, 27, 0.95)', 
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px'
                    }}
                    labelStyle={{ color: 'white', fontWeight: 'bold' }}
                    itemStyle={{ color: 'var(--color-primary, #10B981)' }}
                  />
                  <Area 
                    name="Growing Balance" 
                    type="monotone" 
                    dataKey="CumulativeSavings" 
                    stroke="var(--color-primary, #10B981)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorSavings)" 
                  />
                  <Area 
                    name="Net Monthly Profit" 
                    type="monotone" 
                    dataKey="NetProfit" 
                    stroke="#3B82F6" 
                    strokeWidth={1}
                    fillOpacity={0.05} 
                    fill="#3B82F6" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-text-secondary">Generating savings curve chart...</p>
              </div>
            )}
          </div>
        </div>

        {/* Budget Planning Card */}
        <div className="bg-surface-card border border-border rounded-2xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-danger" />
                Monthly Budget Limits
              </h2>
              {editingBudgets ? (
                <button 
                  onClick={handleSaveBudgets}
                  className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-xl hover:bg-emerald-500/25 transition-all cursor-pointer font-semibold"
                >
                  Save Limits
                </button>
              ) : (
                <button 
                  onClick={() => setEditingBudgets(true)}
                  className="text-xs text-primary hover:underline cursor-pointer font-semibold"
                >
                  Edit Budgets
                </button>
              )}
            </div>

            <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
              {budgets.map((b, idx) => {
                // Find actual spend percent (server estimated category average vs user limit)
                const serverEst = predictionData?.spendingCategories?.find((cat: any) => cat.name === b.category)?.amount || 0;
                const percent = Math.min(100, Math.round((serverEst / b.limit) * 100)) || 0;
                
                return (
                  <div key={b.category} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-baseline font-semibold">
                      <span className="text-text-primary">{b.category}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-text-secondary">Est. Spend: {formatCurrency(Math.round(serverEst))}</span>
                        <span className="text-text-secondary">/</span>
                        {editingBudgets ? (
                          <input 
                            type="number" 
                            value={b.limit}
                            onChange={(e) => handleBudgetLimitChange(idx, Number(e.target.value))}
                            className="w-16 bg-surface border border-border px-1.5 py-0.5 rounded text-right text-primary font-mono"
                          />
                        ) : (
                          <span className="text-text-primary font-mono">{formatCurrency(b.limit)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          percent > 100 ? 'bg-danger' : percent > 80 ? 'bg-amber-400' : 'bg-primary'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-3.5 mt-4 text-xs">
            <div className="flex justify-between text-text-secondary mb-1">
              <span>Total Budgeted Limits:</span>
              <span className="font-semibold text-text-primary">
                {formatCurrency(budgets.reduce((acc, b) => acc + b.limit, 0))}
              </span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Avg Spending Estimate:</span>
              <span className="font-semibold text-text-primary">
                {formatCurrency(Math.round(predictionData?.spendingCategories?.reduce((acc: number, c: any) => acc + c.amount, 0) || 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Future Planning Manager (Financial Goals Section) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Future Planning Manager (Financial Goals)
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Establish and track real-life milestone goals (e.g., buying a bike, phone, laptop, or setting up an emergency fund).
            </p>
          </div>
          
          <button 
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="flex items-center gap-1.5 bg-primary text-background font-bold px-4 py-2 rounded-xl text-xs hover:bg-primary-hover transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Set New Financial Goal
          </button>
        </div>

        {/* Create Goal Form */}
        {showAddGoal && (
          <form onSubmit={handleAddGoal} className="bg-surface-card border border-border rounded-2xl p-6 shadow-sm max-w-2xl animate-fade-in space-y-4">
            <h3 className="text-sm font-bold text-text-primary">Configure Your Financial Target</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-text-secondary">Goal Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Buying TVS iQube Scooter"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  className="w-full bg-surface border border-border px-3.5 py-2 rounded-xl text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-secondary">Goal Category</label>
                <select 
                  value={newGoal.type}
                  onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value })}
                  className="w-full bg-surface border border-border px-3.5 py-2 rounded-xl text-text-primary focus:outline-none focus:border-primary"
                >
                  {GOAL_TYPES.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-secondary">Target Amount (₹)</label>
                <input 
                  type="number" 
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
                  className="w-full bg-surface border border-border px-3.5 py-2 rounded-xl text-text-primary font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-secondary">Initial Seed Savings (₹)</label>
                <input 
                  type="number" 
                  value={newGoal.savedAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, savedAmount: Number(e.target.value) })}
                  className="w-full bg-surface border border-border px-3.5 py-2 rounded-xl text-text-primary font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="font-semibold text-text-secondary">Target Completion Date</label>
                <input 
                  type="date" 
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  className="w-full bg-surface border border-border px-3.5 py-2 rounded-xl text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 text-xs">
              <button 
                type="button" 
                onClick={() => setShowAddGoal(false)}
                className="bg-border/20 text-text-primary px-4 py-2 rounded-xl hover:bg-border/30 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="bg-primary text-background font-bold px-5 py-2 rounded-xl hover:bg-primary-hover transition-colors cursor-pointer"
              >
                Save Goal
              </button>
            </div>
          </form>
        )}

        {/* Goals List Layout */}
        {goals.length === 0 ? (
          <div className="bg-surface-card border border-dashed border-border rounded-2xl p-12 text-center text-text-secondary space-y-3">
            <Target className="w-10 h-10 text-border mx-auto" />
            <h3 className="font-semibold text-text-primary text-sm">No Active Financial Goals</h3>
            <p className="text-xs max-w-sm mx-auto">
              Set goals like purchasing a laptop for study, renting a home, or creating an emergency pool. The AI model will calculate custom work tactics for you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {goals.map(g => {
              const categoryObj = GOAL_TYPES.find(item => item.value === g.type) || GOAL_TYPES[7];
              const GoalIcon = categoryObj.icon;
              
              const percent = Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100)) || 0;
              const daysRemaining = getDaysRemaining(g.targetDate);
              const badge = getMilestoneBadge(percent);

              // Calculate tactics from custom strategies logic
              const stats = calculateGoalStrategy(g, predictionData?.historicalStats?.avgDailyProfit || 400);

              return (
                <div key={g.id} className="bg-surface-card border border-border rounded-2xl shadow-sm p-6 flex flex-col justify-between space-y-6">
                  {/* Top segment: Title, category, remove button */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <GoalIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary text-sm">{g.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-text-secondary bg-surface border border-border px-2 py-0.5 rounded-full font-semibold">
                            {categoryObj.label}
                          </span>
                          <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => handleDeleteGoal(g.id)}
                      className="text-text-secondary hover:text-danger p-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mid Segment: Numbers & Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline text-xs font-semibold">
                      <span className="text-text-secondary">Progress: {percent}%</span>
                      <div className="space-x-1.5">
                        <span className="text-text-primary font-mono">{formatCurrency(g.savedAmount)}</span>
                        <span className="text-text-secondary font-mono">/</span>
                        <span className="text-text-secondary font-mono">{formatCurrency(g.targetAmount)}</span>
                      </div>
                    </div>

                    <div className="w-full bg-border/40 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-500" style={{ width: `${percent}%` }} />
                    </div>

                    {/* Progress micro slider to adjust savedAmount directly */}
                    <div className="pt-2 text-xs">
                      <label className="text-text-secondary text-[11px] mb-1 block">Adjust Saved Amount (₹)</label>
                      <input 
                        type="range" 
                        min="0" 
                        max={g.targetAmount} 
                        step="500"
                        value={g.savedAmount}
                        onChange={(e) => handleUpdateSavedAmount(g.id, Number(e.target.value))}
                        className="w-full accent-primary bg-border/50 h-1 rounded appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Strategy Box Section */}
                  <div className="bg-surface border border-border/80 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1 border-r border-border/50">
                        <span className="text-[10px] text-text-secondary font-semibold">Target Date</span>
                        <div className="flex items-center gap-1 font-bold text-text-primary">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span>{g.targetDate}</span>
                        </div>
                        <span className="text-[10px] text-primary block">({daysRemaining} Days Left)</span>
                      </div>

                      <div className="space-y-1 pl-1">
                        <span className="text-[10px] text-text-secondary font-semibold">Requirement</span>
                        <div className="font-bold text-text-primary font-mono">
                          {formatCurrency(stats.dailySave)}/day
                        </div>
                        <span className="text-[10px] text-text-secondary block">({formatCurrency(stats.weeklySave)}/week)</span>
                      </div>
                    </div>

                    {/* AI Recommender line */}
                    <div className="border-t border-border/50 pt-2.5 space-y-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Recommended Action Plan</span>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        {stats.strategy}
                      </p>
                      
                      {daysRemaining > 0 && (
                        <div className="flex items-center gap-2 mt-2 text-[10px]">
                          {percent < 100 ? (
                            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Behind Target Velocity by ₹{Math.max(0, Math.round(stats.dailySave - (predictionData?.historicalStats?.avgDailyProfit * 0.4)))} daily</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Target Achieved! Ready to purchase.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: 4. Bottom Row: Historical baseline analysis & cash forecasting */}
      <div className="bg-surface-card border border-border rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-1 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Predictive Machine Learning Baseline
        </h2>
        <p className="text-xs text-text-secondary mb-6">
          Historical work log inputs compiled to build prediction coefficients.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div className="space-y-1 border-r border-border/50">
            <div className="flex justify-center"><DollarSign className="w-4 h-4 text-primary" /></div>
            <p className="text-xs text-text-secondary font-semibold">Daily Avg Gross</p>
            <p className="text-lg font-extrabold text-text-primary font-mono">
              {formatCurrency(predictionData?.historicalStats?.avgDailyEarnings || 0)}
            </p>
          </div>

          <div className="space-y-1 border-r border-border/50">
            <div className="flex justify-center"><TrendingDown className="w-4 h-4 text-danger" /></div>
            <p className="text-xs text-text-secondary font-semibold">Daily Avg Expense</p>
            <p className="text-lg font-extrabold text-text-primary font-mono">
              {formatCurrency(predictionData?.historicalStats?.avgDailyExpenses || 0)}
            </p>
          </div>

          <div className="space-y-1 border-r border-border/50">
            <div className="flex justify-center"><Clock className="w-4 h-4 text-primary" /></div>
            <p className="text-xs text-text-secondary font-semibold">Daily Workload</p>
            <p className="text-lg font-extrabold text-text-primary font-mono">
              {predictionData?.historicalStats?.avgHoursPerDay || 0} hrs
            </p>
          </div>

          <div className="space-y-1 border-r border-border/50">
            <div className="flex justify-center"><Package className="w-4 h-4 text-primary" /></div>
            <p className="text-xs text-text-secondary font-semibold">Avg Deliveries</p>
            <p className="text-lg font-extrabold text-text-primary font-mono">
              {predictionData?.historicalStats?.avgOrdersPerDay || 0} runs
            </p>
          </div>

          <div className="space-y-1 col-span-2 md:col-span-1">
            <div className="flex justify-center"><ArrowUpRight className="w-4 h-4 text-emerald-400" /></div>
            <p className="text-xs text-text-secondary font-semibold">Earning Coefficient</p>
            <p className="text-lg font-extrabold text-emerald-400 font-mono">
              {formatCurrency(predictionData?.historicalStats?.avgEarningsPerHour || 0)}/hr
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
