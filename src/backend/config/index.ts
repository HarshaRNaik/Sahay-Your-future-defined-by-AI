import { GoogleGenAI } from "@google/genai";
import winston from "winston";
import NodeCache from "node-cache";

// Logger configuration
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

import dotenv from 'dotenv';
dotenv.config();

// Cache configuration (1 hour default TTL)
export const apiCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Gemini Configuration
const geminiKey = process.env.GEMINI_API_KEY;
console.log('GEMINI_API_KEY value:', JSON.stringify(geminiKey));
if (!geminiKey) {
  logger.warn("GEMINI_API_KEY is not set in environment variables.");
} else {
  logger.info(`GEMINI_API_KEY is present (length: ${geminiKey.length})`);
}

export const ai = new GoogleGenAI({ apiKey: geminiKey || "AIzaSy_MISSING_KEY" });

// App config constants
export const CONFIG = {
  PORT: process.env.PORT || 3000,
  APP_URL: process.env.APP_URL || "http://localhost:3000",
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  COURIER_AUTH_TOKEN: process.env.COURIER_AUTH_TOKEN,
  SMTP: {
    HOST: process.env.SMTP_HOST || "smtp.gmail.com",
    PORT: Number(process.env.SMTP_PORT) || 587,
    USER: process.env.SMTP_EMAIL,
    PASS: process.env.SMTP_PASSWORD,
  }
};
