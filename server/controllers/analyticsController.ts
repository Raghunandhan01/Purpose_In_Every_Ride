import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import * as analyticsService from '../services/analyticsService.js';

export const getDashboardAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await analyticsService.getDashboardStats(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Dashboard analytics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve dashboard analytics'
    });
  }
};

export const getFullAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await analyticsService.getAdvancedAnalytics(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Full advanced analytics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve advanced analytics'
    });
  }
};
