import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";
import { Request, Response, NextFunction } from "express";
import { logger } from "../config";

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: false, // Vite handles CSP in dev
  }),
  compression(),
];

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // Higher limit for dev
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
});

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error Protocol",
      status: err.status || 500,
    },
  });
};
