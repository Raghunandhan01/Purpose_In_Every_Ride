import { WorkLog } from '../models/index.js';

interface ReportDetails {
  totalEarnings: number;
  totalExpenses: number;
  profit: number;
  orders: number;
  hours: number;
  fuelCost: number;
  tips: number;
  bonuses: number;
  platformWiseEarnings: Record<string, number>;
  platformWiseProfit: Record<string, number>;
}

const buildEmptyReport = (): ReportDetails => ({
  totalEarnings: 0,
  totalExpenses: 0,
  profit: 0,
  orders: 0,
  hours: 0,
  fuelCost: 0,
  tips: 0,
  bonuses: 0,
  platformWiseEarnings: {},
  platformWiseProfit: {},
});

const compileReport = (logs: any[]): ReportDetails => {
  const report = buildEmptyReport();

  logs.forEach(log => {
    report.totalEarnings += log.totalEarnings || 0;
    report.totalExpenses += log.totalExpenses || 0;
    report.profit += log.netProfit || 0;
    report.orders += log.ordersCompleted || 0;
    report.hours += log.hoursWorked || 0;
    report.fuelCost += log.fuelCost || 0;
    report.tips += log.tips || 0;
    report.bonuses += log.bonusIncentives || 0;

    const plt = log.platform.toLowerCase();
    report.platformWiseEarnings[plt] = (report.platformWiseEarnings[plt] || 0) + (log.totalEarnings || 0);
    report.platformWiseProfit[plt] = (report.platformWiseProfit[plt] || 0) + (log.netProfit || 0);
  });

  // Clean values (round to 2 decimals)
  report.totalEarnings = Number(report.totalEarnings.toFixed(2));
  report.totalExpenses = Number(report.totalExpenses.toFixed(2));
  report.profit = Number(report.profit.toFixed(2));
  report.hours = Number(report.hours.toFixed(1));
  report.fuelCost = Number(report.fuelCost.toFixed(2));
  report.tips = Number(report.tips.toFixed(2));
  report.bonuses = Number(report.bonuses.toFixed(2));

  Object.keys(report.platformWiseEarnings).forEach(key => {
    report.platformWiseEarnings[key] = Number(report.platformWiseEarnings[key].toFixed(2));
    report.platformWiseProfit[key] = Number(report.platformWiseProfit[key].toFixed(2));
  });

  return report;
};

export const generatePeriodReports = async (userId: string) => {
  const allLogs = await WorkLog.find({ userId });

  const todayStr = new Date().toISOString().split('T')[0];
  
  const dWeek = new Date();
  dWeek.setDate(dWeek.getDate() - 7);
  const lastWeekStr = dWeek.toISOString().split('T')[0];
  
  const dMonth = new Date();
  dMonth.setDate(dMonth.getDate() - 30);
  const lastMonthStr = dMonth.toISOString().split('T')[0];

  const dYear = new Date();
  dYear.setDate(dYear.getDate() - 365);
  const lastYearStr = dYear.toISOString().split('T')[0];

  // 1. Daily Report (Today)
  const todayLogs = allLogs.filter((log: any) => log.date === todayStr);
  const dailyReport = compileReport(todayLogs);

  // 2. Weekly Report (Last 7 Days)
  const weeklyLogs = allLogs.filter((log: any) => log.date >= lastWeekStr);
  const weeklyReport = compileReport(weeklyLogs);

  // 3. Monthly Report (Last 30 Days)
  const monthlyLogs = allLogs.filter((log: any) => log.date >= lastMonthStr);
  const monthlyReport = compileReport(monthlyLogs);

  // 4. Yearly Report (Last 365 Days)
  const yearlyLogs = allLogs.filter((log: any) => log.date >= lastYearStr);
  const yearlyReport = compileReport(yearlyLogs);

  return {
    daily: dailyReport,
    weekly: weeklyReport,
    monthly: monthlyReport,
    yearly: yearlyReport,
  };
};
