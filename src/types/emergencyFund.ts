export interface EmergencyFund {
  _id: string;
  userId: string;
  name: string;
  category: string; // 'Medical Emergency', 'Vehicle Repair', 'Family Needs', 'Job Loss', 'General Savings', 'Custom'
  targetAmount: number;
  currentSavings: number;
  preferredCompletionDate: string; // YYYY-MM-DD
  monthlyExpenseEstimate?: number;
  status: string; // 'Active', 'Completed', 'Paused'
  allocationRule: string; // 'Manual', 'Percentage', 'Surplus'
  allocationPercentage: number;
  createdAt: string;
  updatedAt: string;
  // Enriched fields from backend:
  percentage: number;
  milestones: {
    reached25: boolean;
    reached50: boolean;
    reached75: boolean;
    reached100: boolean;
  };
  daysRemaining: number;
  recommendedDaily: number;
  recommendedWeekly: number;
  recommendedMonthly: number;
}

export interface EmergencyFundTransaction {
  _id: string;
  userId: string;
  fundId: string;
  type: 'Contribution' | 'Withdrawal';
  amount: number;
  source: 'Manual' | 'Earnings Surplus' | 'System Recommendation' | 'Auto-allocation';
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FundSummary {
  totalTarget: number;
  totalSaved: number;
  totalRemaining: number;
  overallPercentage: number;
  totalMonthlyExpenseEstimate: number;
}

export interface SimulationResult {
  currentSavings: number;
  targetAmount: number;
  remaining: number;
  dailySavingsSimulated: number;
  daysToTarget: number;
  simulatedCompletionDate: string;
  baselineDaysRemaining: number;
  baselineCompletionDate: string;
  completionDifferenceDays: number;
}

export interface AiAdviceResult {
  statusSummary: string;
  savingsTips: string[];
  expenseReductionTips: string[];
  optimalWorkSchedules: string[];
  aiRecommendationMessage: string;
}
