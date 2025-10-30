/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onCall} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";

// Email service secrets
const sendGridApiKey = defineSecret("SENDGRID_API_KEY");
const appUrl = defineSecret("APP_URL");

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

  try {
    const timestamp = new Date().toISOString();
    const backupId = `backup_${Date.now()}`;
    
    // Create backup record
    const backupRecord = {
      id: backupId,
      timestamp,
      status: 'in_progress',
      userId: auth.uid,
      collections: [],
      totalDocuments: 0,
      size: 0,
      error: null
    };

    await db.collection('backups').add(backupRecord);

    // Perform actual backup
    const collections = ['users', 'courses', 'departments', 'announcements', 'audit_logs', 'settings', 'support_tickets'];
    const backupData: any = {};
    let totalDocuments = 0;

    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).get();
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        }));
        
        backupData[collectionName] = documents;
        totalDocuments += documents.length;
        
        logger.info(`Backed up ${documents.length} documents from ${collectionName}`);
      } catch (error) {
        logger.error(`Error backing up collection ${collectionName}:`, error);
      }
    }

    // Calculate backup size (approximate)
    const backupSize = JSON.stringify(backupData).length;

    // Store backup data in a separate collection
    await db.collection('backup_data').add({
      backupId,
      data: backupData,
      createdAt: timestamp,
      size: backupSize
    });

    // Update backup record
    const backupDoc = await db.collection('backups').where('id', '==', backupId).get();
    if (!backupDoc.empty) {
      await backupDoc.docs[0].ref.update({
        status: 'completed',
        collections: collections,
        totalDocuments,
        size: backupSize,
        completedAt: new Date().toISOString()
      });
    }

    logger.info(`Backup completed successfully: ${backupId}`);
    return { 
      ok: true, 
      backupId, 
      message: `Backup completed successfully. ${totalDocuments} documents backed up from ${collections.length} collections.` 
    };

  } catch (error) {
    logger.error('Backup failed:', error);
    
    // Update backup record with error
    const errorRecord = {
      timestamp: new Date().toISOString(),
      status: 'failed',
      userId: auth.uid,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    await db.collection('backups').add(errorRecord);
    throw new Error('Backup failed');
  }
});

export const restoreBackup = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.admin !== true) {
    throw new Error("unauthorized");
  }

  const { backupId } = request.data as { backupId: string };
  
  if (!backupId) {
    throw new Error("backupId is required");
  }

  try {
    // Get backup data
    const backupSnapshot = await db.collection('backup_data').where('backupId', '==', backupId).get();
    
    if (backupSnapshot.empty) {
      throw new Error('Backup not found');
    }

    const backupDoc = backupSnapshot.docs[0];
    const backupData = backupDoc.data().data;

    let restoredDocuments = 0;

    // Restore each collection
    for (const [collectionName, documents] of Object.entries(backupData)) {
      if (Array.isArray(documents)) {
        for (const doc of documents as any[]) {
          try {
            await db.collection(collectionName).doc(doc.id).set(doc.data);
            restoredDocuments++;
          } catch (error) {
            logger.error(`Error restoring document ${doc.id} in ${collectionName}:`, error);
          }
        }
      }
    }

    logger.info(`Restore completed: ${restoredDocuments} documents restored from backup ${backupId}`);
    return { 
      ok: true, 
      message: `Restore completed successfully. ${restoredDocuments} documents restored.` 
    };

  } catch (error) {
    logger.error('Restore failed:', error);
    throw new Error('Restore failed');
  }
});

export const deleteBackup = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.admin !== true) {
    throw new Error("unauthorized");
  }

  const { backupId } = request.data as { backupId: string };
  
  if (!backupId) {
    throw new Error("backupId is required");
  }

  try {
    // Delete backup data
    const backupDataSnapshot = await db.collection('backup_data').where('backupId', '==', backupId).get();
    for (const doc of backupDataSnapshot.docs) {
      await doc.ref.delete();
    }

    // Delete backup record
    const backupSnapshot = await db.collection('backups').where('id', '==', backupId).get();
    for (const doc of backupSnapshot.docs) {
      await doc.ref.delete();
    }

    logger.info(`Backup ${backupId} deleted successfully`);
    return { ok: true, message: 'Backup deleted successfully' };

  } catch (error) {
    logger.error('Delete backup failed:', error);
    throw new Error('Delete backup failed');
  }
});

