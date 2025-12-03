import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    // For now, just log the email
    this.logger.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    this.logger.debug(`[EMAIL] Body: ${text || html.substring(0, 100)}...`);
    
    // Simulate email sending
    // In production, use:
    // - SendGrid: @sendgrid/mail
    // - AWS SES: @aws-sdk/client-ses
    // - Nodemailer: nodemailer
    
    return true;
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${this.config.get('FRONTEND_URL', 'http://localhost:5173')}/auth/reset-password?token=${resetToken}`;
    const subject = 'WBCode - Password Reset Request';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Password Reset Request</h1>
          <p>You requested to reset your password for your WBCode account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <div class="footer">
            <p>WBCode Learning Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const text = `Password Reset Request\n\nClick this link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.`;

    return this.sendEmail(to, subject, html, text);
  }

  async sendWelcomeEmail(to: string, firstName: string): Promise<boolean> {
    const subject = 'Welcome to WBCode!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to WBCode, ${firstName}!</h1>
          <p>Your account has been successfully created.</p>
          <p>Start your learning journey by exploring lessons, solving exercises, and earning XP!</p>
          <a href="${this.config.get('FRONTEND_URL', 'http://localhost:5173')}" class="button">Get Started</a>
          <p>Happy coding!</p>
        </div>
      </body>
      </html>
    `;
    const text = `Welcome to WBCode, ${firstName}!\n\nYour account has been successfully created. Start learning at ${this.config.get('FRONTEND_URL', 'http://localhost:5173')}`;

    return this.sendEmail(to, subject, html, text);
  }

  async sendChallengeNotification(to: string, challengerName: string, challengeTitle: string): Promise<boolean> {
    const subject = `New Challenge from ${challengerName}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>You've been challenged!</h1>
          <p><strong>${challengerName}</strong> has challenged you to solve: <strong>${challengeTitle}</strong></p>
          <a href="${this.config.get('FRONTEND_URL', 'http://localhost:5173')}/challenges" class="button">View Challenge</a>
          <p>Accept the challenge and show what you can do!</p>
        </div>
      </body>
      </html>
    `;
    const text = `You've been challenged!\n\n${challengerName} has challenged you to solve: ${challengeTitle}\n\nView it at ${this.config.get('FRONTEND_URL', 'http://localhost:5173')}/challenges`;

    return this.sendEmail(to, subject, html, text);
  }
}

