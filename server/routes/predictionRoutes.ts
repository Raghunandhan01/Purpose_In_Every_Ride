import express from 'express';
import { getPredictionsAndInsights } from '../controllers/predictionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getPredictionsAndInsights);

export default router;