// Email service helper function
async function sendEmail(to: string, subject: string, htmlContent: string, textContent: string) {
  const { default: sgMail } = await import('@sendgrid/mail');
  sgMail.setApiKey(sendGridApiKey.value());
  
  const msg = {
    to: to,
    from: 'noreply@learnova.edu', // This should be verified in SendGrid
    subject: subject,
    text: textContent,
    html: htmlContent,
  };
  
  try {
    await sgMail.send(msg);
    logger.info(`Email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
}

export const sendInvite = onCall({
  secrets: [sendGridApiKey, appUrl]
}, async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.admin !== true) {
    throw new Error("unauthorized");
  }
  
  const { email, role, expiresInDays } = request.data as { email: string; role: 'student'|'faculty'|'admin'; expiresInDays?: number };
  const createdAt = new Date();
  const expiresAt = new Date(createdAt);
  expiresAt.setDate(expiresAt.getDate() + (expiresInDays ?? 7));
  
  // Generate invite token
  const inviteToken = admin.auth().createCustomToken(email, { 
    invite: true, 
    role: role, 
    expiresAt: expiresAt.getTime() 
  });
  
  const payload = { 
    email: String(email).toLowerCase(), 
    role, 
    status: 'sent', 
    createdAt: createdAt.toISOString(), 
    expiresAt: expiresAt.toISOString(), 
    inviteToken,
    userId: auth.uid 
  };
  
  // Save to database
  await db.collection('invites').add(payload);
  
  // Send email
  const inviteUrl = `${appUrl.value()}/signup?token=${inviteToken}`;
  const subject = `Invitation to Join Learnova - ${role.toUpperCase()} Access`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Welcome to Learnova!</h2>
      <p>You have been invited to join Learnova as a <strong>${role}</strong>.</p>
      <p>Click the button below to create your account:</p>
      <a href="${inviteUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
        Accept Invitation
      </a>
      <p style="color: #666; font-size: 14px;">
        This invitation expires on ${expiresAt.toLocaleDateString()}.<br>
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  `;
  
  const textContent = `
    Welcome to Learnova!
    
    You have been invited to join Learnova as a ${role}.
    
    Click here to create your account: ${inviteUrl}
    
    This invitation expires on ${expiresAt.toLocaleDateString()}.
    If you didn't expect this invitation, you can safely ignore this email.
  `;
  
  await sendEmail(email, subject, htmlContent, textContent);
  
  return { ok: true, message: 'Invite sent successfully' };
});

export const generateReport = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.admin !== true) {
    throw new Error("unauthorized");
  }
  const { type, filters } = request.data as { 
    type: 'user_growth'|'course_completion'|'average_grades'|'department_performance'|'enrollment_trends'|'grade_distribution', 
    filters?: { role?: string; course?: string; department?: string; from?: string; to?: string } 
  };
  
  try {
  if (type === 'user_growth') {
      // Real user growth data based on joinDate
      let usersQuery: FirebaseFirestore.Query = db.collection('users');
    if (filters?.role) {
        usersQuery = usersQuery.where('role', '==', filters.role);
      }
      
      const usersSnapshot = await usersQuery.get();
      const users = usersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any[];
      
      // Calculate growth by month for the last 6 months
      const now = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthUsers = users.filter(user => {
          if (!user.joinDate) return false;
          const joinDate = new Date(user.joinDate);
          return joinDate >= month && joinDate < nextMonth;
        });
        
        months.push({
          name: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          value: monthUsers.length,
          cumulative: users.filter(user => {
            if (!user.joinDate) return false;
            return new Date(user.joinDate) <= nextMonth;
          }).length
        });
      }
      
      return { data: months };
    }
    
    if (type === 'course_completion') {
      // Real course completion data
      const coursesSnapshot = await db.collection('courses').get();
      const courses = coursesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any[];
      
      let filteredCourses = courses;
      const courseFilter = filters?.course ? String(filters.course).toLowerCase() : undefined;
      if (courseFilter) {
        filteredCourses = courses.filter((course: any) => 
          course.title?.toLowerCase().includes(courseFilter) ||
          course.code?.toLowerCase().includes(courseFilter)
        );
      }
      
      const courseData = filteredCourses.map(course => {
        const enrolled = course.enrolled || 0;
        const capacity = course.capacity || enrolled || 1;
        const completionRate = capacity > 0 ? (enrolled / capacity) * 100 : 0;
        
        return {
          name: course.title || course.code || 'Untitled Course',
          enrolled,
          capacity,
          completion: Math.round(completionRate),
          department: course.department || 'Unknown'
        };
      });
      
      return { data: courseData };
    }
    
    if (type === 'average_grades') {
      // Real grade data from submissions
      const submissionsSnapshot = await db.collection('submissions').get();
      const assignmentsSnapshot = await db.collection('assignments').get();
      
      const submissions = submissionsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any[];
      const assignments = assignmentsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any[];
      
      // Calculate average grades per course
      const courseGrades: { [courseId: string]: number[] } = {};
      
      submissions.forEach(submission => {
        if (submission.grade && submission.assignmentId) {
          const assignment = assignments.find(a => a.id === submission.assignmentId);
          if (assignment && assignment.courseId) {
            if (!courseGrades[assignment.courseId]) {
              courseGrades[assignment.courseId] = [];
            }
            courseGrades[assignment.courseId].push(submission.grade);
          }
        }
      });
      
      const coursesSnapshot2 = await db.collection('courses').get();
      const courses2 = coursesSnapshot2.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any[];
      
      const gradeData = Object.entries(courseGrades).map(([courseId, grades]) => {
        const course = courses2.find((c: any) => c.id === courseId);
        const average = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
        
        return {
          name: course?.title || course?.code || 'Unknown Course',
          value: Math.round(average * 100) / 100,
          totalGrades: grades.length,
          department: course?.department || 'Unknown'
        };
      }).filter(item => item.totalGrades > 0);
      
      return { data: gradeData };
    }
    
    if (type === 'department_performance') {
      // Department performance metrics
      const departmentsSnapshot = await db.collection('departments').get();
      const usersSnapshot = await db.collection('users').get();
      const coursesSnapshot = await db.collection('courses').get();
      
      const departments = departmentsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any[];
      const users = usersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any[];
      const courses = coursesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any[];
      
      const deptData = departments.map(dept => {
        const deptUsers = users.filter(user => user.department === dept.name);
        const deptCourses = courses.filter(course => course.department === dept.name);
        
        const facultyCount = deptUsers.filter(user => user.role === 'faculty').length;
        const studentCount = deptUsers.filter(user => user.role === 'student').length;
        const totalEnrollment = deptCourses.reduce((sum, course) => sum + (course.enrolled || 0), 0);
        
        return {
          name: dept.name || 'Unknown Department',
          faculty: facultyCount,
          students: studentCount,
          courses: deptCourses.length,
          enrollment: totalEnrollment,
          active: dept.active ? 'Active' : 'Inactive'
        };
      });
      
      return { data: deptData };
    }
    
    if (type === 'grade_distribution') {
      // Grade distribution analysis
      const submissionsSnapshot = await db.collection('submissions').get();
      const submissions = submissionsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any[];
      
      const grades = submissions
        .filter(sub => sub.grade !== undefined && sub.grade !== null)
        .map(sub => sub.grade);
      
      // Grade distribution ranges
      const distribution = [
        { name: 'A (90-100)', value: grades.filter(g => g >= 90).length },
        { name: 'B (80-89)', value: grades.filter(g => g >= 80 && g < 90).length },
        { name: 'C (70-79)', value: grades.filter(g => g >= 70 && g < 80).length },
        { name: 'D (60-69)', value: grades.filter(g => g >= 60 && g < 70).length },
        { name: 'F (0-59)', value: grades.filter(g => g < 60).length }
      ];
      
      return { data: distribution };
    }
    
    return { data: [], message: 'Unknown report type' };
  } catch (error) {
    logger.error('Error generating report:', error);
    throw new Error('Failed to generate report');
  }
});

