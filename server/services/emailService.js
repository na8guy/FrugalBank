import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Welcome to GoalGuard!',
      html: `
        <h1>Welcome to GoalGuard, ${user.personalDetails.firstName}!</h1>
        <p>We're excited to help you achieve your financial goals while having the chance to win amazing prizes.</p>
        <p>Get started by:</p>
        <ul>
          <li>Creating your first savings goal</li>
          <li>Completing tasks to earn prize entries</li>
          <li>Joining our weekly and monthly draws</li>
        </ul>
        <p>Happy saving!</p>
        <p>The GoalGuard Team</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent to:', user.email);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }

  async sendPrizeWinEmail(user, draw, prizeAmount) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Congratulations! You Won a Prize on GoalGuard!',
      html: `
        <h1>Congratulations, ${user.personalDetails.firstName}!</h1>
        <p>You have won <strong>£${prizeAmount}</strong> in the ${draw.name}!</p>
        <p>Your prize has been credited to your account.</p>
        <p>Keep saving and completing tasks for more chances to win!</p>
        <p>The GoalGuard Team</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Prize win email sent to:', user.email);
    } catch (error) {
      console.error('Error sending prize win email:', error);
    }
  }
}

export default new EmailService();