import { WorkLog } from '../models/index.js';
import { calculateWorkingHours, calculateWorkLogMetrics } from '../utils/helpers.js';
import { processAutoAllocationForWorkLog } from './emergencyFundService.js';

export const createWorkLog = async (userId: string, data: any) => {
  const hoursWorked = data.hoursWorked !== undefined 
    ? Number(data.hoursWorked) 
    : calculateWorkingHours(data.loginTime, data.logoutTime);

  const metrics = calculateWorkLogMetrics({
    grossEarnings: Number(data.grossEarnings),
    tips: Number(data.tips || 0),
    bonusIncentives: Number(data.bonusIncentives || 0),
    fuelCost: Number(data.fuelCost || 0),
    parkingCost: Number(data.parkingCost || 0),
    foodExpense: Number(data.foodExpense || 0),
    otherExpenses: Number(data.otherExpenses || 0),
    hoursWorked,
    ordersCompleted: Number(data.ordersCompleted),
  });

  const newLog = await WorkLog.create({
    userId,
    platform: data.platform.toLowerCase(),
    date: data.date,
    loginTime: data.loginTime,
    logoutTime: data.logoutTime,
    hoursWorked,
    ordersCompleted: Number(data.ordersCompleted),
    distanceTravelled: Number(data.distanceTravelled || 0),
    grossEarnings: Number(data.grossEarnings),
    tips: Number(data.tips || 0),
    bonusIncentives: Number(data.bonusIncentives || 0),
    fuelCost: Number(data.fuelCost || 0),
    parkingCost: Number(data.parkingCost || 0),
    foodExpense: Number(data.foodExpense || 0),
    otherExpenses: Number(data.otherExpenses || 0),
    totalExpenses: metrics.totalExpenses,
    totalEarnings: metrics.totalEarnings,
    netProfit: metrics.netProfit,
    avgEarningsPerHour: metrics.avgEarningsPerHour,
    avgEarningsPerOrder: metrics.avgEarningsPerOrder,
    notes: data.notes || '',
    status: data.status || 'Completed',
  });

  // Automatically trigger emergency savings allocation
  await processAutoAllocationForWorkLog(userId, newLog);

  return newLog;
};

export const getWorkLogs = async (userId: string, filters: any) => {
  const query: any = { userId };

  // 1. Platform Filter
  if (filters.platform) {
    query.platform = filters.platform.toLowerCase();
  }

  // 2. Date Range Filter
  if (filters.startDate && filters.endDate) {
    query.date = { $gte: filters.startDate, $lte: filters.endDate };
  } else if (filters.startDate) {
    query.date = { $gte: filters.startDate };
  } else if (filters.endDate) {
    query.date = { $lte: filters.endDate };
  }

  // 3. Month & Year Filter
  if (filters.year && filters.month) {
    const paddedMonth = filters.month.toString().padStart(2, '0');
    const regexPattern = `^${filters.year}-${paddedMonth}`;
    query.date = { $regex: regexPattern };
  } else if (filters.year) {
    const regexPattern = `^${filters.year}-`;
    query.date = { $regex: regexPattern };
  }

  // 4. Search Filter
  if (filters.search) {
    query.notes = { $regex: filters.search, $options: 'i' };
  }

  // Sorting
  const sortField = filters.sortField || 'date';
  const sortDirection = filters.sortDirection === 'asc' ? 1 : -1;
  const sortObj = { [sortField]: sortDirection };

  // Pagination
  const page = Math.max(1, parseInt(filters.page || '1'));
  const limit = Math.max(1, parseInt(filters.limit || '10'));
  const skip = (page - 1) * limit;

  // Fetch total count before pagination
  const totalItems = await WorkLog.countDocuments(query);
  const totalPages = Math.ceil(totalItems / limit);

  // Fetch data
  const logs = await WorkLog.find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(limit);

  return {
    logs,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      limit,
    }
  };
};

