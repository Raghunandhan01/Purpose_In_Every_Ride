import express from 'express';
import { 
  getPlatforms, 
  getPlatformById, 
  createPlatform, 
  updatePlatform, 
  deletePlatform 
} from '../controllers/platformController.js';
import {
  getConnectionStatus,
  connectPlatform,
  disconnectPlatform,
  syncPlatformData,
  bulkImportWorklogs,
  parseEmailStatement
} from '../controllers/integrationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Connections, import, and email parser routes (must be before :id routes)
router.get('/connections', protect, getConnectionStatus);
router.post('/bulk-import', protect, bulkImportWorklogs);
router.post('/parse-email', protect, parseEmailStatement);

router.route('/')
  .get(protect, getPlatforms)
  .post(protect, createPlatform);

router.route('/:id')
  .get(protect, getPlatformById)
  .put(protect, updatePlatform)
  .delete(protect, deletePlatform);

// Connection state routes
router.post('/:platformId/connect', protect, connectPlatform);
router.post('/:platformId/disconnect', protect, disconnectPlatform);
router.post('/:platformId/sync', protect, syncPlatformData);

export default router;
