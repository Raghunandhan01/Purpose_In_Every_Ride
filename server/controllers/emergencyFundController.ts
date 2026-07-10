import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import * as emergencyFundService from '../services/emergencyFundService.js';

export const getEmergencyFunds = async (req: AuthRequest, res: Response) => {
  try {
    const result = await emergencyFundService.getEmergencyFunds(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Emergency funds retrieved successfully',
      data: result.funds,
      summary: result.summary,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve emergency funds'
    });
  }
};

export const getEmergencyFundById = async (req: AuthRequest, res: Response) => {
  try {
    const fund = await emergencyFundService.getEmergencyFundById(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: fund,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || 'Emergency fund not found'
    });
  }
};

export const createEmergencyFund = async (req: AuthRequest, res: Response) => {
  try {
    const fund = await emergencyFundService.createEmergencyFund(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Emergency fund created successfully',
      data: fund,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create emergency fund'
    });
  }
};

export const updateEmergencyFund = async (req: AuthRequest, res: Response) => {
  try {
    const fund = await emergencyFundService.updateEmergencyFund(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Emergency fund updated successfully',
      data: fund,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update emergency fund'
    });
  }
};

export const deleteEmergencyFund = async (req: AuthRequest, res: Response) => {
  try {
    await emergencyFundService.deleteEmergencyFund(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Emergency fund deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete emergency fund'
    });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await emergencyFundService.getTransactionsForFund(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Fund transactions retrieved successfully',
      data: transactions,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve transactions'
    });
  }
};

export const getAllTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await emergencyFundService.getAllTransactions(req.user.id);
    res.status(200).json({
      success: true,
      message: 'All transactions retrieved successfully',
      data: transactions,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve transactions'
    });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const transaction = await emergencyFundService.createTransaction(req.user.id, req.params.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      data: transaction,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to record transaction'
    });
  }
};

export const getAiAdvice = async (req: AuthRequest, res: Response) => {
  try {
    const advice = await emergencyFundService.getEmergencyFundAdvice(req.user.id);
    res.status(200).json({
      success: true,
      data: advice,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate financial recommendations'
    });
  }
};

export const simulateFund = async (req: AuthRequest, res: Response) => {
  try {
    const simulationResult = await emergencyFundService.simulateWhatIf(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: simulationResult,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to execute What-If simulation'
    });
  }
};
