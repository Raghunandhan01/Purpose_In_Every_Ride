import { WorkLog, WeeklyReport, User } from '../models/index.js';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini SDK with telemetry header
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

export function getWeekRange(dateInput: string | Date = new Date()) {
  const d = new Date(dateInput);
  const day = d.getDay();
  // Adjust so Monday is day 1, Sunday is day 7
  const diffToMonday = d.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(d.setDate(diffToMonday));
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return {
    startDate: monday.toISOString().split('T')[0],
    endDate: sunday.toISOString().split('T')[0],
  };
}

// Generate reports fallback locally if Gemini key is missing
function generateFallbackAIAnalysis(metrics: any) {
  const profit = metrics.netProfit;
  const healthScore = Math.min(100, Math.max(40, Math.round(
    (profit > 5000 ? 85 : profit > 2000 ? 70 : 50) +
    (metrics.fuelCosts / (metrics.totalEarnings || 1) < 0.15 ? 15 : 5) +
    (metrics.avgEarningsPerHour > 200 ? 10 : 5)
  )));

  const insights = [
    `Your most profitable platform this week was ${metrics.bestPerformingPlatform || 'N/A'} contributing the majority of your earnings.`,
    `Fuel cost represented ${((metrics.fuelCosts / (metrics.totalEarnings || 1)) * 100).toFixed(1)}% of your total earnings this week.`,
    `You maintained a solid average of ${metrics.avgEarningsPerOrder.toFixed(0)} INR per completed delivery across ${metrics.ordersCompleted} orders.`
  ];

  const recommendations = [
    "Aim to cut fuel expenditure by planning deliveries to minimize double-backs and utilizing RAPIDO/Uber during high surge periods.",
    "Allocate at least 25% of this week's profit (approx. " + Math.round(profit * 0.25) + " INR) directly into your savings account.",
    "Schedule vehicle servicing early next week; optimized tyre pressure can improve fuel efficiency by up to 8%."
  ];

  const strategies = [
    "Focus your shifts around lunch (12:00 PM - 3:30 PM) and dinner (7:30 PM - 10:30 PM) peak surge windows.",
    "Multi-app during slower mid-afternoon hours by keeping Swiggy and Zomato active concurrently.",
    "Target weekend platform bonuses by completing minimum order milestone incentives on Rapido."
  ];

  const alerts = [];
  if (metrics.fuelCosts / (metrics.totalEarnings || 1) > 0.18) {
    alerts.push("Alert: High fuel expenditure detected. Consider adjusting acceleration and tire pressure.");
  }
  if (profit < 1500) {
    alerts.push("Warning: Earnings are lower than average. Target high-density delivery zones during lunch hours.");
  }

  return {
    insights,
    recommendations,
    strategies,
    profitableHours: ["12:00 PM - 3:00 PM (Lunch Surge)", "7:00 PM - 10:00 PM (Dinner Peak)"],
    predictedEarnings: Math.round(profit * 1.05 + 200),
    motivationalFeedback: profit > 3000 
      ? "Outstanding shift compliance this week! Your dedication is building a strong financial runway." 
      : "Steady effort this week! Minor tactical shifts in platform selection can boost your hourly profit.",
    financialHealthScore: healthScore,
    alerts
  };
}

