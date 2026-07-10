/**
 * Helper to calculate working hours from login and logout times (HH:MM 24hr format)
 */
export const calculateWorkingHours = (loginTime: string, logoutTime: string): number => {
  if (!loginTime || !logoutTime) return 0;
  
  const [loginH, loginM] = loginTime.split(':').map(Number);
  const [logoutH, logoutM] = logoutTime.split(':').map(Number);
  
  let diff = (logoutH + logoutM / 60) - (loginH + loginM / 60);
  
  if (diff < 0) {
    // Shift crossed midnight
    diff += 24;
  }
  
  return Number(diff.toFixed(2));
};

/**
 * Calculates financial metrics for a worklog
 */
export const calculateWorkLogMetrics = (data: {
  grossEarnings: number;
  tips?: number;
  bonusIncentives?: number;
  fuelCost?: number;
  parkingCost?: number;
  foodExpense?: number;
  otherExpenses?: number;
  hoursWorked?: number;
  ordersCompleted: number;
}) => {
  const gross = Number(data.grossEarnings || 0);
  const tips = Number(data.tips || 0);
  const incentives = Number(data.bonusIncentives || 0);
  
  const fuel = Number(data.fuelCost || 0);
  const parking = Number(data.parkingCost || 0);
  const food = Number(data.foodExpense || 0);
  const other = Number(data.otherExpenses || 0);
  
  const totalEarnings = Number((gross + tips + incentives).toFixed(2));
  const totalExpenses = Number((fuel + parking + food + other).toFixed(2));
  const netProfit = Number((totalEarnings - totalExpenses).toFixed(2));
  
  const hours = Number(data.hoursWorked || 1);
  const orders = Number(data.ordersCompleted || 1);
  
  const avgEarningsPerHour = hours > 0 ? Number((totalEarnings / hours).toFixed(2)) : totalEarnings;
  const avgEarningsPerOrder = orders > 0 ? Number((totalEarnings / orders).toFixed(2)) : totalEarnings;
  
  return {
    totalEarnings,
    totalExpenses,
    netProfit,
    avgEarningsPerHour,
    avgEarningsPerOrder
  };
};
