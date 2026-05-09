import admin, { auth } from "../lib/firebaseAdmin";
import { Request, Response, NextFunction } from "express";
import { logger } from "../config";

export interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

/**
 * Middleware to verify Firebase JWT token
 */
export const verifyAuthToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header Protocol." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    logger.error("Auth token verification failed", error);
    res.status(401).json({ error: "Unauthorized: Invalid or expired token Protocol." });
  }
};

/**
 * Middleware to strictly require an authenticated user
 */
export const requireAuthenticatedUser = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required Protocol." });
  }
  next();
};
