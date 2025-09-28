import express from 'express';
import { 
  getCurrentDraws, 
  getDrawEntries, 
  getPastWinners 
} from '../controllers/drawController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/current', getCurrentDraws);
router.get('/:drawId/entries', getDrawEntries);
router.get('/winners', getPastWinners);

export default router;