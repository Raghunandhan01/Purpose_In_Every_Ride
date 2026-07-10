import { EmergencyFund, EmergencyFundTransaction, WorkLog, User } from '../models/index.js';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Calculate recommended savings rates
export function calculateSavingsRecommendations(targetAmount: number, currentSavings: number, preferredCompletionDateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const completionDate = new Date(preferredCompletionDateStr);
  completionDate.setHours(23, 59, 59, 999);
  
  const remainingToSave = Math.max(0, targetAmount - currentSavings);
  
  const diffTime = completionDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0 || remainingToSave <= 0) {
    return {
      daysRemaining: Math.max(0, diffDays),
      recommendedDaily: 0,
      recommendedWeekly: 0,
      recommendedMonthly: 0,
    };
  }
  
  const recommendedDaily = Math.round((remainingToSave / diffDays) * 100) / 100;
  
  const diffWeeks = diffDays / 7;
  const recommendedWeekly = Math.round((remainingToSave / (diffWeeks || 1)) * 100) / 100;
  
  const diffMonths = diffDays / 30.41;
  const recommendedMonthly = Math.round((remainingToSave / (diffMonths || 1)) * 100) / 100;
  
  return {
    daysRemaining: diffDays,
    recommendedDaily,
    recommendedWeekly,
    recommendedMonthly,
  };
}

// 1. Get all emergency funds for a user
export const getEmergencyFunds = async (userId: string) => {
  const funds = await EmergencyFund.find({ userId });
  
  // Enrich each fund with recommendations
  const enrichedFunds = funds.map((fund: any) => {
    const recommendations = calculateSavingsRecommendations(
      fund.targetAmount,
      fund.currentSavings,
      fund.preferredCompletionDate
    );
    
    // Milestones check
    const percentage = fund.targetAmount > 0 
      ? Math.min(100, Math.round((fund.currentSavings / fund.targetAmount) * 100))
      : 0;
      
    const milestones = {
      reached25: percentage >= 25,
      reached50: percentage >= 50,
      reached75: percentage >= 75,
      reached100: percentage >= 100,
    };

    return {
      ...fund,
      percentage,
      milestones,
      ...recommendations,
    };
  });
  
  // Calculate summary stats
  let totalTarget = 0;
  let totalSaved = 0;
  let totalMonthlyExpenseEstimate = 0;
  
  enrichedFunds.forEach((f: any) => {
    totalTarget += f.targetAmount || 0;
    totalSaved += f.currentSavings || 0;
    totalMonthlyExpenseEstimate += f.monthlyExpenseEstimate || 0;
  });
  
  const overallPercentage = totalTarget > 0 
    ? Math.min(100, Math.round((totalSaved / totalTarget) * 100))
    : 0;

  return {
    funds: enrichedFunds,
    summary: {
      totalTarget,
      totalSaved,
      totalRemaining: Math.max(0, totalTarget - totalSaved),
      overallPercentage,
      totalMonthlyExpenseEstimate,
    }
  };
};

// 2. Get fund by ID
export const getEmergencyFundById = async (userId: string, fundId: string) => {
  const fund = await EmergencyFund.findOne({ _id: fundId, userId });
  if (!fund) {
    throw new Error('Emergency fund not found');
  }
  
  const recommendations = calculateSavingsRecommendations(
    fund.targetAmount,
    fund.currentSavings,
    fund.preferredCompletionDate
  );
  
  const percentage = fund.targetAmount > 0 
    ? Math.min(100, Math.round((fund.currentSavings / fund.targetAmount) * 100))
    : 0;
    
  const milestones = {
    reached25: percentage >= 25,
    reached50: percentage >= 50,
    reached75: percentage >= 75,
    reached100: percentage >= 100,
  };

  return {
    ...fund,
    percentage,
    milestones,
    ...recommendations,
  };
};

// 3. Create emergency fund
export const createEmergencyFund = async (userId: string, data: any) => {
  const newFund = await EmergencyFund.create({
    userId,
    name: data.name,
    category: data.category,
    targetAmount: Number(data.targetAmount),
    currentSavings: Number(data.currentSavings || 0),
    preferredCompletionDate: data.preferredCompletionDate,
    monthlyExpenseEstimate: Number(data.monthlyExpenseEstimate || 0),
    status: data.status || 'Active',
    allocationRule: data.allocationRule || 'Manual',
    allocationPercentage: Number(data.allocationPercentage || 10),
  });

  // If initial savings > 0, create a transaction record for it
  if (Number(data.currentSavings) > 0) {
    await EmergencyFundTransaction.create({
      userId,
      fundId: newFund._id,
      type: 'Contribution',
      amount: Number(data.currentSavings),
      source: 'Manual',
      date: new Date().toISOString().split('T')[0],
      notes: 'Initial savings allocation on goal creation',
    });
  }

  return newFund;
};

