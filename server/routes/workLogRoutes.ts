import express from 'express';
import { 
  getWorkLogs, 
  getWorkLogById, 
  createWorkLog, 
  updateWorkLog, 
  deleteWorkLog 
} from '../controllers/workLogController.js';
import { protect } from '../middleware/authMiddleware.js';
import { workLogValidator } from '../validators/workLogValidator.js';

const router = express.Router();

router.route('/')
  .get(protect, getWorkLogs)
  .post(protect, workLogValidator, createWorkLog);

router.route('/:id')
  .get(protect, getWorkLogById)
  .put(protect, workLogValidator, updateWorkLog)
  .delete(protect, deleteWorkLog);

export default router;
