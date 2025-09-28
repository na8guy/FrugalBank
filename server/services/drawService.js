import cron from 'node-cron';
import Draw from '../models/Draw.js';
import UserTask from '../models/UserTask.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

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
        status: 'upcoming',
        drawDate: { $lte: new Date() }
      });
      
      if (!draw) {
        console.log('No weekly draw found to execute');
        return;
      }

      const eligibleUsers = await this.getEligibleUsers(draw);
      
      if (eligibleUsers.length === 0) {
        console.log('No eligible users for weekly draw');
        draw.status = 'completed';
        await draw.save();
        return;
      }

      const winners = this.selectWinners(eligibleUsers, {
        grandPrize: { count: 1, percentage: 0.5 },
        runnerUp: { count: 10, amount: 50 },
        consolation: { count: 100, amount: 5 }
      });

      await this.distributePrizes(winners, draw);
      await this.updateDrawResults(draw, winners);
      
      console.log(`Weekly draw completed: ${winners.length} winners selected`);
    } catch (error) {
      console.error('Error executing weekly draw:', error);
    }
  }

  async executeMonthlyDraw() {
    try {
      const draw = await Draw.findOne({ 
        type: 'monthly', 
        status: 'upcoming',
        drawDate: { $lte: new Date() }
      });
      
      if (!draw) {
        console.log('No monthly draw found to execute');
        return;
      }

      const eligibleUsers = await this.getEligibleUsers(draw);
      
      if (eligibleUsers.length === 0) {
        console.log('No eligible users for monthly draw');
        draw.status = 'completed';
        await draw.save();
        return;
      }

      const winners = this.selectWinners(eligibleUsers, {
        grandPrize: { count: 1, percentage: 0.6 },
        runnerUp: { count: 5, amount: 200 },
        specialCategory: { count: 3, amount: 1000 }
      });

      await this.distributePrizes(winners, draw);
      await this.updateDrawResults(draw, winners);
      
      console.log(`Monthly draw completed: ${winners.length} winners selected`);
    } catch (error) {
      console.error('Error executing monthly draw:', error);
    }
  }

  async getEligibleUsers(draw) {
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

  selectWinners(eligibleUsers, prizeStructure) {
    const winners = [];
    const shuffledUsers = [...eligibleUsers].sort(() => Math.random() - 0.5);

    // Select grand prize winner
    if (prizeStructure.grandPrize && shuffledUsers.length > 0) {
      const grandPrizeWinner = shuffledUsers[0];
      winners.push({
        userId: grandPrizeWinner._id,
        prizeAmount: draw.prizePool * prizeStructure.grandPrize.percentage,
        position: 1
      });
    }

    // Select runner-up winners
    if (prizeStructure.runnerUp) {
      const startIndex = winners.length;
      const endIndex = startIndex + prizeStructure.runnerUp.count;
      const runnerUps = shuffledUsers.slice(startIndex, endIndex);
      
      runnerUps.forEach((user, index) => {
        winners.push({
          userId: user._id,
          prizeAmount: prizeStructure.runnerUp.amount,
          position: index + 2
        });
      });
    }

    return winners;
  }

  async distributePrizes(winners, draw) {
    for (const winner of winners) {
      try {
        const user = await User.findById(winner.userId);
        
        // Create prize transaction
        await Transaction.create({
          userId: winner.userId,
          type: 'prize',
          amount: winner.prizeAmount,
          status: 'completed',
          description: `Prize win from ${draw.name}`
        });

        // Update user stats or account balance
        user.stats.totalSaved += winner.prizeAmount;
        await user.save();

      } catch (error) {
        console.error(`Error distributing prize to user ${winner.userId}:`, error);
      }
    }
  }

  async updateDrawResults(draw, winners) {
    draw.winners = winners;
    draw.status = 'completed';
    draw.updatedAt = new Date();
    await draw.save();
  }
}

export default new DrawService();