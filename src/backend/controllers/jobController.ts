import admin, { db, FieldValue } from "../lib/firebaseAdmin";
import { Request, Response, NextFunction } from "express";
import { GeminiService } from "../services/geminiService";
import { logger } from "../config";

export class JobController {
  /**
   * Get all jobs with filtering
   */
  static async getAllJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const snap = await db.collection("jobs").orderBy("createdAt", "desc").get();
      const jobs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ jobs });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Post a new job
   */
  static async createJob(req: any, res: Response, next: NextFunction) {
    try {
      const ref = await db.collection("jobs").add({
        ...req.body,
        postedBy: req.user.uid,
        createdAt: FieldValue.serverTimestamp()
      });
      res.json({ id: ref.id });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Match jobs based on user skills
   */
  static async matchJobs(req: any, res: Response, next: NextFunction) {
    try {
      const skills = req.query.skills?.toString().split(",") || [];
      const jobsSnap = await db.collection("jobs").limit(20).get();
      const jobs = jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const profile = { skills };
      const matches = await GeminiService.matchJobs(profile, jobs);
      res.json({ matches });
    } catch (error) {
      next(error);
    }
  }
}
