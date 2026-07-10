import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { EmergencyFund } from '../../types/emergencyFund';
import { motion, AnimatePresence } from 'motion/react';

interface FundFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  fund?: EmergencyFund | null; // If editing
}

const CATEGORIES = [
  'Medical Emergency',
  'Vehicle Repair',
  'Family Needs',
  'Job Loss',
  'General Savings',
  'Custom'
];

const ALLOCATION_RULES = [
  { value: 'Manual', label: 'Manual Allocation only' },
  { value: 'Percentage', label: 'Allocate % of Earnings automatically' },
  { value: 'Surplus', label: 'Allocate % of Surplus Profits automatically' }
];

export default function FundFormModal({ isOpen, onClose, onSubmit, fund }: FundFormModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General Savings');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialSavings, setInitialSavings] = useState('0');
  const [preferredCompletionDate, setPreferredCompletionDate] = useState('');
  const [monthlyExpenseEstimate, setMonthlyExpenseEstimate] = useState('0');
  const [allocationRule, setAllocationRule] = useState('Manual');
  const [allocationPercentage, setAllocationPercentage] = useState('10');
  
  const [error, setError] = useState('');

  // Prefill when editing
  useEffect(() => {
    if (fund) {
      setName(fund.name);
      setCategory(fund.category);
      setTargetAmount(fund.targetAmount.toString());
      setInitialSavings('0'); // Initial savings isn't editable, the user updates via transaction deposits
      setPreferredCompletionDate(fund.preferredCompletionDate);
      setMonthlyExpenseEstimate(fund.monthlyExpenseEstimate?.toString() || '0');
      setAllocationRule(fund.allocationRule || 'Manual');
      setAllocationPercentage(fund.allocationPercentage?.toString() || '10');
    } else {
      // Defaults for creation
      setName('');
      setCategory('General Savings');
      setTargetAmount('');
      setInitialSavings('0');
      
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 3);
      setPreferredCompletionDate(nextMonth.toISOString().split('T')[0]);
      
      setMonthlyExpenseEstimate('0');
      setAllocationRule('Manual');
      setAllocationPercentage('10');
    }
    setError('');
  }, [fund, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please provide a descriptive name for this emergency goal.');
      return;
    }
    if (!targetAmount || Number(targetAmount) <= 0) {
      setError('Please set a valid target savings goal amount greater than zero.');
      return;
    }
    if (!preferredCompletionDate) {
      setError('Please select a preferred completion target date.');
      return;
    }

    const payload: any = {
      name,
      category,
      targetAmount: Number(targetAmount),
      preferredCompletionDate,
      monthlyExpenseEstimate: Number(monthlyExpenseEstimate || 0),
      allocationRule,
      allocationPercentage: Number(allocationPercentage || 10)
    };

    if (!fund) {
      payload.currentSavings = Number(initialSavings || 0);
    }

    onSubmit(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg rounded-2xl border border-border bg-surface-card shadow-2xl p-6 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
            <div>
              <h3 className="text-lg font-bold text-text-primary tracking-tight">
                {fund ? 'Edit Emergency Goal' : 'Launch New Emergency Goal'}
              </h3>
              <span className="text-xs text-text-secondary">
                {fund ? 'Adjust targets or rules for safety-net funds' : 'Set up a dedicated savings shelter for delivery riders'}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg border border-border hover:bg-surface text-text-secondary hover:text-text-primary transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Goal Title */}
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                Emergency Goal Name
              </label>
              <input
                type="text"
                placeholder="e.g. Scooter Gearbox Replacement, Rent Backup Cover"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Target Amount */}
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                  Target Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* If creating: Initial Savings */}
            {!fund && (
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                  Starting Balance (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 3000 (Set if you already have cash saved)"
                  value={initialSavings}
                  onChange={(e) => setInitialSavings(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Completion Date */}
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                  Completion Date
                </label>
                <input
                  type="date"
                  value={preferredCompletionDate}
                  onChange={(e) => setPreferredCompletionDate(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                />
              </div>

              {/* Monthly Expense Estimate */}
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                  Monthly Expenses (₹, Optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 8000"
                  value={monthlyExpenseEstimate}
                  onChange={(e) => setMonthlyExpenseEstimate(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Allocation Rule */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                  Savings Allocation Rule
                </label>
                <select
                  value={allocationRule}
                  onChange={(e) => setAllocationRule(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                >
                  {ALLOCATION_RULES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Allocation Percentage */}
              {allocationRule !== 'Manual' && (
                <div>
                  <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                    Save Rate (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="10"
                    value={allocationPercentage}
                    onChange={(e) => setAllocationPercentage(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-xl border border-border hover:bg-surface text-text-secondary font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-primary hover:bg-primary-hover text-surface font-semibold text-xs cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                {fund ? 'Update Goal' : 'Launch Goal'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