export async function generateWeeklyReport(userId: string, dateInput: string | Date = new Date()) {
  const { startDate, endDate } = getWeekRange(dateInput);

  // Check if a report for this week already exists
  const existingReport = await WeeklyReport.findOne({ userId, startDate, endDate });
  if (existingReport) {
    return existingReport;
  }

  // 1. Fetch current week's logs
  const logs = await WorkLog.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  });

  // 2. Fetch previous week's logs for growth comparison
  const prevD = new Date(new Date(startDate).getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevWeek = getWeekRange(prevD);
  const prevLogs = await WorkLog.find({
    userId,
    date: { $gte: prevWeek.startDate, $lte: prevWeek.endDate }
  });

  const prevTotalEarnings = prevLogs.reduce((sum: number, log: any) => sum + (log.totalEarnings || 0), 0);

  // Compile current week metrics
  let totalEarnings = 0;
  let totalExpenses = 0;
  let netProfit = 0;
  let ordersCompleted = 0;
  let workingHours = 0;
  let tips = 0;
  let incentivesAndBonuses = 0;
  let fuelCosts = 0;
  let parkingCost = 0;
  let otherExpenses = 0;
  let totalDistanceTraveled = 0;

  const dayEarnings: Record<string, number> = {};
  const platformEarnings: Record<string, number> = {};
  const platformProfit: Record<string, number> = {};

  // Standard platform commission is typically 15-20% which is already factored in, but we list it for rider visibility
  let platformCommissions = 0;

  logs.forEach((log: any) => {
    totalEarnings += log.totalEarnings || 0;
    totalExpenses += log.totalExpenses || 0;
    netProfit += log.netProfit || 0;
    ordersCompleted += log.ordersCompleted || 0;
    workingHours += log.hoursWorked || 0;
    tips += log.tips || 0;
    incentivesAndBonuses += log.bonusIncentives || 0;
    fuelCosts += log.fuelCost || 0;
    parkingCost += log.parkingCost || 0;
    otherExpenses += log.otherExpenses || 0;
    totalDistanceTraveled += log.distanceTravelled || 0;

    dayEarnings[log.date] = (dayEarnings[log.date] || 0) + (log.totalEarnings || 0);
    
    const plt = log.platform.toLowerCase();
    platformEarnings[plt] = (platformEarnings[plt] || 0) + (log.totalEarnings || 0);
    platformProfit[plt] = (platformProfit[plt] || 0) + (log.netProfit || 0);
  });

  // Vehicle maintenance is estimated at a wear-and-tear rate of 1.5 INR / km + otherExpenses
  const vehicleMaintenance = Number((totalDistanceTraveled * 1.5 + otherExpenses).toFixed(2));
  
  // Platform commissions estimated at 18% of gross earnings (industry average for visibility)
  platformCommissions = Number((totalEarnings * 0.18).toFixed(2));

  // Savings target (30% of profit or net profit - food/parking expenses as surplus)
  const totalSavings = Number((netProfit > 0 ? netProfit * 0.3 : 0).toFixed(2));

  // Days with active work logs
  const activeDays = Object.keys(dayEarnings);
  const activeDaysCount = activeDays.length || 1;

  const avgDailyEarnings = Number((totalEarnings / activeDaysCount).toFixed(2));
  const avgEarningsPerHour = workingHours > 0 ? Number((totalEarnings / workingHours).toFixed(2)) : 0;
  const avgEarningsPerOrder = ordersCompleted > 0 ? Number((totalEarnings / ordersCompleted).toFixed(2)) : 0;

  // Best & Lowest days
  let bestDayDate = '';
  let bestDayAmount = 0;
  let lowestDayDate = '';
  let lowestDayAmount = Infinity;

  activeDays.forEach(d => {
    const amt = dayEarnings[d];
    if (amt > bestDayAmount) {
      bestDayAmount = amt;
      bestDayDate = d;
    }
    if (amt < lowestDayAmount) {
      lowestDayAmount = amt;
      lowestDayDate = d;
    }
  });

  if (activeDaysCount === 0 || lowestDayAmount === Infinity) {
    lowestDayAmount = 0;
  }

  // Best Performing Platform
  let bestPerformingPlatform = 'None';
  let maxPltProfit = -Infinity;
  Object.keys(platformProfit).forEach(p => {
    if (platformProfit[p] > maxPltProfit) {
      maxPltProfit = platformProfit[p];
      bestPerformingPlatform = p.charAt(0).toUpperCase() + p.slice(1);
    }
  });

  // Fuel Efficiency (km per Litre)
  // Assuming fuel rate of 100 INR per Litre
  const fuelConsumedLitres = fuelCosts / 100;
  const fuelEfficiency = fuelConsumedLitres > 0 ? Number((totalDistanceTraveled / fuelConsumedLitres).toFixed(1)) : 45.0;

  // Weekly Growth Comparison
  let weeklyGrowthPercentage = 0;
  if (prevTotalEarnings > 0) {
    weeklyGrowthPercentage = Number((((totalEarnings - prevTotalEarnings) / prevTotalEarnings) * 100).toFixed(1));
  } else if (logs.length > 0) {
    weeklyGrowthPercentage = 100.0; // Growth since first week
  }

  const compiledMetrics = {
    totalEarnings: Number(totalEarnings.toFixed(2)),
    totalExpenses: Number(totalExpenses.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    totalSavings,
    ordersCompleted,
    workingHours: Number(workingHours.toFixed(1)),
    tips: Number(tips.toFixed(2)),
    incentivesAndBonuses: Number(incentivesAndBonuses.toFixed(2)),
    fuelCosts: Number(fuelCosts.toFixed(2)),
    vehicleMaintenance,
    platformCommissions,
    avgDailyEarnings,
    avgEarningsPerHour,
    avgEarningsPerOrder,
    bestEarningDay: { date: bestDayDate, earnings: Number(bestDayAmount.toFixed(2)) },
    lowestEarningDay: { date: lowestDayDate, earnings: Number(lowestDayAmount.toFixed(2)) },
    bestPerformingPlatform,
    totalDistanceTraveled: Number(totalDistanceTraveled.toFixed(1)),
    fuelEfficiency,
    weeklyGrowthPercentage
  };

  // 3. Integrate Google Gemini API for personalized analysis
  let aiAnalysis;
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `Analyze this delivery rider's weekly financial summary and generate personalized insights, suggestions to reduce expenses, savings strategies, profitable shift predictions, and expected earnings.
      
      Weekly Financial Metrics:
      - Total Earnings: ${compiledMetrics.totalEarnings} INR
      - Total Expenses: ${compiledMetrics.totalExpenses} INR (Fuel Cost: ${compiledMetrics.fuelCosts} INR, Estimated Vehicle Wear/Maintenance: ${compiledMetrics.vehicleMaintenance} INR)
      - Net Profit: ${compiledMetrics.netProfit} INR
      - Savings Calculated: ${compiledMetrics.totalSavings} INR
      - Orders Completed: ${compiledMetrics.ordersCompleted}
      - Hours Logged: ${compiledMetrics.workingHours}
      - Tips Received: ${compiledMetrics.tips} INR
      - Platform Incentives/Bonuses: ${compiledMetrics.incentivesAndBonuses} INR
      - Avg Daily Earnings: ${compiledMetrics.avgDailyEarnings} INR
      - Avg Earnings/Hour: ${compiledMetrics.avgEarningsPerHour} INR
      - Avg Earnings/Order: ${compiledMetrics.avgEarningsPerOrder} INR
      - Best Earning Day: ${compiledMetrics.bestEarningDay.date} (${compiledMetrics.bestEarningDay.earnings} INR)
      - Best Performing Platform: ${compiledMetrics.bestPerformingPlatform}
      - Total Distance: ${compiledMetrics.totalDistanceTraveled} km
      - Fuel Efficiency: ${compiledMetrics.fuelEfficiency} km/L
      - Weekly Growth: ${compiledMetrics.weeklyGrowthPercentage}% compared to last week (${prevTotalEarnings} INR total)
      
      Provide your response strictly in the requested JSON structure. Include realistic recommendations, future earning strategies, and high-earning profitable hours. Return a supportive and positive motivational feedback line.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional financial advisor specializing in delivery rider economies, helping gig-economy workers in India optimize fuel efficiency, platform selections, working shifts, and savings.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3-4 highly specific financial insights derived directly from the metrics."
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2-3 precise recommendations for savings or expense reduction (specifically referencing fuel, wear-and-tear, or food)."
              },
              strategies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2-3 peak platform shifting or weekend incentive maximizing strategies."
              },
              profitableHours: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Identified peak demand hour slots (e.g., '12:00 PM - 3:30 PM (Lunch Surge)', '7:30 PM - 10:30 PM (Dinner Peak)')."
              },
              predictedEarnings: {
                type: Type.NUMBER,
                description: "A calculated forecast of next week's expected net earnings (INR)."
              },
              motivationalFeedback: {
                type: Type.STRING,
                description: "An encouraging, polite, human-centric summary of their performance."
              },
              financialHealthScore: {
                type: Type.NUMBER,
                description: "An overall health index score from 40 to 100 based on earnings consistency and expense-to-income ratios."
              },
              alerts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Smart warnings if expenses exceed 25% of earnings, or if there is a massive dip in average hourly rate."
              }
            },
            required: [
              "insights", "recommendations", "strategies", "profitableHours",
              "predictedEarnings", "motivationalFeedback", "financialHealthScore", "alerts"
            ]
          }
        }
      });

      if (response && response.text) {
        aiAnalysis = JSON.parse(response.text.trim());
      } else {
        throw new Error("Empty response from Gemini");
      }
    } catch (err) {
      console.error("Gemini Weekly Report API generation error:", err);
      aiAnalysis = generateFallbackAIAnalysis(compiledMetrics);
    }
  } else {
    // Graceful offline rules-based summary engine
    aiAnalysis = generateFallbackAIAnalysis(compiledMetrics);
  }

  // 4. Create and save the new Weekly Report
  const newReport = await WeeklyReport.create({
    userId,
    startDate,
    endDate,
    metrics: compiledMetrics,
    aiAnalysis,
    scheduleType: 'Sunday'
  });

  return newReport;
}

const DAYS_MAP: Record<string, number> = {
  'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6
};

export async function checkAndRunScheduledReports() {
  try {
    const users = await User.find({});
    const now = new Date();
    const currentDayIdx = now.getDay();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    for (const user of users) {
      const uId = user.id || user._id?.toString();
      if (!uId) continue;

      let settings = { day: 'Sunday', time: '23:59', enabled: true };
      if (user.goals) {
        try {
          const parsed = JSON.parse(user.goals);
          const settingsObj = parsed.find((item: any) => item.type === 'weekly_report_settings');
          if (settingsObj) {
            settings = settingsObj.value;
          }
        } catch (e) {}
      }

      if (!settings.enabled) continue;

      const { startDate, endDate } = getWeekRange(now);

      // Check if report already exists for this week
      const existing = await WeeklyReport.findOne({ userId: uId, startDate, endDate });
      if (existing) continue;

      const targetDayIdx = DAYS_MAP[settings.day.toLowerCase()] ?? 0;
      const [targetHourStr, targetMinStr] = settings.time.split(':');
      const targetHour = Number(targetHourStr || 23);
      const targetMin = Number(targetMinStr || 59);

      // Check if it is the target day or later in the week
      let shouldTrigger = false;
      if (currentDayIdx > targetDayIdx) {
        shouldTrigger = true;
      } else if (currentDayIdx === targetDayIdx) {
        if (currentHour > targetHour) {
          shouldTrigger = true;
        } else if (currentHour === targetHour && currentMin >= targetMin) {
          shouldTrigger = true;
        }
      }

      if (shouldTrigger) {
        console.log(`[Scheduler] Auto-generating Weekly Financial Report for user ${uId} for period ${startDate} to ${endDate}`);
        await generateWeeklyReport(uId, now);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error running scheduled reports:', error);
  }
}
