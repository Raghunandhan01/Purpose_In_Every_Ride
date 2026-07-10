import express from 'express';
import { 
  generateReport, 
  getWeeklyHistory, 
  triggerWeeklyGeneration, 
  getWeeklySettings, 
  updateWeeklySettings, 
  shareWeeklyReport 
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, generateReport);
router.get('/weekly/history', protect, getWeeklyHistory);
router.post('/weekly/generate', protect, triggerWeeklyGeneration);
router.get('/weekly/settings', protect, getWeeklySettings);
router.post('/weekly/settings', protect, updateWeeklySettings);
router.post('/weekly/:id/share', protect, shareWeeklyReport);

export default router;
