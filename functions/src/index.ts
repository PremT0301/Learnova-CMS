/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest, onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = getFirestore();

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Placeholder endpoints for admin operations
export const triggerBackup = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.admin !== true) {
    throw new Error("unauthorized");
  }
  const payload = { timestamp: new Date().toISOString(), status: 'requested', userId: auth.uid };
  await db.collection('backups').add(payload);
  return { ok: true };
});

export const sendInvite = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.admin !== true) {
    throw new Error("unauthorized");
  }
  const { email, role } = request.data as { email: string; role: 'student'|'faculty'|'admin' };
  const payload = { email: String(email).toLowerCase(), role, status: 'sent', createdAt: new Date().toISOString(), userId: auth.uid };
  await db.collection('invites').add(payload);
  return { ok: true };
});

export const generateReport = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.admin !== true) {
    throw new Error("unauthorized");
  }
  const { type } = request.data as { type: 'user_growth'|'course_completion'|'average_grades' };
  if (type === 'user_growth') {
    const users = await db.collection('users').count().get();
    const total = users.data().count || 0;
    return { data: [
      { name: 'Week -2', value: Math.max(0, total - 10) },
      { name: 'Week -1', value: Math.max(0, total - 5) },
      { name: 'This Week', value: total },
    ] };
  }
  if (type === 'course_completion') {
    const courses = await db.collection('courses').limit(10).get();
    const rows = courses.docs.map((d, idx) => ({ name: (d.data() as any).title ?? `Course ${idx+1}`, value: Math.floor(Math.random()*40)+60 }));
    return { data: rows };
  }
  if (type === 'average_grades') {
    return { data: [
      { name: 'CS-301', value: 88 },
      { name: 'CS-401', value: 83 },
      { name: 'CS-350', value: 92 },
    ] };
  }
  return { data: [] };
});

export const setAdminClaim = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.admin !== true) {
    throw new Error("unauthorized");
  }
  const { uid, admin: makeAdmin } = request.data as { uid: string; admin: boolean };
  await admin.auth().setCustomUserClaims(uid, { admin: makeAdmin });
  return { ok: true };
});
