import express from 'express';
import { getDashboardAnalytics, getFullAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboardAnalytics);
router.get('/full', protect, getFullAnalytics);

export default router;