// 4. Update emergency fund
export const updateEmergencyFund = async (userId: string, fundId: string, data: any) => {
  const existing = await EmergencyFund.findOne({ _id: fundId, userId });
  if (!existing) {
    throw new Error('Emergency fund not found');
  }

  const updated = await EmergencyFund.findByIdAndUpdate(fundId, {
    name: data.name ?? existing.name,
    category: data.category ?? existing.category,
    targetAmount: data.targetAmount !== undefined ? Number(data.targetAmount) : existing.targetAmount,
    monthlyExpenseEstimate: data.monthlyExpenseEstimate !== undefined ? Number(data.monthlyExpenseEstimate) : existing.monthlyExpenseEstimate,
    status: data.status ?? existing.status,
    allocationRule: data.allocationRule ?? existing.allocationRule,
    allocationPercentage: data.allocationPercentage !== undefined ? Number(data.allocationPercentage) : existing.allocationPercentage,
    preferredCompletionDate: data.preferredCompletionDate ?? existing.preferredCompletionDate,
  }, { new: true });

  return updated;
};

// 5. Delete emergency fund
export const deleteEmergencyFund = async (userId: string, fundId: string) => {
  const deleted = await EmergencyFund.findByIdAndDelete(fundId);
  if (!deleted) {
    throw new Error('Emergency fund not found');
  }
  return deleted;
};

// 6. Get transactions for a fund
export const getTransactionsForFund = async (userId: string, fundId: string) => {
  return await EmergencyFundTransaction.find({ userId, fundId });
};

// 6b. Get all transactions for a user
export const getAllTransactions = async (userId: string) => {
  return await EmergencyFundTransaction.find({ userId });
};

// 7. Add a transaction (Contribution or Withdrawal)
export const createTransaction = async (userId: string, fundId: string, data: any) => {
  const fund = await EmergencyFund.findOne({ _id: fundId, userId });
  if (!fund) {
    throw new Error('Emergency fund not found');
  }

  const amount = Number(data.amount);
  const type = data.type; // 'Contribution' or 'Withdrawal'
  const source = data.source || 'Manual';
  const notes = data.notes || '';
  const date = data.date || new Date().toISOString().split('T')[0];

  // Calculate new currentSavings
  let newSavings = fund.currentSavings;
  if (type === 'Contribution') {
    newSavings += amount;
  } else if (type === 'Withdrawal') {
    newSavings = Math.max(0, newSavings - amount);
  } else {
    throw new Error('Invalid transaction type. Must be Contribution or Withdrawal.');
  }

  // Update Fund
  await EmergencyFund.findByIdAndUpdate(fundId, {
    currentSavings: newSavings,
    status: newSavings >= fund.targetAmount ? 'Completed' : fund.status
  }, { new: true });

  // Create transaction record
  const transaction = await EmergencyFundTransaction.create({
    userId,
    fundId,
    type,
    amount,
    source,
    date,
    notes,
  });

  return transaction;
};

