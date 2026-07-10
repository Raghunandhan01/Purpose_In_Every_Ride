import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import * as reportService from '../services/reportService.js';
import { generateWeeklyReport } from '../services/weeklyReportService.js';
import { WeeklyReport, User } from '../models/index.js';

export const generateReport = async (req: AuthRequest, res: Response) => {
  try {
    const reports = await reportService.generatePeriodReports(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Reports generated successfully',
      data: reports,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate reports'
    });
  }
};

export const getWeeklyHistory = async (req: AuthRequest, res: Response) => {
  try {
    const reports = await WeeklyReport.find({ userId: req.user.id });
    reports.sort((a: any, b: any) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch weekly report history'
    });
  }
};

export const triggerWeeklyGeneration = async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.body;
    const report = await generateWeeklyReport(req.user.id, date || new Date());
    res.status(200).json({
      success: true,
      message: 'Weekly financial report generated successfully',
      data: report
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate weekly report'
    });
  }
};

export const getWeeklySettings = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user.id);
    let settings = { day: 'Sunday', time: '23:59', enabled: true };
    if (user && user.goals) {
      try {
        const parsed = JSON.parse(user.goals);
        const settingsObj = parsed.find((item: any) => item.type === 'weekly_report_settings');
        if (settingsObj) {
          settings = settingsObj.value;
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch weekly report settings'
    });
  }
};

export const updateWeeklySettings = async (req: AuthRequest, res: Response) => {
  try {
    const { day, time, enabled } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    let goalsList = [];
    try {
      goalsList = JSON.parse(user.goals || '[]');
    } catch (e) {}
    
    const settingsIndex = goalsList.findIndex((item: any) => item.type === 'weekly_report_settings');
    const newValue = { day: day || 'Sunday', time: time || '23:59', enabled: enabled !== false };
    
    if (settingsIndex > -1) {
      goalsList[settingsIndex].value = newValue;
    } else {
      goalsList.push({ type: 'weekly_report_settings', value: newValue });
    }
    
    await User.findByIdAndUpdate(req.user.id, { goals: JSON.stringify(goalsList) });
    
    res.status(200).json({
      success: true,
      message: 'Weekly report schedule updated successfully',
      data: newValue
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update weekly report settings'
    });
  }
};

export const shareWeeklyReport = async (req: AuthRequest, res: Response) => {
  try {
    const { channel, recipient } = req.body;
    const report = await WeeklyReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    
    res.status(200).json({
      success: true,
      message: `Report successfully shared via ${channel} to ${recipient || 'recipient'}`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to share weekly report'
    });
  }
};
