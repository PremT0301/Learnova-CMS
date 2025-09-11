import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase';

export async function logAudit(action: string, details: Record<string, unknown> | string, userId?: string) {
  try {
    const payload: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      action,
      details: typeof details === 'string' ? { message: details } : details,
    };
    if (userId) payload.userId = userId;
    await addDoc(collection(db, 'audit_logs'), payload);
  } catch {
    // swallow audit errors to avoid blocking UX
  }
}


