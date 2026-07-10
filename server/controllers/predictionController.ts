import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { WorkLog } from '../models/index.js';
import { GoogleGenAI } from '@google/genai';

export const getPredictionsAndInsights = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    
    // 1. Fetch user logs
    const allLogs = await WorkLog.find({ userId });
    
    // Sort logs by date to compute trends
    const sortedLogs = [...allLogs].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate historical stats
    const totalLogs = sortedLogs.length;
    let totalEarnings = 0;
    let totalExpenses = 0;
    let totalHours = 0;
    let totalOrders = 0;
    let totalFuel = 0;
    let totalFood = 0;
    let totalMaintenance = 0;
    let totalOther = 0;

    sortedLogs.forEach((log: any) => {
      totalEarnings += log.totalEarnings || 0;
      totalExpenses += log.totalExpenses || 0;
      totalHours += log.hoursWorked || 0;
      totalOrders += log.ordersCompleted || 0;
      totalFuel += log.fuelCost || 0;
      totalFood += log.foodExpense || 0;
      totalMaintenance += log.parkingCost || 0; // mapping parking/maintenance
      totalOther += log.otherExpenses || 0;
    });

    // Baseline daily calculations
    const uniqueDays = new Set(sortedLogs.map((log: any) => log.date)).size || 1;
    const avgDailyEarnings = totalEarnings / uniqueDays || 500; // fallback default
    const avgDailyExpenses = totalExpenses / uniqueDays || 100;
    const avgDailyProfit = avgDailyEarnings - avgDailyExpenses;
    const avgHoursPerDay = totalHours / uniqueDays || 6;
    const avgEarningsPerHour = totalHours > 0 ? totalEarnings / totalHours : 80;
    const avgOrdersPerDay = totalOrders / uniqueDays || 8;
    const expenseRatio = totalEarnings > 0 ? totalExpenses / totalEarnings : 0.2;

    // Spending Categories & Budgets
    // Default categories: Fuel, Food, Maintenance, EMI, Rent, Insurance, Miscellaneous
    const spendingCategories = [
      { name: 'Fuel', amount: totalFuel / uniqueDays * 30 || 1500, percentage: 0 },
      { name: 'Food', amount: totalFood / uniqueDays * 30 || 1000, percentage: 0 },
      { name: 'Maintenance', amount: (totalMaintenance || 200) / uniqueDays * 30 || 500, percentage: 0 },
      { name: 'EMI', amount: 1200, percentage: 0 }, // common bike emi
      { name: 'Rent', amount: 3000, percentage: 0 },
      { name: 'Insurance', amount: 300, percentage: 0 },
      { name: 'Miscellaneous', amount: totalOther / uniqueDays * 30 || 500, percentage: 0 }
    ];

    const totalCategorySpend = spendingCategories.reduce((acc, cat) => acc + cat.amount, 0);
    spendingCategories.forEach(cat => {
      cat.percentage = totalCategorySpend > 0 ? Math.round((cat.amount / totalCategorySpend) * 100) : 0;
    });

    // 2. Base Predictions & Confidence Levels
    // Generate Daily, Weekly, Monthly, Yearly forecasts
    const lowFactor = 0.85;
    const highFactor = 1.15;

    const predictions = {
      daily: {
        expected: Math.round(avgDailyEarnings),
        low: Math.round(avgDailyEarnings * lowFactor),
        high: Math.round(avgDailyEarnings * highFactor),
        expenses: Math.round(avgDailyExpenses),
        netProfit: Math.round(avgDailyProfit),
        savings: Math.round(avgDailyProfit * 0.4), // Assuming 40% savings rate
        confidence: 90
      },
      weekly: {
        expected: Math.round(avgDailyEarnings * 6), // 6 working days
        low: Math.round(avgDailyEarnings * 6 * lowFactor),
        high: Math.round(avgDailyEarnings * 6 * highFactor),
        expenses: Math.round(avgDailyExpenses * 6),
        netProfit: Math.round(avgDailyProfit * 6),
        savings: Math.round(avgDailyProfit * 6 * 0.4),
        confidence: 85
      },
      monthly: {
        expected: Math.round(avgDailyEarnings * 25), // 25 working days
        low: Math.round(avgDailyEarnings * 25 * lowFactor),
        high: Math.round(avgDailyEarnings * 25 * highFactor),
        expenses: Math.round(avgDailyExpenses * 25),
        netProfit: Math.round(avgDailyProfit * 25),
        savings: Math.round(avgDailyProfit * 25 * 0.4),
        confidence: 80
      },
      yearly: {
        expected: Math.round(avgDailyEarnings * 300), // 300 working days
        low: Math.round(avgDailyEarnings * 300 * lowFactor),
        high: Math.round(avgDailyEarnings * 300 * highFactor),
        expenses: Math.round(avgDailyExpenses * 300),
        netProfit: Math.round(avgDailyProfit * 300),
        savings: Math.round(avgDailyProfit * 300 * 0.4),
        confidence: 70
      }
    };

    // 3. Cash Flow Forecasting (12 Months ahead)
    const cashFlowForecast = [];
    const seasonalMultipliers = [1.0, 0.95, 0.9, 1.05, 1.1, 1.15, 1.0, 0.95, 1.2, 1.25, 1.1, 1.05]; // demand surges in festive/monsoon months
    let balance = 5000; // initial starting balance
    
    for (let m = 1; m <= 12; m++) {
      const monthLabel = new Date(Date.now() + m * 30 * 24 * 60 * 60 * 1000).toLocaleString('default', { month: 'short' });
      const mult = seasonalMultipliers[m - 1];
      const monthlyEarn = Math.round(avgDailyEarnings * 25 * mult);
      const monthlyExp = Math.round(avgDailyExpenses * 25 + (m % 3 === 0 ? 1000 : 0)); // repair hike every 3 months
      const monthlyProfit = monthlyEarn - monthlyExp;
      balance += monthlyProfit * 0.4; // 40% goes to balance savings

      cashFlowForecast.push({
        month: monthLabel,
        Earnings: monthlyEarn,
        Expenses: monthlyExp,
        NetProfit: monthlyProfit,
        CumulativeSavings: Math.round(balance)
      });
    }

    // 4. Custom What-If Simulations (Request Parameters if provided)
    // Mults: hoursMultiplier, expensesMultiplier, orderMultiplier, incentivesMultiplier
    const simHours = req.query.simHours ? Number(req.query.simHours) : avgHoursPerDay;
    const simIncentives = req.query.simIncentives ? Number(req.query.simIncentives) : 1; // multiplier
    const simExpenses = req.query.simExpenses ? Number(req.query.simExpenses) : avgDailyExpenses;
    const simOrders = req.query.simOrders ? Number(req.query.simOrders) : avgOrdersPerDay;

    // What-If Formula:
    // Earnings = (Hours * EarningPerHour) + (Orders * (BaseEarning/Order)) * incentivesMultiplier
    const simBaseEarning = (simHours * avgEarningsPerHour) + (simOrders * 40 * simIncentives);
    const simProfit = simBaseEarning - simExpenses;

    const simulationResult = {
      hours: simHours,
      incentivesMult: simIncentives,
      expenses: simExpenses,
      orders: simOrders,
      predictedDailyEarnings: Math.round(simBaseEarning),
      predictedDailyExpenses: Math.round(simExpenses),
      predictedDailyNetProfit: Math.round(simProfit),
      predictedMonthlySavings: Math.round(simProfit * 25 * 0.4)
    };

    // 5. Gemini AI Advisor
    const apiKey = process.env.GEMINI_API_KEY;
    let aiAdvice = '';

    const summaryStatsForAI = `
      Historical average:
      - Daily Earnings: ₹${avgDailyEarnings.toFixed(0)}
      - Daily Expenses: ₹${avgDailyExpenses.toFixed(0)}
      - Daily Hours worked: ${avgHoursPerDay.toFixed(1)} hrs
      - Earnings per hour: ₹${avgEarningsPerHour.toFixed(0)}/hr
      - Completed orders per day: ${avgOrdersPerDay.toFixed(1)}
      
      Simulated profile:
      - Hours adjustment: ${simHours} hrs/day
      - Custom expenses: ₹${simExpenses}/day
      - Projected monthly savings: ₹${(simProfit * 25 * 0.4).toFixed(0)}
    `;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const prompt = `You are a warm, supportive, and extremely expert financial planner for a delivery gig partner in India. 
        Analyze their metrics and provide personalized, highly actionable insights.
        Keep it brief, scannable, and split into clear sections using simple Markdown.
        
        Metrics summary:
        ${summaryStatsForAI}

        Please structure your advice into exactly 4 sections with these headings:
        ### 💡 Earning Maximizer
        (Suggest specific ideas like shifting peak hours, bundling platforms, or tracking incentives)
        
        ### 🛡️ Expense Reduction
        (Focus on fuel optimization, regular scooter maintenance to avoid EMIs, or home-cooked food)
        
        ### 🎯 Financial Strategy
        (Give them a solid daily goal or emergency fund saving plan based on their savings potential)

        ### 🌟 Motivational Spark
        (Add a warm, highly encouraging closing sentence to keep them inspired)

        Avoid jargon. Speak in an encouraging, practical, and humble tone. Limit the response to 250 words total. Do not add intro or outro chat filler.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
        });

        aiAdvice = response.text || '';
      } catch (err: any) {
        console.error('Gemini prediction advice error:', err);
        aiAdvice = getRulesBasedAdvice(avgDailyEarnings, avgDailyProfit, expenseRatio);
      }
    } else {
      aiAdvice = getRulesBasedAdvice(avgDailyEarnings, avgDailyProfit, expenseRatio);
    }

    res.status(200).json({
      success: true,
      data: {
        historicalStats: {
          avgDailyEarnings: Math.round(avgDailyEarnings),
          avgDailyExpenses: Math.round(avgDailyExpenses),
          avgDailyProfit: Math.round(avgDailyProfit),
          avgHoursPerDay: Number(avgHoursPerDay.toFixed(1)),
          avgOrdersPerDay: Number(avgOrdersPerDay.toFixed(1)),
          avgEarningsPerHour: Math.round(avgEarningsPerHour),
          uniqueDays
        },
        predictions,
        spendingCategories,
        cashFlowForecast,
        simulationResult,
        aiAdvice
      }
    });

  } catch (error: any) {
    console.error('Error calculating predictions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while computing future predictions'
    });
  }
};

// Rules-based advisor fallback if Gemini fails or API key is absent
function getRulesBasedAdvice(avgDailyEarnings: number, avgDailyProfit: number, expenseRatio: number): string {
  const saveRate = avgDailyProfit * 0.4;
  
  return `### 💡 Earning Maximizer
- **Focus on peak-hour delivery incentives**: Your average hourly rate is ₹${(avgDailyEarnings / 6).toFixed(0)}/hr. Target dinner peak hours (7:00 PM - 11:00 PM) on weekends to capitalize on double-rate surges.
- **Multitask during off-peak times**: Balance Zomato food runs with Rapido bike-taxi trips in high-density office zones when food deliveries slow down.

### 🛡️ Expense Reduction
- **Fuel is your biggest profit-drainer**: Your expenses eat up ${Math.round(expenseRatio * 100)}% of your gross earnings. Maintain proper tire pressure weekly and avoid aggressive acceleration to boost fuel efficiency by 15%.
- **Scooter care**: Plan oil changes every 2,500 kms to prevent expensive engine wear.

### 🎯 Financial Strategy
- **Create a 15-day backup buffer**: Aim to build a basic cash reserve of ₹${Math.round(avgDailyEarnings * 15)} before upgrading or committing to major purchases.
- **Personalized Savings Plan**: Automate putting away ₹${Math.round(saveRate)} per active work log day.

### 🌟 Motivational Spark
Your work logs prove that you have an outstanding earning momentum. Take care of your vehicle and stay safe on the roads!`;
}