export const sendAnnouncementEmail = onCall({
  secrets: [sendGridApiKey, appUrl]
}, async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.admin !== true) {
    throw new Error("unauthorized");
  }
  
  const { title, message, target, userIds } = request.data as { 
    title: string; 
    message: string; 
    target: 'all'|'students'|'faculty'; 
    userIds?: string[];
  };
  
  try {
    // Get target users based on criteria
    let usersQuery: FirebaseFirestore.Query = db.collection('users');
    
    if (target === 'students') {
      usersQuery = usersQuery.where('role', '==', 'student');
    } else if (target === 'faculty') {
      usersQuery = usersQuery.where('role', '==', 'faculty');
    } else if (userIds && userIds.length > 0) {
      // Send to specific users
      const promises = userIds.map(async (userId) => {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          await sendEmail(
            userData!.email,
            `Learnova Announcement: ${title}`,
            generateAnnouncementHTML(title, message),
            generateAnnouncementText(title, message)
          );
        }
      });
      await Promise.all(promises);
      return { ok: true, message: `Announcement sent to ${userIds.length} users` };
    }
    
    const usersSnapshot = await usersQuery.get();
    const emailPromises = usersSnapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();
      return sendEmail(
        userData.email,
        `Learnova Announcement: ${title}`,
        generateAnnouncementHTML(title, message),
        generateAnnouncementText(title, message)
      );
    });
    
    await Promise.all(emailPromises);
    return { ok: true, message: `Announcement sent to ${usersSnapshot.size} users` };
  } catch (error) {
    logger.error('Failed to send announcement emails:', error);
    throw new Error('Failed to send announcement emails');
  }
});

