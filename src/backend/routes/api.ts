import { Router } from "express";
import { GeminiService } from "../services/geminiService";
import { NotificationService } from "../services/notificationService";
import { JobController } from "../controllers/jobController";
import { UserController } from "../controllers/userController";
import { apiLimiter, errorHandler } from "../middleware/common";
import { verifyAuthToken } from "../middleware/auth";
import { db, FieldValue } from "../lib/firebaseAdmin";
import admin from "../lib/firebaseAdmin";

const router = Router();

// --- USER REQUESTED EXACT PATHS ---
router.post("/skills", apiLimiter, async (req, res, next) => {
  try {
    const { input } = req.body;
    const result = await GeminiService.extractSkills(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/resume", apiLimiter, async (req, res, next) => {
  try {
    const result = await GeminiService.generateResume(req.body.profile);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/matches", apiLimiter, async (req, res, next) => {
  try {
    const { profile, jobs } = req.body;
    const matches = await GeminiService.matchJobs(profile, jobs);
    res.json(matches);
  } catch (error) {
    next(error);
  }
});

router.post("/apprenticeships", apiLimiter, async (req, res, next) => {
  try {
    const { profile, apprenticeships } = req.body;
    const matches = await GeminiService.matchJobs(profile, apprenticeships);
    res.json(matches);
  } catch (error) {
    next(error);
  }
});

router.post("/chat", apiLimiter, async (req, res, next) => {
  try {
    const { message, history } = req.body;
    const response = await GeminiService.chat(message, history);
    res.json({ response });
  } catch (error) {
    next(error);
  }
});

router.post("/notify/sms", async (req, res, next) => {
  try {
    const { to, message } = req.body;
    await NotificationService.sendSMS(to, message);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/notify/telegram", async (req, res, next) => {
  try {
    const { chatId, message } = req.body;
    await NotificationService.sendTelegram(chatId, message);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/email/intro", async (req, res, next) => {
  try {
    const { to, subject, body } = req.body;
    await NotificationService.sendIntroEmail(to, subject, body);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// --- USER ROUTES ---
router.get("/profile", verifyAuthToken, UserController.getProfile);
router.post("/profile", verifyAuthToken, UserController.updateProfile);
router.post("/security/verify-id", verifyAuthToken, UserController.verifyId);

// --- JOB ROUTES ---
router.get("/jobs", JobController.getAllJobs);
router.post("/jobs", verifyAuthToken, JobController.createJob);
router.get("/matches/query", verifyAuthToken, JobController.matchJobs);

// --- AI INTELLIGENCE ---
router.post("/ai/chat", apiLimiter, async (req, res, next) => {
  try {
    const { message, history } = req.body;
    const response = await GeminiService.chat(message, history);
    res.json({ text: response, action: "STAY" });
  } catch (error) {
    next(error);
  }
});

router.post("/ai/resume", verifyAuthToken, apiLimiter, async (req: any, res, next) => {
  try {
    const profile = req.body.profile;
    const result = await GeminiService.generateResume(profile);
    res.json({ resume: result.markdown });
  } catch (error) {
    next(error);
  }
});

// --- REPORTING ---
router.post("/report", verifyAuthToken, async (req, res, next) => {
  try {
    const { siteData, personnel } = req.body;
    const prompt = `Generate a formal industrial attendance and payout report for: ${JSON.stringify(siteData)}. Personnel list: ${JSON.stringify(personnel)}. Format as a professional summary.`;
    const result = await GeminiService.chat(prompt);
    res.json({ report: result });
  } catch (error) {
    next(error);
  }
});

// --- APPLICATIONS ---
router.get("/applications", verifyAuthToken, async (req, res, next) => {
  try {
    const snap = await db.collection("applications").get();
    res.json({ applications: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (error) {
    next(error);
  }
});

router.post("/applications", verifyAuthToken, async (req: any, res, next) => {
  try {
    await db.collection("applications").add({
      ...req.body,
      workerId: req.user.uid,
      status: "applied",
      createdAt: FieldValue.serverTimestamp()
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// --- NOTIFICATIONS (BACKWARD COMPATIBLE) ---
router.post("/notify", verifyAuthToken, async (req, res, next) => {
  try {
    const { telegramHandle, jobTitle, company } = req.body;
    const message = `[Sahay Alert] New application for ${jobTitle} at ${company}`;
    if (telegramHandle) {
      await NotificationService.sendTelegram(telegramHandle, message);
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get("/backend/options", (req, res) => {
  res.json({
    backend: {
      "AI_CHAT": { method: "POST", path: "/api/ai/chat", details: "Skill extraction and intent detected using Gemini 2.0 Flash." },
      "AI_RESUME": { method: "POST", path: "/api/ai/resume", details: "Markdown resume generation based on extracted vocational data." },
      "JOB_MATCHING": { method: "GET", path: "/api/matches", details: "Agentic matching scoring worker skills against site requirements." }
    }
  });
});

router.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

router.use(errorHandler);

export default router;