// 8. Automatically allocate savings when work logs are created
export const processAutoAllocationForWorkLog = async (userId: string, workLog: any) => {
  try {
    const activeFunds = await EmergencyFund.find({ userId, status: 'Active' });
    if (!activeFunds || activeFunds.length === 0) return;

    for (const fund of activeFunds) {
      let amountToAllocate = 0;
      let notes = '';
      let source = 'Auto-allocation';

      if (fund.allocationRule === 'Percentage') {
        const percentage = fund.allocationPercentage || 10;
        amountToAllocate = Math.round((percentage / 100) * (workLog.totalEarnings || 0));
        notes = `${percentage}% automatic earnings allocation from ${workLog.platform || 'Platform'} shift on ${workLog.date}`;
      } else if (fund.allocationRule === 'Surplus') {
        // If net profit > 800 INR, allocate 15% of net profit as surplus
        if (workLog.netProfit && workLog.netProfit > 800) {
          const percentage = fund.allocationPercentage || 15;
          amountToAllocate = Math.round((percentage / 100) * workLog.netProfit);
          notes = `Surplus earnings automatic allocation from highly profitable shift on ${workLog.date}`;
          source = 'Earnings Surplus';
        }
      }

      if (amountToAllocate > 0) {
        // Double check savings does not exceed target
        const remaining = Math.max(0, fund.targetAmount - fund.currentSavings);
        const actualAllocation = Math.min(amountToAllocate, remaining);

        if (actualAllocation > 0) {
          await createTransaction(userId, fund._id, {
            type: 'Contribution',
            amount: actualAllocation,
            source,
            notes,
            date: workLog.date,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error during auto-allocation:', error);
  }
};

// 9. Run "What-If" Simulation
export const simulateWhatIf = async (userId: string, fundId: string, params: any) => {
  const fund = await EmergencyFund.findOne({ _id: fundId, userId });
  if (!fund) {
    throw new Error('Emergency fund not found');
  }

  const currentSavings = fund.currentSavings;
  const targetAmount = fund.targetAmount;
  const remaining = Math.max(0, targetAmount - currentSavings);

  // Simulation inputs
  const dailyEarnings = Number(params.dailyEarnings || 1500); // Typical Indian delivery rider daily average
  const dailyExpenses = Number(params.dailyExpenses || 400); // Fuel, maintenance, food, cell pack
  const extraSavingsRate = Number(params.extraSavingsRate || 10); // Percentage to save: e.g. 10%

  const dailySavings = Math.max(0, (dailyEarnings - dailyExpenses) * (extraSavingsRate / 100));

  let daysToTarget = Infinity;
  let simulatedDate = 'Never';

  if (dailySavings > 0) {
    daysToTarget = Math.ceil(remaining / dailySavings);
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + daysToTarget);
    simulatedDate = dateObj.toISOString().split('T')[0];
  }

  // Baseline recommended savings rates
  const recommendations = calculateSavingsRecommendations(
    targetAmount,
    currentSavings,
    fund.preferredCompletionDate
  );

  return {
    currentSavings,
    targetAmount,
    remaining,
    dailySavingsSimulated: dailySavings,
    daysToTarget,
    simulatedCompletionDate: simulatedDate,
    baselineDaysRemaining: recommendations.daysRemaining,
    baselineCompletionDate: fund.preferredCompletionDate,
    completionDifferenceDays: isFinite(daysToTarget) ? (recommendations.daysRemaining - daysToTarget) : 0
  };
};

// 10. AI-Powered Advice & Insights via Gemini
export const getEmergencyFundAdvice = async (userId: string) => {
  // Retrieve current active funds
  const fundsData = await getEmergencyFunds(userId);
  const { funds, summary } = fundsData;

  // Retrieve user's last 30 days of work logs for spending and earnings history
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];
  const endDateStr = new Date().toISOString().split('T')[0];

  const logs = await WorkLog.find({
    userId,
    date: { $gte: startDateStr, $lte: endDateStr }
  });

  // Compile summary of logs
  let totalEarnings = 0;
  let totalFuelCost = 0;
  let totalOtherExpenses = 0;
  let totalNetProfit = 0;
  let ordersCompleted = 0;
  let hoursWorked = 0;

  const platformActivity: { [key: string]: number } = {};

  logs.forEach((log: any) => {
    totalEarnings += log.totalEarnings || 0;
    totalFuelCost += log.fuelCost || 0;
    totalOtherExpenses += (log.foodExpense || 0) + (log.parkingCost || 0) + (log.otherExpenses || 0);
    totalNetProfit += log.netProfit || 0;
    ordersCompleted += log.ordersCompleted || 0;
    hoursWorked += log.hoursWorked || 0;

    const plat = log.platform || 'other';
    platformActivity[plat] = (platformActivity[plat] || 0) + (log.totalEarnings || 0);
  });

  const bestPlatform = Object.entries(platformActivity).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `You are an expert financial advisor for delivery partners and gig-workers in India. Analyze the partner's financial history and emergency fund goals to provide personalized advice on saving faster.
      
      Emergency Funds Goals:
      ${funds.map((f: any) => `- Fund: "${f.name}" (${f.category}), Target: ${f.targetAmount} INR, Current: ${f.currentSavings} INR, Completion Date: ${f.preferredCompletionDate}, Recommended Monthly Savings: ${f.recommendedMonthly} INR.`).join('\n')}
      
      Total Target across all funds: ${summary.totalTarget} INR
      Total Saved: ${summary.totalSaved} INR
      Remaining Balance needed: ${summary.totalRemaining} INR

      Rider's Past 30 Days Gig Activity:
      - Total Earnings: ${totalEarnings} INR
      - Total Fuel Expenses: ${totalFuelCost} INR
      - Other Business Expenses (Food, Parking, Mobile): ${totalOtherExpenses} INR
      - Total Net Profit: ${totalNetProfit} INR
      - Deliveries Completed: ${ordersCompleted}
      - Hours Logged on Road: ${hoursWorked} hours
      - Best Performing Platform by Revenue: ${bestPlatform}
      
      Generate highly actionable, clear, and contextual advice.
      1. Give a summary of progress (statusSummary).
      2. Provide 3 specific saving suggestions to reach the goal faster (savingsTips).
      3. Identify 2 potential high-spending categories or waste, specifically referencing fuel efficiency or food expenses (expenseReductionTips).
      4. Suggest 2 optimal shift times or multi-platform schedules to maximize surge and reach goals sooner (optimalWorkSchedules).
      5. Include a warm, highly motivating feedback line (aiRecommendationMessage).
      
      Output strictly in JSON format matching the schema requested.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional financial advisor specializing in delivery rider economies, helping gig-economy workers in India optimize fuel efficiency, platform selections, working shifts, and savings.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              statusSummary: {
                type: Type.STRING,
                description: "A summary of current emergency fund progress relative to past 30-day performance."
              },
              savingsTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 highly tailored savings suggestions (e.g. automatic allocations, incremental deposits)."
              },
              expenseReductionTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2 custom expense trimming tips focusing on high fuel/maintenance or food leakage."
              },
              optimalWorkSchedules: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2 shift optimization suggestions to earn higher rates and surge pay."
              },
              aiRecommendationMessage: {
                type: Type.STRING,
                description: "A highly positive and supportive personal motivation statement for the partner."
              }
            },
            required: ["statusSummary", "savingsTips", "expenseReductionTips", "optimalWorkSchedules", "aiRecommendationMessage"]
          }
        }
      });

      if (response && response.text) {
        return JSON.parse(response.text);
      }
    } catch (e) {
      console.error('Error generating Gemini advice:', e);
    }
  }

  // Robust, localized, supportive fallback if API call fails or key is missing
  const monthlySavingsRequiredTotal = funds.reduce((sum, f) => sum + (f.recommendedMonthly || 0), 0);
  const statusSummary = summary.totalTarget > 0
    ? `You have built ${summary.overallPercentage}% of your total emergency savings goal (${summary.totalSaved} INR out of ${summary.totalTarget} INR). To stay on track, you need to save approximately ${Math.round(monthlySavingsRequiredTotal)} INR per month.`
    : `You haven't set up any active emergency savings goals yet. Having a safety net equal to 3 months of vehicle and living expenses is highly recommended.`;

  return {
    statusSummary,
    savingsTips: [
      `Move to automatic weekly allocations. If you save just 10% of your earnings from ${bestPlatform || 'your top platform'} shifts, you will save roughly ${Math.round(totalEarnings * 0.1)} INR per month automatically.`,
      `Whenever you earn a high tip or a weekend milestone incentive of 150 INR or more, make a habit of transferring 50% of it directly into your Vehicle Repair fund.`,
      `Set up a strict manual daily contribution of 50 INR. It feels small but builds 1,500 INR in secure safety cushion every month.`
    ],
    expenseReductionTips: [
      `Your fuel cost represent a significant portion of earnings. Try to minimize multi-app running without active bookings, and maintain a constant 40-50 km/h speed on your scooter to improve mileage by 15%.`,
      `Avoid buying commercial bottled tea or high-priced lunch snacks on the road. Carrying home-cooked meals and a water bottle can save you up to 100 INR daily (3,000 INR monthly).`
    ],
    optimalWorkSchedules: [
      `Focus shifts around peak food delivery windows (11:30 AM - 3:00 PM for Lunch surge, and 7:00 PM - 11:00 PM for Dinner peaks) on Zomato/Swiggy to double your order surge.`,
      `Multi-app with Rapido during morning rush hours (8:00 AM - 10:30 AM) when office commuters drive up pricing and demand.`
    ],
    aiRecommendationMessage: `Excellent effort! Having ${summary.totalSaved} INR in hand shows you understand the value of financial security. Keep riding safely, track those fuel stops, and let's reach that next savings milestone together!`
  };
};
