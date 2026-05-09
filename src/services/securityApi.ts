import { auth } from '../lib/firebase';
import { authFetch } from './backendApi';

export type VerificationRole = 'employee' | 'employer';

export interface VerifyIdPayload {
  role: VerificationRole;
  legalName: string;
  organizationName?: string;
  aadhaarNumber: string;
  consent: boolean;
}

export async function verifyIdProof(payload: VerifyIdPayload) {
  if (!auth.currentUser) {
    throw new Error('Please sign in again before verification.');
  }

  return authFetch('/api/security/verify-id', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
