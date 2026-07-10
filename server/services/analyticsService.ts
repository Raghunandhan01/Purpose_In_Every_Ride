import { WorkLog } from '../models/index.js';

export const getDashboardStats = async (userId: string) => {
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

  let todayEarnings = 0;
  let weeklyEarnings = 0;
  let monthlyEarnings = 0;
  let yearlyEarnings = 0;
  let totalExpenses = 0;
  let netProfit = 0;
  let workingHours = 0;
  let totalOrders = 0;

  // Track daily stats to find the best earning day
  const dailyTotals: Record<string, number> = {};

  allLogs.forEach((log: any) => {
    const earnings = log.totalEarnings || 0;
    const expenses = log.totalExpenses || 0;
    const hours = log.hoursWorked || 0;
    const orders = log.ordersCompleted || 0;

    totalExpenses += expenses;
    netProfit += log.netProfit || 0;
    workingHours += hours;
    totalOrders += orders;

    // Daily totals tracker
    dailyTotals[log.date] = (dailyTotals[log.date] || 0) + earnings;

    // Time buckets
    if (log.date === todayStr) {
      todayEarnings += earnings;
    }
    if (log.date >= lastWeekStr) {
      weeklyEarnings += earnings;
    }
    if (log.date >= lastMonthStr) {
      monthlyEarnings += earnings;
    }
    if (log.date >= lastYearStr) {
      yearlyEarnings += earnings;
    }
  });

  // Calculate best earning day
  let bestEarningDay = { date: 'No data', amount: 0 };
  Object.keys(dailyTotals).forEach(date => {
    if (dailyTotals[date] > bestEarningDay.amount) {
      bestEarningDay = { date, amount: dailyTotals[date] };
    }
  });

  // Recent activity (last 5 shifts)
  const recentActivity = [...allLogs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((log: any) => ({
      id: log._id || log.id,
      platform: log.platform,
      date: log.date,
      hours: log.hoursWorked,
      orders: log.ordersCompleted,
      earnings: log.totalEarnings,
      netProfit: log.netProfit,
    }));

  // Platform comparisons
  const platformGroups: Record<string, { earnings: number; profit: number; orders: number; hours: number }> = {};
  allLogs.forEach((log: any) => {
    const plt = log.platform.toLowerCase();
    if (!platformGroups[plt]) {
      platformGroups[plt] = { earnings: 0, profit: 0, orders: 0, hours: 0 };
    }
    platformGroups[plt].earnings += log.totalEarnings || 0;
    platformGroups[plt].profit += log.netProfit || 0;
    platformGroups[plt].orders += log.ordersCompleted || 0;
    platformGroups[plt].hours += log.hoursWorked || 0;
  });

  const platformComparison = Object.keys(platformGroups).map(plt => ({
    platform: plt.charAt(0).toUpperCase() + plt.slice(1),
    earnings: Number(platformGroups[plt].earnings.toFixed(2)),
    profit: Number(platformGroups[plt].profit.toFixed(2)),
    orders: platformGroups[plt].orders,
    hours: Number(platformGroups[plt].hours.toFixed(1)),
  }));

  // Top performing platform
  let topPerformingPlatform = 'None';
  let topProfit = -Infinity;
  platformComparison.forEach(p => {
    if (p.profit > topProfit) {
      topProfit = p.profit;
      topPerformingPlatform = p.platform;
    }
  });

  return {
    todayEarnings,
    weeklyEarnings,
    monthlyEarnings,
    yearlyEarnings,
    totalExpenses: Number(totalExpenses.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    workingHours: Number(workingHours.toFixed(1)),
    totalOrders,
    bestEarningDay,
    topPerformingPlatform,
    recentActivity,
    platformComparison,
  };
};

export const getAdvancedAnalytics = async (userId: string) => {
  const allLogs = await WorkLog.find({ userId });

  // 1. Grouping by date for chronological profit trend (last 15 days of logged data)
  const sortedLogs = [...allLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const dailyTrendMap: Record<string, { earnings: number; expenses: number; profit: number; orders: number; hours: number }> = {};
  sortedLogs.forEach((log: any) => {
    if (!dailyTrendMap[log.date]) {
      dailyTrendMap[log.date] = { earnings: 0, expenses: 0, profit: 0, orders: 0, hours: 0 };
    }
    dailyTrendMap[log.date].earnings += log.totalEarnings || 0;
    dailyTrendMap[log.date].expenses += log.totalExpenses || 0;
    dailyTrendMap[log.date].profit += log.netProfit || 0;
    dailyTrendMap[log.date].orders += log.ordersCompleted || 0;
    dailyTrendMap[log.date].hours += log.hoursWorked || 0;
  });

  const profitTrend = Object.keys(dailyTrendMap).slice(-15).map(date => ({
    date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    fullDate: date,
    Earnings: Number(dailyTrendMap[date].earnings.toFixed(2)),
    Expenses: Number(dailyTrendMap[date].expenses.toFixed(2)),
    Profit: Number(dailyTrendMap[date].profit.toFixed(2)),
    Orders: dailyTrendMap[date].orders,
    Hours: Number(dailyTrendMap[date].hours.toFixed(1)),
  }));

  // 2. Day-of-Week Analysis (Sunday - Saturday)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOfWeekMap = dayNames.map(name => ({ name, earnings: 0, profit: 0, count: 0, orders: 0 }));
  
  sortedLogs.forEach((log: any) => {
    const dayIndex = new Date(log.date).getDay();
    dayOfWeekMap[dayIndex].earnings += log.totalEarnings || 0;
    dayOfWeekMap[dayIndex].profit += log.netProfit || 0;
    dayOfWeekMap[dayIndex].orders += log.ordersCompleted || 0;
    dayOfWeekMap[dayIndex].count += 1;
  });

  const dayOfWeekAnalysis = dayOfWeekMap.map(day => ({
    day: day.name,
    earnings: Number(day.earnings.toFixed(2)),
    profit: Number(day.profit.toFixed(2)),
    orders: day.orders,
    averageEarnings: day.count > 0 ? Number((day.earnings / day.count).toFixed(2)) : 0,
    shiftsLogged: day.count,
  }));

  // Most profitable day & Most active day of the week
  let mostProfitableDay = 'No data';
  let maxDayProfit = -Infinity;
  let mostActiveDay = 'No data';
  let maxDayShifts = -1;

  dayOfWeekAnalysis.forEach(day => {
    if (day.profit > maxDayProfit) {
      maxDayProfit = day.profit;
      mostProfitableDay = day.day;
    }
    if (day.shiftsLogged > maxDayShifts) {
      maxDayShifts = day.shiftsLogged;
      mostActiveDay = day.day;
    }
  });

  // 3. Platform performance breakdown
  const platformMap: Record<string, {
    earnings: number;
    expenses: number;
    profit: number;
    orders: number;
    hours: number;
    fuel: number;
    tips: number;
    bonus: number;
    count: number;
  }> = {};

  sortedLogs.forEach((log: any) => {
    const plt = log.platform.toLowerCase();
    if (!platformMap[plt]) {
      platformMap[plt] = { earnings: 0, expenses: 0, profit: 0, orders: 0, hours: 0, fuel: 0, tips: 0, bonus: 0, count: 0 };
    }
    platformMap[plt].earnings += log.totalEarnings || 0;
    platformMap[plt].expenses += log.totalExpenses || 0;
    platformMap[plt].profit += log.netProfit || 0;
    platformMap[plt].orders += log.ordersCompleted || 0;
    platformMap[plt].hours += log.hoursWorked || 0;
    platformMap[plt].fuel += log.fuelCost || 0;
    platformMap[plt].tips += log.tips || 0;
    platformMap[plt].bonus += log.bonusIncentives || 0;
    platformMap[plt].count += 1;
  });

  const platformPerformance = Object.keys(platformMap).map(plt => {
    const p = platformMap[plt];
    return {
      platform: plt.charAt(0).toUpperCase() + plt.slice(1),
      earnings: Number(p.earnings.toFixed(2)),
      profit: Number(p.profit.toFixed(2)),
      expenses: Number(p.expenses.toFixed(2)),
      orders: p.orders,
      hours: Number(p.hours.toFixed(1)),
      fuelCost: Number(p.fuel.toFixed(2)),
      tips: Number(p.tips.toFixed(2)),
      bonuses: Number(p.bonus.toFixed(2)),
      avgPerHour: p.hours > 0 ? Number((p.earnings / p.hours).toFixed(2)) : 0,
      avgPerOrder: p.orders > 0 ? Number((p.earnings / p.orders).toFixed(2)) : 0,
    };
  });

  // Best/Worst Platforms
  let bestPlatform = 'None';
  let bestPlatformProfit = -Infinity;
  let worstPlatform = 'None';
  let worstPlatformProfit = Infinity;

  platformPerformance.forEach(p => {
    if (p.profit > bestPlatformProfit) {
      bestPlatformProfit = p.profit;
      bestPlatform = p.platform;
    }
    if (p.profit < worstPlatformProfit) {
      worstPlatformProfit = p.profit;
      worstPlatform = p.platform;
    }
  });

  // 4. Expense Breakdown
  let totalFuel = 0;
  let totalParking = 0;
  let totalFood = 0;
  let totalOther = 0;
  let totalExp = 0;

  sortedLogs.forEach((log: any) => {
    totalFuel += log.fuelCost || 0;
    totalParking += log.parkingCost || 0;
    totalFood += log.foodExpense || 0;
    totalOther += log.otherExpenses || 0;
    totalExp += log.totalExpenses || 0;
  });

  const expenseBreakdown = [
    { name: 'Fuel', value: Number(totalFuel.toFixed(2)) },
    { name: 'Parking', value: Number(totalParking.toFixed(2)) },
    { name: 'Food', value: Number(totalFood.toFixed(2)) },
    { name: 'Other', value: Number(totalOther.toFixed(2)) },
  ].filter(exp => exp.value > 0);

  // 5. Cumulative Averages
  let totalHours = 0;
  let totalOrders = 0;
  let totalEarnings = 0;

  sortedLogs.forEach((log: any) => {
    totalHours += log.hoursWorked || 0;
    totalOrders += log.ordersCompleted || 0;
    totalEarnings += log.totalEarnings || 0;
  });

  const avgEarningsPerHour = totalHours > 0 ? Number((totalEarnings / totalHours).toFixed(2)) : 0;
  const avgEarningsPerOrder = totalOrders > 0 ? Number((totalEarnings / totalOrders).toFixed(2)) : 0;

  return {
    profitTrend,
    dayOfWeekAnalysis,
    platformPerformance,
    expenseBreakdown,
    bestPlatform,
    worstPlatform,
    mostProfitableDay,
    mostActiveDay,
    averageEarningsPerHour: avgEarningsPerHour,
    averageEarningsPerOrder: avgEarningsPerOrder,
    totalHours: Number(totalHours.toFixed(1)),
    totalOrders,
  };
};
