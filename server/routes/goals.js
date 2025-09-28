import express from 'express';
import { 
  createGoal, 
  getGoals, 
  getGoal, 
  makeContribution, 
  requestWithdrawal 
} from '../controllers/goalController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createGoal);
router.get('/', getGoals);
router.get('/:id', getGoal);
router.post('/:id/contribution', makeContribution);
router.post('/:id/withdrawal', requestWithdrawal);

export default router;