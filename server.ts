import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import cors from 'cors';

// Import our routes & utilities
import admin, { db } from './src/backend/lib/firebaseAdmin';
import apiRoutes from './src/backend/routes/api';
import { requestLogger, errorHandler } from './src/backend/middleware/common';
import { logger } from './src/backend/config';

const PORT = 3000;

async function startServer() {
  const app = express();

  // Trust proxy for express-rate-limit behind AI Studio proxy
  app.set('trust proxy', 1);

  // 1. Core Middlewares
  app.use(express.json());
  app.use(cors());
  app.use(requestLogger);

  // 2. API Routes
  app.use('/api', apiRoutes);

  // 3. Vite - Development Mode
  if (process.env.NODE_ENV !== 'production') {
    logger.info("Initializing Vite middleware...");
    try {
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: false // Force HMR off as per instructions
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      logger.info("Vite middleware mounted.");
    } catch (err) {
      logger.error("Vite failed to start, falling back to static server logic", err);
    }
  }

  // 4. Static Files - Production or Vite Fallback
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
      res.status(500).send("Build artifacts missing. Please run 'npm run build'.");
    });
  }

  // 5. Final Error Handler
  app.use(errorHandler);

  // 6. Bind
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Sahay Platform Active: http://0.0.0.0:${PORT} [${process.env.NODE_ENV || 'dev'}]`);
  });

  // 7. Seed Data (Background)
  seedMockData().catch(err => logger.error("Seeding failed", err));
}

async function seedMockData() {
  // Check if admin is initialized (it should be since we imported it)
  if (!admin.apps.length) return;
  try {
    const jobsRef = db.collection('jobs');
    const snap = await jobsRef.limit(1).get();
    if (snap.empty) {
      logger.info("Seeding mock data...");
      const mockJobs = [
        {
          title: "Senior Industrial Welder",
          company: "L&T Construction",
          location: "Peenya, Bengaluru",
          salary: "₹28,000 - ₹35,000",
          description: "Required expert in TIG/ARC welding for heavy electrical panels.",
          skills: ["TIG Welding", "ARC Welding", "Blueprint Reading"],
          jobType: "Welder",
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          title: "CNC Operator Apprentice",
          company: "ABC Precision Tools",
          location: "Hoskote, KA",
          salary: "₹12,400 (NAPS Stipend)",
          description: "Apprenticeship for ITI Turner/Machinist graduates under NAPS scheme.",
          skills: ["CNC Programming", "Lathe Work"],
          jobType: "Machinist",
          isApprenticeship: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
      ];
      for (const job of mockJobs) {
        await jobsRef.add(job);
      }
      logger.info("Mock jobs seeded.");
    }
  } catch (err) {
    logger.debug("Seed check skipped or failed naturally.");
  }
}

startServer();
