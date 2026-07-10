import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getEmergencyFunds,
  getEmergencyFundById,
  createEmergencyFund,
  updateEmergencyFund,
  deleteEmergencyFund,
  getTransactions,
  getAllTransactions,
  createTransaction,
  getAiAdvice,
  simulateFund
} from '../controllers/emergencyFundController.js';

const router = express.Router();

// General emergency fund operations
router.get('/', protect, getEmergencyFunds);
router.post('/', protect, createEmergencyFund);

// AI advice route (placed before parameterized routes to avoid conflict)
router.get('/advice', protect, getAiAdvice);
router.get('/transactions/all', protect, getAllTransactions);

// Individual emergency fund operations
router.get('/:id', protect, getEmergencyFundById);
router.put('/:id', protect, updateEmergencyFund);
router.delete('/:id', protect, deleteEmergencyFund);

// Transaction history and contributions/withdrawals
router.get('/:id/transactions', protect, getTransactions);
router.post('/:id/transactions', protect, createTransaction);

// Simulation What-If
router.post('/:id/simulate', protect, simulateFund);

export default router;
