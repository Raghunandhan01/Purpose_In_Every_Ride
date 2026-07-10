import mongoose, { Schema, Document } from 'mongoose';

// 1. User Schema
export interface IUser extends Document {
  fullName: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  vehicleType?: string;
  preferredPlatform?: string;
  profileImage?: string;
  connectedAccounts?: string; // JSON string for storing connected platforms metadata
  theme?: string;
  language?: string;
  goals?: string; // JSON string representing financial goals
  budgets?: string; // JSON string representing budget categories
  authProvider?: string; // 'email' | 'google' | 'facebook'
  providerId?: string; // Google or Facebook user ID
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    phoneNumber: { type: String, trim: true },
    password: { type: String },
    vehicleType: { type: String, default: '' },
    preferredPlatform: { type: String, default: '' },
    profileImage: { type: String, default: '' },
    connectedAccounts: { type: String, default: '{}' },
    theme: { type: String, default: 'dark' },
    language: { type: String, default: 'en' },
    goals: { type: String, default: '[]' },
    budgets: { type: String, default: '[]' },
    authProvider: { type: String, default: 'email' },
    providerId: { type: String },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
UserSchema.index({ email: 1 });

export const MongooseUser = mongoose.model<IUser>('User', UserSchema);

// 2. Platform Schema
export interface IPlatform extends Document {
  id: string;
  name: string;
  logo: string;
  active: boolean;
  color: string;
}

const PlatformSchema = new Schema<IPlatform>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    logo: { type: String, required: true },
    active: { type: Boolean, default: true },
    color: { type: String, default: 'bg-primary' },
  },
  { timestamps: true }
);

export const MongoosePlatform = mongoose.model<IPlatform>('Platform', PlatformSchema);

// 3. WorkLog Schema
export interface IWorkLog extends Document {
  userId: mongoose.Types.ObjectId;
  platform: string;
  date: string; // YYYY-MM-DD
  loginTime: string;
  logoutTime: string;
  hoursWorked: number;
  ordersCompleted: number;
  distanceTravelled: number;
  grossEarnings: number;
  tips: number;
  bonusIncentives: number;
  fuelCost: number;
  parkingCost: number;
  foodExpense: number;
  otherExpenses: number;
  totalExpenses: number;
  totalEarnings: number;
  netProfit: number;
  avgEarningsPerHour: number;
  avgEarningsPerOrder: number;
  notes?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkLogSchema = new Schema<IWorkLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    loginTime: { type: String, required: true },
    logoutTime: { type: String, required: true },
    hoursWorked: { type: Number, required: true, default: 0 },
    ordersCompleted: { type: Number, required: true, default: 0 },
    distanceTravelled: { type: Number, default: 0 },
    grossEarnings: { type: Number, required: true, default: 0 },
    tips: { type: Number, default: 0 },
    bonusIncentives: { type: Number, default: 0 },
    fuelCost: { type: Number, default: 0 },
    parkingCost: { type: Number, default: 0 },
    foodExpense: { type: Number, default: 0 },
    otherExpenses: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    avgEarningsPerHour: { type: Number, default: 0 },
    avgEarningsPerOrder: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    status: { type: String, default: 'Completed' },
  },
  { timestamps: true }
);

// Compound Index for lightning-fast queries
WorkLogSchema.index({ userId: 1, platform: 1, date: -1 });
WorkLogSchema.index({ userId: 1, date: -1 });

export const MongooseWorkLog = mongoose.model<IWorkLog>('WorkLog', WorkLogSchema);

