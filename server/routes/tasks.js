import express from 'express';
import { 
  getAvailableTasks, 
  startTask, 
  submitTask, 
  getUserTasks 
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/available', getAvailableTasks);
router.get('/user-tasks', getUserTasks);
router.post('/:taskId/start', startTask);
router.post('/:taskId/submit', submitTask);

export default router;