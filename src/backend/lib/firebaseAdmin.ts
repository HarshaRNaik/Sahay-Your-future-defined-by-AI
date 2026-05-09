import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin'; // Still need for legacy types if used
import path from 'path';
import fs from 'fs';
import { logger } from '../config';

// Initialize Firebase Admin once
let dbInstance: any;
let authInstance: any;

// IN-MEMORY MOCK DATABASE
const memoryStore: Record<string, any[]> = {};
const mockDb = {
  collection: (collectionName: string) => {
    if (!memoryStore[collectionName]) memoryStore[collectionName] = [];
    const collectionRef = {
      add: async (data: any) => {
        const id = Math.random().toString(36).substring(2, 15);
        memoryStore[collectionName].push({ id, ...data });
        return { id };
      },
      get: async () => {
        const docs = memoryStore[collectionName].map(doc => ({
          id: doc.id,
          data: () => doc
        }));
        return { empty: docs.length === 0, docs };
      },
      orderBy: () => collectionRef,
      limit: () => collectionRef
    };
    return collectionRef;
  }
};

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (getApps().length === 0) {
    // Initialize with NO arguments first to use environment defaults
    const app = initializeApp();
    logger.info("Firebase Admin initialized with default credentials.");
    
    // Use Mock DB
    logger.info("Using IN-MEMORY Mock Firestore Database (Billing workaround).");
    dbInstance = mockDb;
    authInstance = getAuth(app);
  } else {
    const app = getApp();
    dbInstance = mockDb;
    authInstance = getAuth(app);
  }
} catch (error) {
  logger.error("CRITICAL: Failed to initialize Firebase Admin", error);
  // Fallback as last resort
  try {
    if (getApps().length === 0) initializeApp();
    dbInstance = mockDb;
    authInstance = getAuth();
  } catch (e) {
    logger.error("FATAL: Firebase Admin fallback also failed", e);
  }
}

export const db = dbInstance;
export const auth = authInstance;
export { admin, FieldValue };
export default admin;
