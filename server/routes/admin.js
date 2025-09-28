import express from 'express';
import { 
  createAdTask, 
  createDraw, 
  getDashboardStats 
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Note: In production, add admin authorization middleware
router.post('/tasks', createAdTask);
router.post('/draws', createDraw);
router.get('/stats', getDashboardStats);

export default router;