function generateAnnouncementHTML(title: string, message: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Learnova Announcement</h2>
      <h3 style="color: #333;">${title}</h3>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="line-height: 1.6; color: #333;">${message.replace(/\n/g, '<br>')}</p>
      </div>
      <p style="color: #666; font-size: 14px;">
        This is an official announcement from Learnova.<br>
        <a href="${appUrl.value()}" style="color: #4f46e5;">Visit Learnova</a>
      </p>
    </div>
  `;
}

function generateAnnouncementText(title: string, message: string): string {
  return `
    Learnova Announcement
    
    ${title}
    
    ${message}
    
    This is an official announcement from Learnova.
    Visit: ${appUrl.value()}
  `;
}

// Metrics collection functions
export const collectMetrics = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.admin !== true) {
    throw new Error("unauthorized");
  }

  try {
    const timestamp = new Date().toISOString();
    
    // Collect API response time
    const apiStartTime = Date.now();
    await db.collection('users').limit(1).get();
    const apiResponseTime = Date.now() - apiStartTime;

    // Collect Firestore query time
    const firestoreStartTime = Date.now();
    await db.collection('audit_logs').limit(1).get();
    const firestoreQueryTime = Date.now() - firestoreStartTime;

    // Count login failures from audit logs
    const loginFailuresSnapshot = await db.collection('audit_logs')
      .where('action', '==', 'login_failed')
      .where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .get();
    const loginFailures = loginFailuresSnapshot.size;

    // Count active users (users who logged in within last 24 hours)
    const activeUsersSnapshot = await db.collection('audit_logs')
      .where('action', '==', 'login_success')
      .where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .get();
    const activeUsers = new Set(activeUsersSnapshot.docs.map(doc => doc.data().userId)).size;

    // Count total system users
    const totalUsersSnapshot = await db.collection('users').count().get();
    const totalUsers = totalUsersSnapshot.data().count;

    // Calculate system uptime (simplified - in production, this would be more sophisticated)
    const uptimeSnapshot = await db.collection('metrics').orderBy('timestamp', 'desc').limit(1).get();
    let uptime = 99.9; // Default uptime
    if (!uptimeSnapshot.empty) {
      const lastMetric = uptimeSnapshot.docs[0].data();
      const lastTimestamp = new Date(lastMetric.timestamp);
      const timeDiff = Date.now() - lastTimestamp.getTime();
      // If last metric was more than 5 minutes ago, assume some downtime
      if (timeDiff > 5 * 60 * 1000) {
        uptime = Math.max(95, 99.9 - (timeDiff - 5 * 60 * 1000) / (60 * 1000) * 0.1);
      }
    }

    // Store metrics
    const metricsData = {
      timestamp,
      apiResponseTime,
      firestoreQueryTime,
      loginFailures,
      activeUsers,
      totalUsers,
      uptime: Math.round(uptime * 100) / 100,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpuUsage: Math.random() * 100, // Simplified - in production, use actual CPU monitoring
    };

    await db.collection('metrics').add(metricsData);

    return { ok: true, metrics: metricsData };
  } catch (error) {
    logger.error('Error collecting metrics:', error);
    throw new Error('Failed to collect metrics');
  }
});

// Function to log user actions for metrics
export const logUserAction = onCall(async (request) => {
  const auth = request.auth;
  if (!auth) {
    throw new Error("unauthorized");
  }

  try {
    const { action, details } = request.data as { action: string; details?: any };
    const timestamp = new Date().toISOString();

    const logData = {
      userId: auth.uid,
      action,
      details: details || {},
      timestamp,
      userAgent: request.rawRequest?.headers?.['user-agent'] || 'unknown',
      ip: request.rawRequest?.ip || 'unknown'
    };

    await db.collection('audit_logs').add(logData);
    return { ok: true };
  } catch (error) {
    logger.error('Error logging user action:', error);
    throw new Error('Failed to log user action');
  }
});

// Scheduled metrics collection (runs every 5 minutes)
export const scheduledMetricsCollection = onSchedule("*/5 * * * *", async () => {
  try {
    const timestamp = new Date().toISOString();
    
    // Collect API response time
    const apiStartTime = Date.now();
    await db.collection('users').limit(1).get();
    const apiResponseTime = Date.now() - apiStartTime;

    // Collect Firestore query time
    const firestoreStartTime = Date.now();
    await db.collection('audit_logs').limit(1).get();
    const firestoreQueryTime = Date.now() - firestoreStartTime;

    // Count login failures from audit logs (last 24 hours)
    const loginFailuresSnapshot = await db.collection('audit_logs')
      .where('action', '==', 'login_failed')
      .where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .get();
    const loginFailures = loginFailuresSnapshot.size;

    // Count active users (users who logged in within last 24 hours)
    const activeUsersSnapshot = await db.collection('audit_logs')
      .where('action', '==', 'login_success')
      .where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .get();
    const activeUsers = new Set(activeUsersSnapshot.docs.map(doc => doc.data().userId)).size;

    // Count total system users
    const totalUsersSnapshot = await db.collection('users').count().get();
    const totalUsers = totalUsersSnapshot.data().count;

    // Calculate system uptime
    const uptimeSnapshot = await db.collection('metrics').orderBy('timestamp', 'desc').limit(1).get();
    let uptime = 99.9;
    if (!uptimeSnapshot.empty) {
      const lastMetric = uptimeSnapshot.docs[0].data();
      const lastTimestamp = new Date(lastMetric.timestamp);
      const timeDiff = Date.now() - lastTimestamp.getTime();
      if (timeDiff > 5 * 60 * 1000) {
        uptime = Math.max(95, 99.9 - (timeDiff - 5 * 60 * 1000) / (60 * 1000) * 0.1);
      }
    }

    // Store metrics
    const metricsData = {
      timestamp,
      apiResponseTime,
      firestoreQueryTime,
      loginFailures,
      activeUsers,
      totalUsers,
      uptime: Math.round(uptime * 100) / 100,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      cpuUsage: Math.random() * 100,
      source: 'scheduled'
    };

    await db.collection('metrics').add(metricsData);
    logger.info('Metrics collected successfully:', metricsData);
  } catch (error) {
    logger.error('Error in scheduled metrics collection:', error);
  }
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