export const getWorkLogById = async (userId: string, logId: string) => {
  const log = await WorkLog.findById(logId);
  if (!log) {
    throw new Error('Work log not found');
  }
  if (log.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized access to this work log');
  }
  return log;
};

export const updateWorkLog = async (userId: string, logId: string, updateData: any) => {
  const log = await WorkLog.findById(logId);
  if (!log) {
    throw new Error('Work log not found');
  }
  if (log.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized to edit this work log');
  }

  // Prepare updated details
  const updatedPayload = { ...updateData };

  // Recalculate if timing or financial metrics changed
  const loginTime = updatedPayload.loginTime !== undefined ? updatedPayload.loginTime : log.loginTime;
  const logoutTime = updatedPayload.logoutTime !== undefined ? updatedPayload.logoutTime : log.logoutTime;
  
  if (updatedPayload.hoursWorked === undefined && (updatedPayload.loginTime !== undefined || updatedPayload.logoutTime !== undefined)) {
    updatedPayload.hoursWorked = calculateWorkingHours(loginTime, logoutTime);
  }

  // Check if any financial variables were updated
  const hasFinanceUpdate = 
    updatedPayload.grossEarnings !== undefined ||
    updatedPayload.tips !== undefined ||
    updatedPayload.bonusIncentives !== undefined ||
    updatedPayload.fuelCost !== undefined ||
    updatedPayload.parkingCost !== undefined ||
    updatedPayload.foodExpense !== undefined ||
    updatedPayload.otherExpenses !== undefined ||
    updatedPayload.hoursWorked !== undefined ||
    updatedPayload.ordersCompleted !== undefined;

  if (hasFinanceUpdate) {
    const grossEarnings = updatedPayload.grossEarnings !== undefined ? Number(updatedPayload.grossEarnings) : log.grossEarnings;
    const tips = updatedPayload.tips !== undefined ? Number(updatedPayload.tips) : log.tips;
    const bonusIncentives = updatedPayload.bonusIncentives !== undefined ? Number(updatedPayload.bonusIncentives) : log.bonusIncentives;
    const fuelCost = updatedPayload.fuelCost !== undefined ? Number(updatedPayload.fuelCost) : log.fuelCost;
    const parkingCost = updatedPayload.parkingCost !== undefined ? Number(updatedPayload.parkingCost) : log.parkingCost;
    const foodExpense = updatedPayload.foodExpense !== undefined ? Number(updatedPayload.foodExpense) : log.foodExpense;
    const otherExpenses = updatedPayload.otherExpenses !== undefined ? Number(updatedPayload.otherExpenses) : log.otherExpenses;
    const hoursWorked = updatedPayload.hoursWorked !== undefined ? Number(updatedPayload.hoursWorked) : log.hoursWorked;
    const ordersCompleted = updatedPayload.ordersCompleted !== undefined ? Number(updatedPayload.ordersCompleted) : log.ordersCompleted;

    const metrics = calculateWorkLogMetrics({
      grossEarnings,
      tips,
      bonusIncentives,
      fuelCost,
      parkingCost,
      foodExpense,
      otherExpenses,
      hoursWorked,
      ordersCompleted,
    });

    Object.assign(updatedPayload, {
      totalExpenses: metrics.totalExpenses,
      totalEarnings: metrics.totalEarnings,
      netProfit: metrics.netProfit,
      avgEarningsPerHour: metrics.avgEarningsPerHour,
      avgEarningsPerOrder: metrics.avgEarningsPerOrder,
    });
  }

  const updatedLog = await WorkLog.findByIdAndUpdate(logId, updatedPayload, { new: true });
  return updatedLog;
};

export const deleteWorkLog = async (userId: string, logId: string) => {
  const log = await WorkLog.findById(logId);
  if (!log) {
    throw new Error('Work log not found');
  }
  if (log.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized to delete this work log');
  }

  await WorkLog.findByIdAndDelete(logId);
  return { success: true };
};
