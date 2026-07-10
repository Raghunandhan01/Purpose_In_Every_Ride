import React, { useState, useEffect } from 'react';
import { 
  Download, Printer, FileText, Calendar, Clock, CheckCircle2, 
  TrendingUp, Settings, Sparkles, Send, RefreshCw, AlertTriangle, 
  ChevronRight, BarChart2, PieChart as PieIcon, Info, DollarSign, MapPin, Award,
  Check, ArrowUpRight, ArrowDownRight, Share2, Mail, MessageSquare, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { formatCurrency } from '../utils/formatCurrency';
import api from '../lib/api';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, 
  PieChart, Pie, Cell 
} from 'recharts';

// Colors for visual charts
const COLORS = ['#e11d48', '#2563eb', '#16a34a', '#ca8a04', '#9333ea', '#0891b2'];

import scooterIconUrl from '../assets/images/scooter-icon.png';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'overview' | 'weekly-ai'>('overview');
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- TAB 1: Overview State ---
  const [dailyReport, setDailyReport] = useState({ earnings: 0, expenses: 0, profit: 0, orders: 0, hours: 0, date: '' });
  const [weeklyOverview, setWeeklyOverview] = useState({ earnings: 0, expenses: 0, profit: 0, orders: 0, hours: 0 });
  const [monthlyOverview, setMonthlyOverview] = useState({ earnings: 0, expenses: 0, profit: 0, orders: 0, hours: 0 });
  const [yearlyOverview, setYearlyOverview] = useState({ earnings: 0, expenses: 0, profit: 0, orders: 0, hours: 0 });

  // --- TAB 2: AI Weekly Report State ---
  const [weeklyReportsHistory, setWeeklyReportsHistory] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [settings, setSettings] = useState({ day: 'Sunday', time: '23:59', enabled: true });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // --- Modal/Popup State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareChannel, setShareChannel] = useState<'whatsapp' | 'email' | 'telegram'>('whatsapp');
  const [shareRecipient, setShareRecipient] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch worklogs
      const logRes = await api.get('/worklogs');
      if (logRes.data.success) {
        const allLogs = logRes.data.data || [];
        setLogs(allLogs);
        calculateOverviewReports(allLogs);
      }

      // 2. Fetch AI weekly reports history
      const historyRes = await api.get('/reports/weekly/history');
      if (historyRes.data.success) {
        const history = historyRes.data.data || [];
        setWeeklyReportsHistory(history);
        if (history.length > 0) {
          setSelectedReport(history[0]);
        }
      }

      // 3. Fetch report scheduler settings
      const settingsRes = await api.get('/reports/weekly/settings');
      if (settingsRes.data.success) {
        setSettings(settingsRes.data.data);
      }
    } catch (error) {
      toast.error('Failed to load financial records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Recalculates legacy overview reports
  const calculateOverviewReports = (allLogs: any[]) => {
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

    // Daily Report
    let todayLogs = allLogs.filter((l: any) => l.date === todayStr);
    if (todayLogs.length === 0 && allLogs.length > 0) {
      const sorted = [...allLogs].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestDateStr = sorted[0].date;
      todayLogs = allLogs.filter((l: any) => l.date === latestDateStr);
    }

    let dE = 0, dExp = 0, dO = 0, dH = 0, dDate = 'No data';
    if (todayLogs.length > 0) {
      todayLogs.forEach((l: any) => {
        dE += l.totalEarnings || 0;
        dExp += l.totalExpenses || 0;
        dO += l.ordersCompleted || 0;
        dH += l.hoursWorked || 0;
      });
      dDate = new Date(todayLogs[0].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    setDailyReport({ earnings: dE, expenses: dExp, profit: dE - dExp, orders: dO, hours: dH, date: dDate });

    // Weekly Report
    let wE = 0, wExp = 0, wO = 0, wH = 0;
    const weeklyLogs = allLogs.filter((l: any) => l.date >= lastWeekStr);
    weeklyLogs.forEach((l: any) => {
      wE += l.totalEarnings || 0;
      wExp += l.totalExpenses || 0;
      wO += l.ordersCompleted || 0;
      wH += l.hoursWorked || 0;
    });
    setWeeklyOverview({ earnings: wE, expenses: wExp, profit: wE - wExp, orders: wO, hours: wH });

    // Monthly Report
    let mE = 0, mExp = 0, mO = 0, mH = 0;
    const monthlyLogs = allLogs.filter((l: any) => l.date >= lastMonthStr);
    monthlyLogs.forEach((l: any) => {
      mE += l.totalEarnings || 0;
      mExp += l.totalExpenses || 0;
      mO += l.ordersCompleted || 0;
      mH += l.hoursWorked || 0;
    });
    setMonthlyOverview({ earnings: mE, expenses: mExp, profit: mE - mExp, orders: mO, hours: mH });

    // Yearly Report
    let yE = 0, yExp = 0, yO = 0, yH = 0;
    const yearlyLogs = allLogs.filter((l: any) => l.date >= lastYearStr);
    yearlyLogs.forEach((l: any) => {
      yE += l.totalEarnings || 0;
      yExp += l.totalExpenses || 0;
      yO += l.ordersCompleted || 0;
      yH += l.hoursWorked || 0;
    });
    setYearlyOverview({ earnings: yE, expenses: yExp, profit: yE - yExp, orders: yO, hours: yH });
  };

  // --- TAB 1 Downloader (Legacy fallback) ---
  const handleOverviewDownload = (reportName: string, reportData: any) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Metric,Value"].join(",") + "\n"
      + [
          `Report Type,${reportName}`,
          `Earnings,₹${reportData.earnings}`,
          `Expenses,₹${reportData.expenses}`,
          `Net Profit,₹${reportData.profit}`,
          `Orders Completed,${reportData.orders}`,
          `Hours Logged,${reportData.hours} hrs`
        ].join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportName.replace(/ /g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${reportName} report downloaded as CSV!`);
  };

  // --- On-Demand Report Generator ---
  const handleTriggerWeeklyReport = async () => {
    setIsGenerating(true);
    setGenStep(0);
    
    // Stagger loading indicators to simulate complex computation and AI model parsing
    const interval = setInterval(() => {
      setGenStep((prev) => {
        if (prev < 3) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 1200);

    try {
      const res = await api.post('/reports/weekly/generate', {});
      if (res.data.success) {
        clearInterval(interval);
        setGenStep(4);
        setTimeout(() => {
          const generatedReport = res.data.data;
          setWeeklyReportsHistory((prev) => {
            const exists = prev.some(r => r._id === generatedReport._id);
            if (exists) return prev;
            return [generatedReport, ...prev];
          });
          setSelectedReport(generatedReport);
          setIsGenerating(false);
          toast.success('AI Weekly Report Compiled Successfully!');
        }, 800);
      }
    } catch (error: any) {
      clearInterval(interval);
      setIsGenerating(false);
      toast.error(error.response?.data?.message || 'Failed to generate weekly financial report');
    }
  };

  // --- Update settings ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await api.post('/reports/weekly/settings', settings);
      if (res.data.success) {
        toast.success('Automatic Schedule Settings Saved!');
        setIsSettingsOpen(false);
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // --- Share report Simulation ---
  const handleShareReport = async () => {
    if (!selectedReport) return;
    setIsSharing(true);
    try {
      const res = await api.post(`/reports/weekly/${selectedReport._id}/share`, {
        channel: shareChannel,
        recipient: shareRecipient
      });
      if (res.data.success) {
        toast.success(`Weekly statement successfully shared with ${shareRecipient}!`);
        setIsShareModalOpen(false);
        setShareRecipient('');
      }
    } catch (error) {
      toast.error('Failed to share report');
    } finally {
      setIsSharing(false);
    }
  };

  // --- Export Helpers ---
  const handlePrintReport = () => {
    if (!selectedReport) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked! Please allow pop-ups to print reports.');
      return;
    }

    const { metrics, aiAnalysis, startDate, endDate } = selectedReport;
    const logoUrl = scooterIconUrl;

    const html = `
      <html>
        <head>
          <title>Scooter Weekly Financial Statement (${startDate} to ${endDate})</title>
          <style>
            body { font-family: 'Inter', system-ui, Arial, sans-serif; color: #1f2937; line-height: 1.5; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e11d48; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-area { display: flex; align-items: center; gap: 15px; }
            .logo-img { width: 50px; height: 50px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .title { font-size: 24px; font-weight: bold; margin: 0; color: #111827; }
            .subtitle { font-size: 14px; color: #6b7280; margin: 3px 0 0 0; }
            .period { font-size: 15px; font-weight: 600; color: #e11d48; text-align: right; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; background-color: #f9fafb; }
            .card-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #4b5563; margin-bottom: 12px; border-bottom: 1px dashed #e5e7eb; padding-bottom: 5px; letter-spacing: 0.05em; }
            .metric-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .metric-label { color: #4b5563; }
            .metric-value { font-weight: 600; color: #111827; }
            .total-row { display: flex; justify-content: space-between; margin-top: 15px; border-top: 1px solid #d1d5db; padding-top: 10px; font-size: 15px; font-weight: bold; }
            .success { color: #16a34a; }
            .danger { color: #dc2626; }
            .score-card { text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; }
            .score-num { font-size: 44px; font-weight: 800; color: #e11d48; line-height: 1; }
            .score-lbl { font-size: 13px; color: #4b5563; margin-top: 5px; font-weight: 500; }
            .ai-section { margin-top: 30px; border-top: 2px solid #e5e7eb; padding-top: 20px; }
            .ai-title { font-size: 17px; font-weight: bold; color: #111827; margin-bottom: 15px; }
            .ai-feedback { font-style: italic; color: #4b5563; margin-bottom: 20px; padding: 15px; background-color: #f5f3ff; border-left: 4px solid #8b5cf6; border-radius: 4px; font-size: 14px; }
            .bullet-list { padding-left: 20px; margin: 0; }
            .bullet-list li { margin-bottom: 8px; font-size: 13.5px; color: #374151; }
            .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 60px; border-top: 1px solid #e5e7eb; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-area">
              <img src="${logoUrl}" class="logo-img" onerror="this.src='https://placehold.co/100?text=Scooter'" />
              <div>
                <div class="title">Scooter App</div>
                <div class="subtitle">Weekly Financial Performance Statement</div>
              </div>
            </div>
            <div>
              <div class="period">Period: ${startDate} to ${endDate}</div>
              <div class="subtitle" style="text-align: right;">Generated: ${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">Earnings Summary</div>
              <div class="metric-row">
                <span class="metric-label">Base Order Earnings:</span>
                <span class="metric-value">₹${(metrics.totalEarnings - metrics.tips - metrics.incentivesAndBonuses).toFixed(2)}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Tips Received:</span>
                <span class="metric-value">₹${metrics.tips.toFixed(2)}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Platform Incentives & Bonuses:</span>
                <span class="metric-value">₹${metrics.incentivesAndBonuses.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Gross Earnings:</span>
                <span class="success">₹${metrics.totalEarnings.toFixed(2)}</span>
              </div>
            </div>

            <div class="card">
              <div class="card-title">Expense Summary</div>
              <div class="metric-row">
                <span class="metric-label">Fuel Costs:</span>
                <span class="metric-value">₹${metrics.fuelCosts.toFixed(2)}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Estimated Vehicle Maintenance:</span>
                <span class="metric-value">₹${metrics.vehicleMaintenance.toFixed(2)}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Estimated Platform Commission (18%):</span>
                <span class="metric-value">₹${metrics.platformCommissions.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Total Expenses:</span>
                <span class="danger">₹${metrics.totalExpenses.toFixed(2)}</span>
              </div>
            </div>

            <div class="card">
              <div class="card-title">Efficiency & Volume</div>
              <div class="metric-row">
                <span class="metric-label">Orders Completed:</span>
                <span class="metric-value">${metrics.ordersCompleted} orders</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Working Hours:</span>
                <span class="metric-value">${metrics.workingHours.toFixed(1)} hrs</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Average Earnings/Hour:</span>
                <span class="metric-value">₹${metrics.avgEarningsPerHour.toFixed(2)}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Average Earnings/Order:</span>
                <span class="metric-value">₹${metrics.avgEarningsPerOrder.toFixed(2)}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Distance Traveled:</span>
                <span class="metric-value">${metrics.totalDistanceTraveled.toFixed(1)} km</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Estimated Fuel Efficiency:</span>
                <span class="metric-value">${metrics.fuelEfficiency} km/L</span>
              </div>
            </div>

            <div class="card score-card">
              <div class="score-num">${aiAnalysis.financialHealthScore}</div>
              <div class="score-lbl">Financial Health Index</div>
              <div class="metric-row" style="width: 100%; margin-top: 15px;">
                <span class="metric-label">Best Platform:</span>
                <span class="metric-value">${metrics.bestPerformingPlatform}</span>
              </div>
              <div class="metric-row" style="width: 100%;">
                <span class="metric-label">Weekly Growth Trend:</span>
                <span class="metric-value ${metrics.weeklyGrowthPercentage >= 0 ? 'success' : 'danger'}">${metrics.weeklyGrowthPercentage >= 0 ? '+' : ''}${metrics.weeklyGrowthPercentage}%</span>
              </div>
              <div class="total-row" style="width: 100%;">
                <span>Net Profit Savings:</span>
                <span class="success">₹${metrics.totalSavings.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="ai-section">
            <div class="ai-title">Gemini AI Copilot Performance Analysis</div>
            <div class="ai-feedback">
              "${aiAnalysis.motivationalFeedback}"
            </div>

            <div class="grid" style="grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div>
                <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #4b5563; letter-spacing: 0.05em;">Actionable Insights</h4>
                <ul class="bullet-list">
                  ${aiAnalysis.insights.map((ins: string) => `<li>${ins}</li>`).join('')}
                </ul>
              </div>
              <div>
                <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #4b5563; letter-spacing: 0.05em;">Operational Suggestions</h4>
                <ul class="bullet-list">
                  ${aiAnalysis.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
                </ul>
              </div>
            </div>

            <div style="margin-top: 25px;">
              <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #4b5563; letter-spacing: 0.05em;">Future Earning Strategies</h4>
              <ul class="bullet-list">
                ${aiAnalysis.strategies.map((strat: string) => `<li>${strat}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="footer">
            This statement was generated automatically by Scooter Financial Intelligence engines. Certified rider-compliance report.
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleCSVExport = () => {
    if (!selectedReport) return;
    const { metrics, startDate, endDate } = selectedReport;
    const rows = [
      ["Report Attribute", "Value"],
      ["Report Type", "AI Weekly Financial Statement"],
      ["Period Start Date", startDate],
      ["Period End Date", endDate],
      ["Gross Earnings (INR)", metrics.totalEarnings],
      ["Total Expenses (INR)", metrics.totalExpenses],
      ["Net profit (INR)", metrics.netProfit],
      ["Total Savings (INR)", metrics.totalSavings],
      ["Orders Completed", metrics.ordersCompleted],
      ["Working Hours (Hrs)", metrics.workingHours],
      ["Tips Received (INR)", metrics.tips],
      ["Incentives & Bonuses (INR)", metrics.incentivesAndBonuses],
      ["Fuel Costs (INR)", metrics.fuelCosts],
      ["Vehicle Maintenance (INR)", metrics.vehicleMaintenance],
      ["Platform Commissions (INR)", metrics.platformCommissions],
      ["Avg Daily Earnings (INR)", metrics.avgDailyEarnings],
      ["Avg Earnings Per Hour (INR)", metrics.avgEarningsPerHour],
      ["Avg Earnings Per Order (INR)", metrics.avgEarningsPerOrder],
      ["Best performing platform", metrics.bestPerformingPlatform],
      ["Distance Traveled (km)", metrics.totalDistanceTraveled],
      ["Estimated Fuel Efficiency (km/L)", metrics.fuelEfficiency],
      ["Weekly Growth Percentage", `${metrics.weeklyGrowthPercentage}%`]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Weekly_Financial_Report_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`CSV financial statement downloaded!`);
  };

  const handleExcelExport = () => {
    if (!selectedReport) return;
    const { metrics, startDate, endDate, aiAnalysis } = selectedReport;
    const htmlTable = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Weekly Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
      <body>
        <table border="1">
          <tr><th colspan="2" style="background:#e11d48;color:white;font-size:16px;">Weekly Financial Performance Statement</th></tr>
          <tr><td><b>Start Date</b></td><td>${startDate}</td></tr>
          <tr><td><b>End Date</b></td><td>${endDate}</td></tr>
          <tr><td><b>Gross Earnings (INR)</b></td><td>${metrics.totalEarnings}</td></tr>
          <tr><td><b>Total Expenses (INR)</b></td><td>${metrics.totalExpenses}</td></tr>
          <tr><td><b>Net Profit (INR)</b></td><td>${metrics.netProfit}</td></tr>
          <tr><td><b>Savings (INR)</b></td><td>${metrics.totalSavings}</td></tr>
          <tr><td><b>Orders Completed</b></td><td>${metrics.ordersCompleted}</td></tr>
          <tr><td><b>Hours Logged</b></td><td>${metrics.workingHours}</td></tr>
          <tr><td><b>Tips Received (INR)</b></td><td>${metrics.tips}</td></tr>
          <tr><td><b>Platform Bonuses (INR)</b></td><td>${metrics.incentivesAndBonuses}</td></tr>
          <tr><td><b>Fuel Costs (INR)</b></td><td>${metrics.fuelCosts}</td></tr>
          <tr><td><b>Maintenance (INR)</b></td><td>${metrics.vehicleMaintenance}</td></tr>
          <tr><td><b>Commissions (INR)</b></td><td>${metrics.platformCommissions}</td></tr>
          <tr><td><b>Avg Daily (INR)</b></td><td>${metrics.avgDailyEarnings}</td></tr>
          <tr><td><b>Avg/Hour (INR)</b></td><td>${metrics.avgEarningsPerHour}</td></tr>
          <tr><td><b>Avg/Order (INR)</b></td><td>${metrics.avgEarningsPerOrder}</td></tr>
          <tr><td><b>Best Day</b></td><td>${metrics.bestEarningDay.date} (${metrics.bestEarningDay.earnings} INR)</td></tr>
          <tr><td><b>Best Platform</b></td><td>${metrics.bestPerformingPlatform}</td></tr>
          <tr><td><b>Distance (km)</b></td><td>${metrics.totalDistanceTraveled}</td></tr>
          <tr><td><b>Fuel Efficiency (km/L)</b></td><td>${metrics.fuelEfficiency}</td></tr>
          <tr><td><b>Weekly Growth %</b></td><td>${metrics.weeklyGrowthPercentage}%</td></tr>
          <tr><td><b>Financial Health Score</b></td><td>${aiAnalysis.financialHealthScore}/100</td></tr>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([htmlTable], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Weekly_Financial_Report_${startDate}_${endDate}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Excel spreadsheet statement downloaded!`);
  };

  // --- Dynamic chart aggregations ---
  const getWeeklyLogs = (startStr: string, endStr: string) => {
    return logs
      .filter(l => l.date >= startStr && l.date <= endStr)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getChartData = () => {
    if (!selectedReport) return [];
    return getWeeklyLogs(selectedReport.startDate, selectedReport.endDate).map(l => ({
      name: new Date(l.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      Earnings: l.totalEarnings || 0,
      Expenses: l.totalExpenses || 0,
      NetProfit: l.netProfit || 0
    }));
  };

  const getPlatformShareData = () => {
    if (!selectedReport) return [];
    const breakdown: Record<string, number> = {};
    getWeeklyLogs(selectedReport.startDate, selectedReport.endDate).forEach(l => {
      const platform = l.platform || 'Other';
      const formatted = platform.charAt(0).toUpperCase() + platform.slice(1);
      breakdown[formatted] = (breakdown[formatted] || 0) + (l.totalEarnings || 0);
    });
    return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-text-secondary animate-pulse text-sm">Aggregating gig data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Performance & Financial Statements
          </h1>
          <p className="text-text-secondary mt-1">Generate automated gig calculations, export statements, and analyze AI performance parameters.</p>
        </div>
        <div className="flex bg-surface-secondary p-1 rounded-lg border border-border w-full md:w-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 md:flex-initial px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === 'overview' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <BarChart2 className="w-4 h-4" /> Period Overview
          </button>
          <button
            onClick={() => setActiveTab('weekly-ai')}
            className={`flex-1 md:flex-initial px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === 'weekly-ai' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Sparkles className="w-4 h-4" /> AI Weekly Reports
          </button>
        </div>
      </div>

      {/* --- TAB 1: LEGACY SUMMARY OVERVIEW --- */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Report */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50 bg-surface/10">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-text-primary">
                <Calendar className="w-5 h-5 text-primary" /> Daily Report
              </CardTitle>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">{dailyReport.date}</span>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Gross Earnings</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(dailyReport.earnings)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Expenses (Fuel/Other)</span>
                  <span className="font-semibold text-danger">-{formatCurrency(dailyReport.expenses)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Shifts metrics</span>
                  <span className="font-semibold text-text-primary">{dailyReport.orders} orders | {dailyReport.hours} hrs</span>
                </div>
              </div>
              <div className="pt-3 border-t border-dashed border-border flex justify-between items-center">
                <span className="text-sm font-bold text-text-primary">Daily Net Profit</span>
                <span className={`text-lg font-extrabold ${dailyReport.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(dailyReport.profit)}
                </span>
              </div>
              <div className="pt-2 flex justify-end">
                <Button variant="ghost" size="sm" className="text-xs h-8 text-primary" onClick={() => handleOverviewDownload(`Daily_Report_${dailyReport.date}`, dailyReport)}>
                  Download CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Overview */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50 bg-surface/10">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-text-primary">
                <Calendar className="w-5 h-5 text-primary" /> Weekly Summary
              </CardTitle>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">Last 7 Days</span>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Gross Earnings</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(weeklyOverview.earnings)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Expenses (Fuel/Other)</span>
                  <span className="font-semibold text-danger">-{formatCurrency(weeklyOverview.expenses)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Shifts metrics</span>
                  <span className="font-semibold text-text-primary">{weeklyOverview.orders} orders | {weeklyOverview.hours?.toFixed(1)} hrs</span>
                </div>
              </div>
              <div className="pt-3 border-t border-dashed border-border flex justify-between items-center">
                <span className="text-sm font-bold text-text-primary">Weekly Net Profit</span>
                <span className="text-lg font-extrabold text-success">{formatCurrency(weeklyOverview.profit)}</span>
              </div>
              <div className="pt-2 flex justify-end">
                <Button variant="ghost" size="sm" className="text-xs h-8 text-primary" onClick={() => handleOverviewDownload('Weekly_Summary', weeklyOverview)}>
                  Download CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Overview */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50 bg-surface/10">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-text-primary">
                <Calendar className="w-5 h-5 text-primary" /> Monthly Summary
              </CardTitle>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">Last 30 Days</span>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Gross Earnings</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(monthlyOverview.earnings)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Expenses (Fuel/Other)</span>
                  <span className="font-semibold text-danger">-{formatCurrency(monthlyOverview.expenses)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Shifts metrics</span>
                  <span className="font-semibold text-text-primary">{monthlyOverview.orders} orders | {monthlyOverview.hours?.toFixed(1)} hrs</span>
                </div>
              </div>
              <div className="pt-3 border-t border-dashed border-border flex justify-between items-center">
                <span className="text-sm font-bold text-text-primary">Monthly Net Profit</span>
                <span className="text-lg font-extrabold text-success">{formatCurrency(monthlyOverview.profit)}</span>
              </div>
              <div className="pt-2 flex justify-end">
                <Button variant="ghost" size="sm" className="text-xs h-8 text-primary" onClick={() => handleOverviewDownload('Monthly_Summary', monthlyOverview)}>
                  Download CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Yearly Overview */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50 bg-surface/10">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-text-primary">
                <FileText className="w-5 h-5 text-primary" /> Yearly Summary
              </CardTitle>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">Last 365 Days</span>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Gross Earnings</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(yearlyOverview.earnings)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Expenses (Fuel/Other)</span>
                  <span className="font-semibold text-danger">-{formatCurrency(yearlyOverview.expenses)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Shifts metrics</span>
                  <span className="font-semibold text-text-primary">{yearlyOverview.orders} orders | {yearlyOverview.hours?.toFixed(1)} hrs</span>
                </div>
              </div>
              <div className="pt-3 border-t border-dashed border-border flex justify-between items-center">
                <span className="text-sm font-bold text-text-primary">Yearly Net Profit</span>
                <span className="text-lg font-extrabold text-success">{formatCurrency(yearlyOverview.profit)}</span>
              </div>
              <div className="pt-2 flex justify-end">
                <Button variant="ghost" size="sm" className="text-xs h-8 text-primary" onClick={() => handleOverviewDownload('Yearly_Summary', yearlyOverview)}>
                  Download CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- TAB 2: AI WEEKLY REPORTS --- */}
      {activeTab === 'weekly-ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Reports History sidebar (3 Cols on large) */}
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row justify-between items-center">
                <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" /> Statement History
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-1.5 h-8 w-8 text-text-secondary hover:text-text-primary"
                    title="Report Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button 
                    onClick={handleTriggerWeeklyReport} 
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    disabled={isGenerating}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Compile
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-[450px] overflow-y-auto divide-y divide-border">
                {weeklyReportsHistory.length === 0 ? (
                  <div className="p-6 text-center text-text-secondary flex flex-col items-center gap-2">
                    <Sparkles className="w-8 h-8 text-primary/40 animate-pulse" />
                    <p className="text-sm font-semibold">No Weekly Reports Found</p>
                    <p className="text-xs">Click 'Compile' above to generate your first AI financial report statement.</p>
                  </div>
                ) : (
                  weeklyReportsHistory.map((report) => {
                    const isSelected = selectedReport?._id === report._id;
                    return (
                      <button
                        key={report._id}
                        onClick={() => setSelectedReport(report)}
                        className={`w-full text-left p-3.5 flex justify-between items-center transition-colors hover:bg-surface-secondary/40 ${isSelected ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-text-primary flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-primary/70" />
                            {new Date(report.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(report.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {report.metrics.ordersCompleted} deliveries | {report.metrics.workingHours.toFixed(1)} hrs
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-bold text-success">
                            {formatCurrency(report.metrics.netProfit)}
                          </p>
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            Score: {report.aiAnalysis.financialHealthScore}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20">
              <CardContent className="p-4 space-y-3">
                <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-primary" /> Financial Health Meter
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  The health index (40-100) measures your net-profit margins against fuel spending and operational hours. Keep fuel costs below 15% of gross pay to boost your index!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Detailed Active Report (8 Cols on large) */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!selectedReport ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[450px] flex items-center justify-center border-2 border-dashed border-border rounded-xl bg-surface/20"
                >
                  <div className="text-center max-w-sm space-y-4">
                    <Sparkles className="w-12 h-12 text-primary/30 mx-auto animate-bounce" />
                    <h3 className="text-lg font-bold text-text-primary">Unlock Weekly Financial Insights</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      Scooter aggregates shift telemetry across all your delivery platforms and requests Gemini AI to formulate professional operational suggestions.
                    </p>
                    <Button onClick={handleTriggerWeeklyReport} className="gap-2">
                      <Sparkles className="w-4 h-4" /> Compile Current Week Report
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedReport._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Action Banner */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface p-4 rounded-xl border border-border">
                    <div>
                      <p className="text-xs font-bold text-primary tracking-wide uppercase">Weekly financial statement</p>
                      <h2 className="text-lg font-bold text-text-primary">
                        {new Date(selectedReport.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} to {new Date(selectedReport.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <Button variant="outline" size="sm" onClick={handlePrintReport} className="gap-1.5 flex-1 sm:flex-initial">
                        <Printer className="w-4 h-4" /> Print Statement
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsShareModalOpen(true)} className="gap-1.5 flex-1 sm:flex-initial">
                        <Share2 className="w-4 h-4" /> Share
                      </Button>
                      <div className="relative group flex-1 sm:flex-initial">
                        <Button size="sm" className="gap-1.5 w-full">
                          <Download className="w-4 h-4" /> Export
                        </Button>
                        <div className="absolute right-0 mt-1 w-36 bg-surface border border-border rounded-lg shadow-xl hidden group-hover:block z-20">
                          <button onClick={handleCSVExport} className="w-full text-left px-3 py-2 text-xs hover:bg-surface-secondary text-text-primary font-semibold flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" /> CSV Sheet
                          </button>
                          <button onClick={handleExcelExport} className="w-full text-left px-3 py-2 text-xs hover:bg-surface-secondary text-text-primary font-semibold flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" /> Excel Spreadsheet
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Net Profit Summary Card */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Hero Statement */}
                    <Card className="md:col-span-8 bg-gradient-to-br from-surface to-surface-secondary/40">
                      <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Statement Profit</span>
                            <h3 className="text-4xl font-black text-success mt-1">
                              {formatCurrency(selectedReport.metrics.netProfit)}
                            </h3>
                          </div>
                          <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${selectedReport.metrics.weeklyGrowthPercentage >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                            {selectedReport.metrics.weeklyGrowthPercentage >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {selectedReport.metrics.weeklyGrowthPercentage >= 0 ? '+' : ''}{selectedReport.metrics.weeklyGrowthPercentage}% growth
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t border-dashed border-border pt-4 text-xs">
                          <div>
                            <p className="text-text-secondary">Gross Earned</p>
                            <p className="font-bold text-text-primary text-sm mt-0.5">{formatCurrency(selectedReport.metrics.totalEarnings)}</p>
                          </div>
                          <div>
                            <p className="text-text-secondary">Expenses</p>
                            <p className="font-bold text-danger text-sm mt-0.5">-{formatCurrency(selectedReport.metrics.totalExpenses)}</p>
                          </div>
                          <div>
                            <p className="text-text-secondary">Net Savings</p>
                            <p className="font-bold text-primary text-sm mt-0.5">{formatCurrency(selectedReport.metrics.totalSavings)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Health Score Gauge */}
                    <Card className="md:col-span-4 flex flex-col justify-center items-center p-6 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5">
                      <div className="relative flex items-center justify-center">
                        {/* Static Circle back */}
                        <svg className="w-32 h-32">
                          <circle className="text-border" strokeWidth="8" stroke="currentColor" fill="transparent" r="50" cx="64" cy="64" />
                          <circle 
                            className="text-primary transition-all duration-1000" 
                            strokeWidth="8" 
                            strokeDasharray={`${2 * Math.PI * 50}`}
                            strokeDashoffset={`${2 * Math.PI * 50 * (1 - selectedReport.aiAnalysis.financialHealthScore / 100)}`}
                            strokeLinecap="round" 
                            stroke="currentColor" 
                            fill="transparent" 
                            r="50" 
                            cx="64" 
                            cy="64" 
                          />
                        </svg>
                        <div className="absolute text-center">
                          <span className="text-3xl font-black text-text-primary">{selectedReport.aiAnalysis.financialHealthScore}</span>
                          <span className="text-xs text-text-secondary block font-semibold">Score</span>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-primary mt-3 uppercase tracking-wider">
                        {selectedReport.aiAnalysis.financialHealthScore >= 80 ? 'Excellent Status' : selectedReport.aiAnalysis.financialHealthScore >= 65 ? 'Satisfactory Status' : 'Needs Optimization'}
                      </p>
                    </Card>
                  </div>

                  {/* Financial Grid (Detailed breakdown) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Income items */}
                    <Card>
                      <CardHeader className="pb-2 border-b border-border/40">
                        <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-success" /> Revenue Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-3 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Base Order Earnings</span>
                          <span className="font-bold text-text-primary">{formatCurrency(selectedReport.metrics.totalEarnings - selectedReport.metrics.tips - selectedReport.metrics.incentivesAndBonuses)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Tips Received</span>
                          <span className="font-bold text-success">+{formatCurrency(selectedReport.metrics.tips)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Milestone Bonuses</span>
                          <span className="font-bold text-success">+{formatCurrency(selectedReport.metrics.incentivesAndBonuses)}</span>
                        </div>
                        <div className="pt-2 border-t border-dashed border-border flex justify-between text-sm font-black">
                          <span className="text-text-primary">Gross Earnings</span>
                          <span className="text-success">{formatCurrency(selectedReport.metrics.totalEarnings)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Expense items */}
                    <Card>
                      <CardHeader className="pb-2 border-b border-border/40">
                        <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-danger" /> Expense & Liability Deductions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-3 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Fuel Expenditures</span>
                          <span className="font-bold text-danger">-{formatCurrency(selectedReport.metrics.fuelCosts)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Est. Wear & Maintenance</span>
                          <span className="font-bold text-danger">-{formatCurrency(selectedReport.metrics.vehicleMaintenance)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Est. Commissions (18%)</span>
                          <span className="font-bold text-text-secondary">-{formatCurrency(selectedReport.metrics.platformCommissions)}</span>
                        </div>
                        <div className="pt-2 border-t border-dashed border-border flex justify-between text-sm font-black">
                          <span className="text-text-primary">Total Expenses</span>
                          <span className="text-danger">-{formatCurrency(selectedReport.metrics.totalExpenses)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Operational performance parameters */}
                    <Card>
                      <CardHeader className="pb-2 border-b border-border/40">
                        <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-primary" /> Operational Volume metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-3 space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-text-secondary text-xs">Deliveries Completed</p>
                            <p className="text-lg font-black text-text-primary mt-0.5">{selectedReport.metrics.ordersCompleted} orders</p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-xs">Working Hours</p>
                            <p className="text-lg font-black text-text-primary mt-0.5">{selectedReport.metrics.workingHours.toFixed(1)} hrs</p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-xs">Earnings / Hour</p>
                            <p className="text-lg font-black text-primary mt-0.5">{formatCurrency(selectedReport.metrics.avgEarningsPerHour)}/hr</p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-xs">Earnings / Order</p>
                            <p className="text-lg font-black text-primary mt-0.5">{formatCurrency(selectedReport.metrics.avgEarningsPerOrder)}/ord</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Fuel & Platform performance */}
                    <Card>
                      <CardHeader className="pb-2 border-b border-border/40">
                        <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-primary" /> Efficiency & Platform Records
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-3 space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-text-secondary text-xs">Distance Covered</p>
                            <p className="text-lg font-black text-text-primary mt-0.5">{selectedReport.metrics.totalDistanceTraveled.toFixed(1)} km</p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-xs">Fuel Efficiency</p>
                            <p className="text-lg font-black text-success mt-0.5">{selectedReport.metrics.fuelEfficiency} km/L</p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-xs">Best Earning Day</p>
                            <p className="text-sm font-black text-text-primary mt-0.5">
                              {selectedReport.metrics.bestEarningDay.date ? new Date(selectedReport.metrics.bestEarningDay.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }) : 'N/A'} 
                              <span className="text-success text-xs font-bold ml-1">({formatCurrency(selectedReport.metrics.bestEarningDay.earnings)})</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-xs">Top Performer App</p>
                            <p className="text-lg font-black text-primary mt-0.5">{selectedReport.metrics.bestPerformingPlatform}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Visual Chart Sections (Recharts) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Daily area chart (8 cols) */}
                    <Card className="md:col-span-8">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                          <BarChart2 className="w-4 h-4 text-primary" /> Daily Earnings vs Expenses Trend
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-2 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Area type="monotone" dataKey="Earnings" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorEarnings)" />
                            <Area type="monotone" dataKey="Expenses" stroke="#dc2626" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Platform Share donut chart (4 cols) */}
                    <Card className="md:col-span-4">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                          <PieIcon className="w-4 h-4 text-primary" /> Earnings Share
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-2 h-64 flex flex-col items-center justify-center">
                        {getPlatformShareData().length === 0 ? (
                          <p className="text-xs text-text-secondary">No platform logs in this window</p>
                        ) : (
                          <>
                            <div className="w-full h-40">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={getPlatformShareData()}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={65}
                                    paddingAngle={3}
                                    dataKey="value"
                                  >
                                    {getPlatformShareData().map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value) => `₹${value}`} contentStyle={{ fontSize: 11 }} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center mt-2 max-h-16 overflow-y-auto">
                              {getPlatformShareData().map((item, index) => (
                                <span key={item.name} className="text-[10px] font-bold text-text-secondary flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                  {item.name}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gemini AI Hub: Insights, Suggestion, Strategies */}
                  <Card className="relative overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 via-surface to-purple-500/5">
                    {/* Glowing Accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                    
                    <CardHeader className="flex flex-row justify-between items-center pb-3 border-b border-border/60">
                      <CardTitle className="text-base font-extrabold text-text-primary flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary animate-pulse" /> Gemini AI Copilot Analytics
                      </CardTitle>
                      <span className="text-[10px] font-black tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Active Engine
                      </span>
                    </CardHeader>
                    <CardContent className="pt-5 space-y-6">
                      {/* Feedback banner */}
                      <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
                        <p className="text-sm font-semibold italic text-text-primary text-center">
                          "{selectedReport.aiAnalysis.motivationalFeedback}"
                        </p>
                      </div>

                      {/* Smart Alerts */}
                      {selectedReport.aiAnalysis.alerts && selectedReport.aiAnalysis.alerts.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-danger flex items-center gap-1 uppercase tracking-wider">
                            <AlertTriangle className="w-4 h-4 text-danger" /> Financial Alerts
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedReport.aiAnalysis.alerts.map((alert: string, idx: number) => (
                              <div key={idx} className="bg-danger/5 border border-danger/20 p-3 rounded-lg flex gap-2.5 items-start text-xs text-text-primary">
                                <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                                <p className="leading-relaxed">{alert}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Insights & Recommendations */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Insights */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-primary tracking-wider uppercase flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-primary" /> Performance Insights
                          </h4>
                          <ul className="space-y-2">
                            {selectedReport.aiAnalysis.insights.map((insight: string, idx: number) => (
                              <li key={idx} className="flex gap-2 items-start text-xs text-text-secondary leading-relaxed">
                                <span className="text-primary font-bold">●</span>
                                <p>{insight}</p>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Recommendations */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-primary tracking-wider uppercase flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-primary" /> Savings & Cost Optimizations
                          </h4>
                          <ul className="space-y-2">
                            {selectedReport.aiAnalysis.recommendations.map((rec: string, idx: number) => (
                              <li key={idx} className="flex gap-2.5 items-start text-xs text-text-secondary leading-relaxed">
                                <span className="bg-success/10 text-success p-0.5 rounded-full shrink-0"><Check className="w-3 h-3 text-success" /></span>
                                <p>{rec}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Future Earning Strategies */}
                      <div className="border-t border-border/60 pt-5 space-y-4">
                        <h4 className="text-xs font-bold text-primary tracking-wider uppercase flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-primary" /> Future Earning Strategies
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Strats */}
                          <div className="md:col-span-2 space-y-3">
                            {selectedReport.aiAnalysis.strategies.map((strat: string, idx: number) => (
                              <div key={idx} className="bg-surface/50 border border-border/80 p-3.5 rounded-xl flex gap-2.5 items-start text-xs text-text-secondary leading-relaxed">
                                <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <p>{strat}</p>
                              </div>
                            ))}
                          </div>

                          {/* Predictions & Profitable hours */}
                          <div className="bg-surface border border-border rounded-xl p-4 space-y-4 shadow-sm flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-black text-text-secondary tracking-widest uppercase block">Next Week Forecast</span>
                              <span className="text-xl font-extrabold text-primary mt-1 block">
                                {formatCurrency(selectedReport.aiAnalysis.predictedEarnings)}
                              </span>
                            </div>
                            <div className="border-t border-border/60 pt-3">
                              <span className="text-[10px] font-black text-text-secondary tracking-widest uppercase block mb-1.5">Profitable shifts</span>
                              <div className="space-y-1">
                                {selectedReport.aiAnalysis.profitableHours.map((h: string, idx: number) => (
                                  <span key={idx} className="block text-[11px] font-bold text-text-primary bg-surface-secondary px-2 py-1 rounded">
                                    {h}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* --- MODAL 1: PREFERENCES DIALOG --- */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl max-w-md w-full border border-border shadow-2xl overflow-hidden"
            >
              <div className="bg-primary/5 p-5 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary animate-spin-slow" />
                  <h3 className="font-extrabold text-text-primary text-base">Automatic Report Preferences</h3>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="p-1 hover:bg-surface-secondary rounded-lg text-text-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-text-primary">Enable Automated Reports</label>
                    <p className="text-xs text-text-secondary">Generate and save a report at the scheduled time each week.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.enabled}
                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                    className="w-10 h-5 bg-border rounded-full appearance-none checked:bg-primary relative before:absolute before:h-4 before:w-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-5 before:transition-transform cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">Preferred Trigger Day</label>
                    <select
                      value={settings.day}
                      onChange={(e) => setSettings({ ...settings, day: e.target.value })}
                      className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm font-semibold text-text-primary focus:outline-hidden focus:border-primary"
                    >
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">Trigger Time (24h format)</label>
                    <input
                      type="time"
                      value={settings.time}
                      onChange={(e) => setSettings({ ...settings, time: e.target.value })}
                      className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm font-semibold text-text-primary focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-2.5">
                  <Button variant="outline" size="sm" type="button" onClick={() => setIsSettingsOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" type="submit" disabled={isSavingSettings}>
                    {isSavingSettings ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: SHARING DIALOG --- */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl max-w-md w-full border border-border shadow-2xl overflow-hidden"
            >
              <div className="bg-primary/5 p-5 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  <h3 className="font-extrabold text-text-primary text-base">Share Financial Statement</h3>
                </div>
                <button onClick={() => setIsShareModalOpen(false)} className="p-1 hover:bg-surface-secondary rounded-lg text-text-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-text-secondary block mb-1.5">Select Communication Channel</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => { setShareChannel('whatsapp'); setShareRecipient(''); }}
                      className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${shareChannel === 'whatsapp' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:bg-surface-secondary'}`}
                    >
                      <MessageSquare className="w-5 h-5" /> WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShareChannel('email'); setShareRecipient(''); }}
                      className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${shareChannel === 'email' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:bg-surface-secondary'}`}
                    >
                      <Mail className="w-5 h-5" /> Email
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShareChannel('telegram'); setShareRecipient(''); }}
                      className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${shareChannel === 'telegram' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:bg-surface-secondary'}`}
                    >
                      <Send className="w-5 h-5" /> Telegram
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-secondary block mb-1">
                    {shareChannel === 'email' ? 'Recipient Email Address' : 'Recipient Phone Number / Username'}
                  </label>
                  <input
                    type={shareChannel === 'email' ? 'email' : 'text'}
                    placeholder={shareChannel === 'email' ? 'racer@scooter-delivery.in' : '+91 98765 43210'}
                    value={shareRecipient}
                    onChange={(e) => setShareRecipient(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm font-semibold text-text-primary focus:outline-hidden focus:border-primary"
                    required
                  />
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-2.5">
                  <Button variant="outline" size="sm" onClick={() => setIsShareModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleShareReport} disabled={isSharing || !shareRecipient}>
                    {isSharing ? 'Sending...' : 'Share Statement'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 3: ON-DEMAND GENERATION LOADER DIALOG --- */}
      <AnimatePresence>
        {isGenerating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-surface rounded-2xl max-w-sm w-full p-8 border border-border text-center space-y-6 shadow-2xl"
            >
              <div className="relative w-20 h-20 mx-auto">
                {/* Spinning glow ring */}
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-text-primary">Gemini Analytics Engine</h3>
                <p className="text-xs text-text-secondary max-w-[280px] mx-auto leading-relaxed">
                  Compiling weekly delivery summaries, calculating fuel statistics, and predicting optimal shift timings.
                </p>
              </div>

              {/* Incremental compiler steps */}
              <div className="space-y-2 text-left bg-surface-secondary/60 border border-border p-3.5 rounded-xl text-[11px] font-bold text-text-secondary">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${genStep >= 0 ? 'bg-success' : 'bg-border'}`} />
                  <span className={genStep === 0 ? 'text-primary' : genStep > 0 ? 'text-text-primary' : ''}>Aggregating Multi-Platform Incomes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${genStep >= 1 ? 'bg-success' : 'bg-border'}`} />
                  <span className={genStep === 1 ? 'text-primary' : genStep > 1 ? 'text-text-primary' : ''}>Deriving Fuel Efficiency Index</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${genStep >= 2 ? 'bg-success' : 'bg-border'}`} />
                  <span className={genStep === 2 ? 'text-primary' : genStep > 2 ? 'text-text-primary' : ''}>Consulting Gemini AI CoPilot</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${genStep >= 3 ? 'bg-success' : 'bg-border'}`} />
                  <span className={genStep === 3 ? 'text-primary' : genStep > 3 ? 'text-text-primary' : ''}>Structuring Predictive Earning Margins</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
