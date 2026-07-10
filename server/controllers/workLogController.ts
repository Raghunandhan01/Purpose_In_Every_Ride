import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import * as workLogService from '../services/workLogService.js';

export const getWorkLogs = async (req: AuthRequest, res: Response) => {
  try {
    const filters = {
      platform: req.query.platform,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      month: req.query.month,
      year: req.query.year,
      search: req.query.search,
      sortField: req.query.sortField,
      sortDirection: req.query.sortDirection,
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await workLogService.getWorkLogs(req.user.id, filters);

    res.status(200).json({
      success: true,
      message: 'Work logs retrieved successfully',
      data: result.logs,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve work logs'
    });
  }
};

export const getWorkLogById = async (req: AuthRequest, res: Response) => {
  try {
    const log = await workLogService.getWorkLogById(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: log,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || 'Work log not found'
    });
  }
};

export const createWorkLog = async (req: AuthRequest, res: Response) => {
  try {
    const log = await workLogService.createWorkLog(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Work log created successfully',
      data: log,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create work log'
    });
  }
};

export const updateWorkLog = async (req: AuthRequest, res: Response) => {
  try {
    const log = await workLogService.updateWorkLog(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Work log updated successfully',
      data: log,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update work log'
    });
  }
};

export const deleteWorkLog = async (req: AuthRequest, res: Response) => {
  try {
    await workLogService.deleteWorkLog(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Work log removed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete work log'
    });
  }
};
