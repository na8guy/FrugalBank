// services/drawService.js
import cron from 'node-cron';
import Draw from '../models/Draw.js';
import UserTask from '../models/UserTask.js';

class DrawService {
  constructor() {
    this.initScheduledTasks();
  }

  initScheduledTasks() {
    // Weekly draw every Friday at 8 PM
    cron.schedule('0 20 * * 5', this.executeWeeklyDraw.bind(this));
    
    // Monthly draw on last Friday of month at 8 PM
    cron.schedule('0 20 28-31 * 5', this.executeMonthlyDraw.bind(this));
  }

  async executeWeeklyDraw() {
    try {
      const draw = await Draw.findOne({ 
        type: 'weekly', 
        status: 'upcoming' 
      });
      
      if (!draw) return;

      const eligibleUsers = await this.getEligibleUsers(draw);
      const winners = this.selectWinners(eligibleUsers, draw.prizeStructure);
      
      await this.distributePrizes(winners, draw);
      await this.updateDrawResults(draw, winners);
      
      console.log(`Weekly draw completed: ${winners.length} winners selected`);
    } catch (error) {
      console.error('Error executing weekly draw:', error);
    }
  }

  async getEligibleUsers(draw) {
    // Get users who completed required tasks
    return await UserTask.aggregate([
      {
        $match: {
          completedAt: { 
            $gte: draw.entryPeriod.start,
            $lte: draw.entryPeriod.end 
          },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$userId',
          totalEntries: { $sum: '$entryValue' },
          tasksCompleted: { $sum: 1 }
        }
      },
      {
        $match: {
          tasksCompleted: { $gte: draw.minimumTasks }
        }
      }
    ]);
  }
}