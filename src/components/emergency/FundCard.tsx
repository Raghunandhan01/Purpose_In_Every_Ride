import React from 'react';
import { 
  Heart, 
  Wrench, 
  Home, 
  Briefcase, 
  Coins, 
  Compass, 
  Plus, 
  Minus, 
  Edit2, 
  Trash2, 
  Calendar,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { EmergencyFund } from '../../types/emergencyFund';

interface FundCardProps {
  key?: React.Key;
  fund: EmergencyFund;
  onContribute: (fund: EmergencyFund) => void;
  onWithdraw: (fund: EmergencyFund) => void;
  onEdit: (fund: EmergencyFund) => void;
  onDelete: (fund: EmergencyFund) => void | Promise<void>;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Medical Emergency':
      return { icon: Heart, bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    case 'Vehicle Repair':
      return { icon: Wrench, bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    case 'Family Needs':
      return { icon: Home, bg: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' };
    case 'Job Loss':
      return { icon: Briefcase, bg: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' };
    case 'General Savings':
      return { icon: Coins, bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    default:
      return { icon: Compass, bg: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
  }
};

export default function FundCard({ fund, onContribute, onWithdraw, onEdit, onDelete }: FundCardProps) {
  const { icon: Icon, bg } = getCategoryIcon(fund.category);
  const remaining = Math.max(0, fund.targetAmount - fund.currentSavings);

  return (
    <div className="relative group overflow-hidden rounded-2xl border border-border bg-surface-card p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/30 flex flex-col justify-between h-full">
      {/* Absolute top decoration */}
      <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full -mr-12 -mt-12 transition-all duration-300 group-hover:scale-125" />

      <div>
        {/* Header Section */}
        <div className="flex items-start justify-between relative z-10 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${bg}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-text-secondary tracking-wider uppercase">
                {fund.category}
              </span>
              <h4 className="text-base font-bold text-text-primary tracking-tight group-hover:text-primary transition-colors">
                {fund.name}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button 
              onClick={() => onEdit(fund)}
              className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-surface transition-all cursor-pointer"
              title="Edit Goal"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDelete(fund)}
              className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10 transition-all cursor-pointer"
              title="Delete Goal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Financial Numbers */}
        <div className="grid grid-cols-2 gap-4 my-4">
          <div>
            <div className="text-xs text-text-secondary font-medium">Saved Amount</div>
            <div className="text-lg font-bold text-emerald-500">
              ₹{(fund.currentSavings || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-secondary font-medium">Target Amount</div>
            <div className="text-lg font-bold text-text-primary">
              ₹{(fund.targetAmount || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Milestone-Enhanced Progress Bar */}
        <div className="relative mt-6 mb-8">
          <div className="h-2 w-full rounded-full bg-surface border border-border overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${fund.percentage}%` }}
            />
          </div>
          
          {/* Milestone points */}
          <div className="absolute top-1/2 left-0 w-full transform -translate-y-1/2 flex justify-between px-1 pointer-events-none">
            {[25, 50, 75, 100].map((m) => {
              const reached = fund.percentage >= m;
              return (
                <div key={m} className="flex flex-col items-center relative">
                  <div 
                    className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                      reached 
                        ? 'bg-emerald-500 border-white dark:border-surface scale-125 shadow-sm shadow-emerald-500/50' 
                        : 'bg-surface border-border'
                    }`}
                  />
                  <span className={`text-[9px] font-semibold mt-4 absolute transition-colors ${
                    reached ? 'text-emerald-500 font-bold' : 'text-text-secondary'
                  }`}>
                    {m}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Info list */}
        <div className="space-y-2.5 mt-4 pt-4 border-t border-border/60 text-sm">
          {remaining > 0 ? (
            <>
              <div className="flex items-center justify-between text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Needed by
                </span>
                <span className="font-semibold text-text-primary">{fund.preferredCompletionDate}</span>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <span>Monthly Savings Rate</span>
                <span className="font-bold text-primary">₹{Math.round(fund.recommendedMonthly)}/mo</span>
              </div>
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>Remaining Balance</span>
                <span>₹{remaining.toLocaleString('en-IN')}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 py-1 text-emerald-500 font-bold text-sm bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" /> Goal Completed!
            </div>
          )}
        </div>
      </div>

      {/* Manual Contribution/Withdrawal Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <button
          onClick={() => onContribute(fund)}
          disabled={fund.percentage >= 100}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-primary/20 text-primary font-semibold text-xs hover:bg-primary/5 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <Plus className="w-3.5 h-3.5" /> Deposit
        </button>
        <button
          onClick={() => onWithdraw(fund)}
          disabled={fund.currentSavings <= 0}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-danger/20 text-danger font-semibold text-xs hover:bg-danger/5 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <Minus className="w-3.5 h-3.5" /> Withdraw
        </button>
      </div>
    </div>
  );
}
