import React, { useState, useEffect } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle, AlertCircle } from 'lucide-react';
import { EmergencyFund } from '../../types/emergencyFund';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fundId: string, data: any) => void;
  fund: EmergencyFund | null;
  type: 'Contribution' | 'Withdrawal';
}

const SOURCES = [
  { value: 'Manual', label: 'Manual Cash/UPI Deposit' },
  { value: 'Earnings Surplus', label: 'Gig Surplus Transfer' },
  { value: 'System Recommendation', label: 'Gemini Advice Sweep' }
];

export default function TransactionModal({ isOpen, onClose, onSubmit, fund, type }: TransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [source, setSource] = useState('Manual');
  const [notes, setNotes] = useState('');
  
  const [error, setError] = useState('');

  useEffect(() => {
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setSource(type === 'Contribution' ? 'Manual' : 'Manual');
    setNotes('');
    setError('');
  }, [isOpen, type, fund]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fund) return;

    const numAmount = Number(amount);
    if (!amount || numAmount <= 0) {
      setError('Please provide a valid transaction amount greater than zero.');
      return;
    }

    if (type === 'Withdrawal' && numAmount > fund.currentSavings) {
      setError(`Cannot withdraw ₹${numAmount.toLocaleString('en-IN')}. This exceeds the fund's currently accrued savings of ₹${fund.currentSavings.toLocaleString('en-IN')}.`);
      return;
    }

    onSubmit(fund._id, {
      amount: numAmount,
      type,
      source,
      date,
      notes: notes.trim()
    });
    
    onClose();
  };

  if (!isOpen || !fund) return null;

  const isContrib = type === 'Contribution';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md rounded-2xl border border-border bg-surface-card shadow-2xl p-6 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg border ${
                isContrib ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-danger/10 text-danger border-danger/20'
              }`}>
                {isContrib ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary tracking-tight">
                  {isContrib ? `Deposit to Goal` : `Withdraw from Goal`}
                </h3>
                <span className="text-xs text-text-secondary">
                  Target Fund: <span className="font-bold text-text-primary">{fund.name}</span>
                </span>
              </div>
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

            {/* Quick Available Info for Withdrawal */}
            {!isContrib && (
              <div className="p-3 bg-surface border border-border rounded-xl text-xs flex justify-between items-center text-text-secondary">
                <span>Currently Available Savings:</span>
                <span className="font-bold text-emerald-500">₹{(fund.currentSavings || 0).toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                Transaction Amount (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 1500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                />
              </div>

              {/* Source (Only relevant/visible for contributions) */}
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                  {isContrib ? 'Contribution Source' : 'Withdrawal Purpose'}
                </label>
                {isContrib ? (
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {SOURCES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    disabled
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-xs font-medium text-text-secondary focus:outline-none cursor-not-allowed"
                  >
                    <option value="Manual">Manual Withdrawal</option>
                  </select>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                Remarks / Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Transferred after Swiggy bonus payout"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary"
              />
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
                className={`py-2 px-5 rounded-xl text-surface font-semibold text-xs cursor-pointer shadow-md ${
                  isContrib ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-danger hover:bg-danger/95'
                }`}
              >
                {isContrib ? 'Confirm Deposit' : 'Confirm Withdrawal'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
