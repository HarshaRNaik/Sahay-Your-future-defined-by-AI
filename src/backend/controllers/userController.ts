import admin, { db, FieldValue } from "../lib/firebaseAdmin";
import { Response, NextFunction } from "express";
import { logger } from "../config";

export class UserController {
  /**
   * Get user profile
   */
  static async getProfile(req: any, res: Response, next: NextFunction) {
    try {
      const doc = await db.collection("users").doc(req.user.uid).get();
      res.json({ profile: doc.data() || {} });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: any, res: Response, next: NextFunction) {
    try {
      await db.collection("users").doc(req.user.uid).set(req.body, { merge: true });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify identity
   */
  static async verifyId(req: any, res: Response, next: NextFunction) {
    const { role, legalName, aadhaarNumber, consent } = req.body;
    if (!consent) return res.status(400).json({ error: "Consent required Protocol." });
    
    try {
      const last4 = aadhaarNumber.slice(-4);
      await db.collection("users").doc(req.user.uid).set({
        role,
        legalName,
        verification: {
          status: "verified",
          aadhaarLast4: last4,
          timestamp: FieldValue.serverTimestamp()
        }
      }, { merge: true });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