// 4. WeeklyReport Schema
export interface IWeeklyReport extends Document {
  userId: mongoose.Types.ObjectId;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  metrics: {
    totalEarnings: number;
    totalExpenses: number;
    netProfit: number;
    totalSavings: number;
    ordersCompleted: number;
    workingHours: number;
    tips: number;
    incentivesAndBonuses: number;
    fuelCosts: number;
    vehicleMaintenance: number;
    platformCommissions: number;
    avgDailyEarnings: number;
    avgEarningsPerHour: number;
    avgEarningsPerOrder: number;
    bestEarningDay: { date: string; earnings: number };
    lowestEarningDay: { date: string; earnings: number };
    bestPerformingPlatform: string;
    totalDistanceTraveled: number;
    fuelEfficiency: number; // km per Litre or overall metric
    weeklyGrowthPercentage: number;
  };
  aiAnalysis: {
    insights: string[];
    recommendations: string[];
    strategies: string[];
    profitableHours: string[];
    predictedEarnings: number;
    motivationalFeedback: string;
    financialHealthScore: number;
    alerts: string[];
  };
  scheduleType: string; // 'Sunday' or other custom day
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyReportSchema = new Schema<IWeeklyReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    metrics: {
      totalEarnings: { type: Number, default: 0 },
      totalExpenses: { type: Number, default: 0 },
      netProfit: { type: Number, default: 0 },
      totalSavings: { type: Number, default: 0 },
      ordersCompleted: { type: Number, default: 0 },
      workingHours: { type: Number, default: 0 },
      tips: { type: Number, default: 0 },
      incentivesAndBonuses: { type: Number, default: 0 },
      fuelCosts: { type: Number, default: 0 },
      vehicleMaintenance: { type: Number, default: 0 },
      platformCommissions: { type: Number, default: 0 },
      avgDailyEarnings: { type: Number, default: 0 },
      avgEarningsPerHour: { type: Number, default: 0 },
      avgEarningsPerOrder: { type: Number, default: 0 },
      bestEarningDay: {
        date: { type: String, default: '' },
        earnings: { type: Number, default: 0 }
      },
      lowestEarningDay: {
        date: { type: String, default: '' },
        earnings: { type: Number, default: 0 }
      },
      bestPerformingPlatform: { type: String, default: '' },
      totalDistanceTraveled: { type: Number, default: 0 },
      fuelEfficiency: { type: Number, default: 0 },
      weeklyGrowthPercentage: { type: Number, default: 0 }
    },
    aiAnalysis: {
      insights: { type: [String], default: [] },
      recommendations: { type: [String], default: [] },
      strategies: { type: [String], default: [] },
      profitableHours: { type: [String], default: [] },
      predictedEarnings: { type: Number, default: 0 },
      motivationalFeedback: { type: String, default: '' },
      financialHealthScore: { type: Number, default: 100 },
      alerts: { type: [String], default: [] }
    },
    scheduleType: { type: String, default: 'Sunday' }
  },
  { timestamps: true }
);

WeeklyReportSchema.index({ userId: 1, endDate: -1 });

export const MongooseWeeklyReport = mongoose.model<IWeeklyReport>('WeeklyReport', WeeklyReportSchema);

// 5. EmergencyFund Schema
export interface IEmergencyFund extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  category: string; // 'Medical Emergency', 'Vehicle Repair', 'Family Needs', 'Job Loss', 'General Savings', 'Custom'
  targetAmount: number;
  currentSavings: number;
  preferredCompletionDate: string; // YYYY-MM-DD
  monthlyExpenseEstimate?: number;
  status: string; // 'Active', 'Completed', 'Paused'
  allocationRule: string; // 'Manual', 'Percentage', 'Surplus'
  allocationPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyFundSchema = new Schema<IEmergencyFund>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentSavings: { type: Number, default: 0 },
    preferredCompletionDate: { type: String, required: true },
    monthlyExpenseEstimate: { type: Number, default: 0 },
    status: { type: String, default: 'Active' },
    allocationRule: { type: String, default: 'Manual' },
    allocationPercentage: { type: Number, default: 10 },
  },
  { timestamps: true }
);

EmergencyFundSchema.index({ userId: 1 });

export const MongooseEmergencyFund = mongoose.model<IEmergencyFund>('EmergencyFund', EmergencyFundSchema);

// 6. EmergencyFundTransaction Schema
export interface IEmergencyFundTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  fundId: mongoose.Types.ObjectId;
  type: string; // 'Contribution', 'Withdrawal'
  amount: number;
  source: string; // 'Manual', 'Earnings Surplus', 'System Recommendation', 'Auto-allocation'
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyFundTransactionSchema = new Schema<IEmergencyFundTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fundId: { type: Schema.Types.ObjectId, ref: 'EmergencyFund', required: true, index: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    source: { type: String, default: 'Manual' },
    date: { type: String, required: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

EmergencyFundTransactionSchema.index({ userId: 1, fundId: 1, date: -1 });

export const MongooseEmergencyFundTransaction = mongoose.model<IEmergencyFundTransaction>('EmergencyFundTransaction', EmergencyFundTransactionSchema);

