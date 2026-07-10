import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  RefreshCw, 
  Flame, 
  Compass, 
  BadgeAlert, 
  Calendar,
  DollarSign
} from 'lucide-react';
import { AiAdviceResult } from '../../types/emergencyFund';
import toast from 'react-hot-toast';

export default function AiAdvisor() {
  const [advice, setAdvice] = useState<AiAdviceResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/emergency-fund/advice', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setAdvice(data.data);
      } else {
        toast.error('Failed to update AI recommendation');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to connect to AI Advisor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-surface-card overflow-hidden h-full flex flex-col justify-between">
      {/* Visual Header background decoration */}
      <div className="bg-gradient-to-r from-primary/10 to-indigo-500/10 p-6 border-b border-border relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-20 h-20 text-primary" />
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary tracking-tight">Gemini AI Financial Copilot</h3>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Active Recommendation Engine</span>
            </div>
          </div>

          <button 
            onClick={fetchAdvice}
            disabled={loading}
            className="p-2 rounded-xl border border-border hover:border-primary/20 bg-surface text-text-secondary hover:text-primary transition-all cursor-pointer disabled:opacity-50"
            title="Refresh AI Advice"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Sparkles className="w-5 h-5 text-primary absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-text-primary">Consulting Gemini Financial Models...</p>
            <p className="text-xs text-text-secondary">Analyzing 30-day work logs, average earnings, and active milestones...</p>
          </div>
        ) : advice ? (
          <>
            {/* Main recommendation message card */}
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
              <p className="text-sm italic font-medium text-text-primary leading-relaxed">
                "{advice.aiRecommendationMessage}"
              </p>
            </div>

            {/* Status Summary */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Progress Evaluation</h4>
              <p className="text-sm text-text-primary leading-relaxed">{advice.statusSummary}</p>
            </div>

            {/* Interactive Grid of suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Savings Tips */}
              <div className="space-y-3 bg-surface/40 p-4 rounded-xl border border-border/60">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                  <DollarSign className="w-4 h-4" />
                  <span>SAVINGS STRATEGIES</span>
                </div>
                <ul className="space-y-2.5">
                  {advice.savingsTips.map((tip, idx) => (
                    <li key={idx} className="text-xs text-text-secondary leading-relaxed pl-3 border-l-2 border-emerald-500/50">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Expense Trimming Tips */}
              <div className="space-y-3 bg-surface/40 p-4 rounded-xl border border-border/60">
                <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
                  <BadgeAlert className="w-4 h-4" />
                  <span>EXPENSE OPTIMIZATION</span>
                </div>
                <ul className="space-y-2.5">
                  {advice.expenseReductionTips.map((tip, idx) => (
                    <li key={idx} className="text-xs text-text-secondary leading-relaxed pl-3 border-l-2 border-rose-500/50">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Shift Optimizations */}
              <div className="space-y-3 bg-surface/40 p-4 rounded-xl border border-border/60">
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>PEAK WORK SHIFTS</span>
                </div>
                <ul className="space-y-2.5">
                  {advice.optimalWorkSchedules.map((tip, idx) => (
                    <li key={idx} className="text-xs text-text-secondary leading-relaxed pl-3 border-l-2 border-indigo-500/50">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-text-secondary text-xs">
            No recommendations generated. Click the refresh button to trigger.
          </div>
        )}
      </div>
    </div>
  );
}
