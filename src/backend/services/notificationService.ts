import { Courier } from "@trycourier/courier";
import TelegramBot from "node-telegram-bot-api";
import nodemailer from "nodemailer";
import { CONFIG, logger } from "../config";

export class NotificationService {
  private static courierClient = CONFIG.COURIER_AUTH_TOKEN 
    ? new Courier({ apiKey: CONFIG.COURIER_AUTH_TOKEN }) 
    : null;

  private static telegramBot = CONFIG.TELEGRAM_BOT_TOKEN 
    ? new TelegramBot(CONFIG.TELEGRAM_BOT_TOKEN) 
    : null;

  private static mailer = CONFIG.SMTP.USER && CONFIG.SMTP.PASS 
    ? nodemailer.createTransport({
        host: CONFIG.SMTP.HOST,
        port: CONFIG.SMTP.PORT,
        secure: CONFIG.SMTP.PORT === 465,
        auth: {
          user: CONFIG.SMTP.USER,
          pass: CONFIG.SMTP.PASS,
        },
      }) 
    : null;

  /**
   * Send notification via Courier (Free tier alternative to Twilio)
   */
  static async sendCourierNotification(to: string, message: string) {
    if (!this.courierClient) {
      logger.warn("Courier not configured. Skipping notification.");
      return;
    }
    try {
      await this.courierClient.send.message({
        message: {
          to: {
            email: to.includes('@') ? to : undefined,
            phone_number: to.includes('@') ? undefined : to,
          },
          content: {
            title: "Sahay Update",
            body: message,
          },
        },
      });
      logger.info(`Courier notification sent to ${to}`);
    } catch (error) {
      logger.error("Courier failure", error);
    }
  }

  /**
   * Send SMS (Legacy name, now uses Courier)
   */
  static async sendSMS(to: string, message: string) {
    return this.sendCourierNotification(to, message);
  }

  /**
   * Send Telegram message
   */
  static async sendTelegram(chatId: string, message: string) {
    if (!this.telegramBot) {
      logger.warn("Telegram bot not configured. Skipping message.");
      return;
    }
    try {
      await this.telegramBot.sendMessage(chatId, message);
      logger.info(`Telegram message sent to ${chatId}`);
    } catch (error) {
      logger.error("Telegram failure", error);
    }
  }

  /**
   * Send Intro Email
   */
  static async sendIntroEmail(to: string, subject: string, html: string) {
    if (!this.mailer) {
      logger.warn("Nodemailer not configured. Skipping email.");
      return;
    }
    try {
      await this.mailer.sendMail({
        from: `"Sahay AI" <${CONFIG.SMTP.USER}>`,
        to,
        subject,
        html,
      });
      logger.info(`Email sent to ${to}`);
    } catch (error) {
      logger.error("Email failure", error);
    }
  }
}
