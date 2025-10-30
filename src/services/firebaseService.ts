import { db } from '@/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  updateDoc, 
  where, 
  addDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  orderBy, 
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { User, Course, Assignment, Submission, Enrollment, Notification, UserRole } from '@/types';

// ===== INTERFACES =====
export interface FacultyRequestDoc {
  id: string;
  userId: string;
  email: string;
  name?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt?: string;
  reviewedAt?: string;
}

export interface AnnouncementDoc {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdByName: string;
  visibleTo: UserRole[];
  createdAt: string;
  updatedAt: string;
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
}

export interface AnalyticsData {
  totalUsers: number;
  totalFaculty: number;
  totalStudents: number;
  pendingApprovals: number;
  totalCourses: number;
  totalAssignments: number;
  recentActivity: any[];
}

// ===== FACULTY REQUESTS =====
export function listenPendingFacultyRequests(onChange: (requests: FacultyRequestDoc[]) => void) {
  const col = collection(db, 'faculty_requests');
  const q = query(col, where('status', '==', 'pending'), orderBy('requestedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    console.log('Faculty requests snapshot received:', snap.size, 'documents');
    const list = snap.docs.map((d) => {
      console.log('Faculty request doc:', d.id, d.data());
      return { id: d.id, ...(d.data() as any) };
    }) as FacultyRequestDoc[];
    console.log('Parsed faculty requests:', list);
    onChange(list);
  }, (error) => {
    console.error('Error listening to faculty requests:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  });
}

export async function approveFacultyRequest(request: FacultyRequestDoc) {
  try {
    const batch = writeBatch(db);
    
    // Update user role and status
    const userRef = doc(db, 'users', request.userId);
    batch.update(userRef, { 
      role: 'faculty', 
      active: true,
      approvedAt: serverTimestamp()
    });
    
    // Update request status
    const reqRef = doc(db, 'faculty_requests', request.id);
    batch.update(reqRef, { 
      status: 'approved', 
      reviewedAt: serverTimestamp() 
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error approving faculty request:', error);
    return { success: false, error: error.message };
  }
}

export async function rejectFacultyRequest(request: FacultyRequestDoc) {
  try {
    const batch = writeBatch(db);
    
    // Update user status
    const userRef = doc(db, 'users', request.userId);
    batch.update(userRef, { 
      role: 'student', 
      active: false 
    });
    
    // Update request status
    const reqRef = doc(db, 'faculty_requests', request.id);
    batch.update(reqRef, { 
      status: 'rejected', 
      reviewedAt: serverTimestamp() 
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error rejecting faculty request:', error);
    return { success: false, error: error.message };
  }
}

export function listenFacultyRequestByEmail(email: string, onChange: (request: FacultyRequestDoc | null) => void) {
  const col = collection(db, 'faculty_requests');
  const q = query(col, where('email', '==', email.toLowerCase()));
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      onChange(null);
    } else {
      const d = snap.docs[0];
      onChange({ id: d.id, ...(d.data() as any) } as FacultyRequestDoc);
    }
  });
}

// ===== USERS MANAGEMENT =====
export function listenUsers(onChange: (users: User[]) => void) {
  const col = collection(db, 'users');
  const q = query(col, orderBy('joinDate', 'desc'));
  return onSnapshot(q, (snap) => {
    const users = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as User[];
    onChange(users);
  });
}

export function listenUsersByRole(role: UserRole, onChange: (users: User[]) => void) {
  const col = collection(db, 'users');
  const q = query(col, where('role', '==', role), orderBy('joinDate', 'desc'));
  return onSnapshot(q, (snap) => {
    const users = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as User[];
    onChange(users);
  });
}

export async function createUser(userData: Partial<User>) {
  try {
    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: serverTimestamp(),
      active: true
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
}

export async function updateUser(userId: string, updates: Partial<User>) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteUser(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
}

// ===== ANNOUNCEMENTS =====
export function listenAnnouncements(onChange: (announcements: AnnouncementDoc[]) => void) {
  const col = collection(db, 'announcements');
  const q = query(col, where('isActive', '==', true), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const announcements = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as AnnouncementDoc[];
    onChange(announcements);
  });
}

export function listenAnnouncementsByRole(role: UserRole, onChange: (announcements: AnnouncementDoc[]) => void) {
  const col = collection(db, 'announcements');
  const q = query(
    col, 
    where('isActive', '==', true),
    where('visibleTo', 'array-contains', role),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const announcements = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as AnnouncementDoc[];
    onChange(announcements);
  });
}

export async function createAnnouncement(announcementData: Omit<AnnouncementDoc, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, 'announcements'), {
      ...announcementData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating announcement:', error);
    return { success: false, error: error.message };
  }
}

export async function updateAnnouncement(announcementId: string, updates: Partial<AnnouncementDoc>) {
  try {
    const announcementRef = doc(db, 'announcements', announcementId);
    await updateDoc(announcementRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating announcement:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteAnnouncement(announcementId: string) {
  try {
    const announcementRef = doc(db, 'announcements', announcementId);
    await updateDoc(announcementRef, { isActive: false });
    return { success: true };
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return { success: false, error: error.message };
  }
}

// ===== COURSES =====
export function listenCourses(onChange: (courses: Course[]) => void) {
  const col = collection(db, 'courses');
  const q = query(col, orderBy('startDate', 'desc'));
  return onSnapshot(q, (snap) => {
    const courses = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Course[];
    onChange(courses);
  });
}

export function listenCoursesByInstructor(instructorId: string, onChange: (courses: Course[]) => void) {
  const col = collection(db, 'courses');
  const q = query(col, where('instructorId', '==', instructorId), orderBy('startDate', 'desc'));
  return onSnapshot(q, (snap) => {
    const courses = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Course[];
    onChange(courses);
  });
}

export function listenCoursesByStudent(studentId: string, onChange: (courses: Course[]) => void) {
  const col = collection(db, 'courses');
  const q = query(col, where('studentsEnrolled', 'array-contains', studentId), orderBy('startDate', 'desc'));
  return onSnapshot(q, (snap) => {
    const courses = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Course[];
    onChange(courses);
  });
}

export async function createCourse(courseData: Omit<Course, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, 'courses'), {
      ...courseData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating course:', error);
    return { success: false, error: error.message };
  }
}

export async function updateCourse(courseId: string, updates: Partial<Course>) {
  try {
    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating course:', error);
    return { success: false, error: error.message };
  }
}

export async function enrollStudentInCourse(courseId: string, studentId: string) {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      return { success: false, error: 'Course not found' };
    }
    
    const courseData = courseDoc.data() as Course;
    const updatedEnrolled = [...(courseData.studentsEnrolled || []), studentId];
    
    await updateDoc(courseRef, {
      studentsEnrolled: updatedEnrolled,
      enrolled: updatedEnrolled.length,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error enrolling student:', error);
    return { success: false, error: error.message };
  }
}

// ===== ASSIGNMENTS =====
export function listenAssignmentsByCourse(courseId: string, onChange: (assignments: Assignment[]) => void) {
  const col = collection(db, 'assignments');
  const q = query(col, where('courseId', '==', courseId), orderBy('dueDate', 'asc'));
  return onSnapshot(q, (snap) => {
    const assignments = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Assignment[];
    onChange(assignments);
  });
}

export function listenAssignmentsByStudent(studentId: string, onChange: (assignments: Assignment[]) => void) {
  // This would need to be implemented based on course enrollment
  // For now, we'll get all assignments and filter by enrolled courses
  const col = collection(db, 'assignments');
  const q = query(col, orderBy('dueDate', 'asc'));
  return onSnapshot(q, (snap) => {
    const assignments = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Assignment[];
    onChange(assignments);
  });
}

export async function createAssignment(assignmentData: Omit<Assignment, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, 'assignments'), {
      ...assignmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating assignment:', error);
    return { success: false, error: error.message };
  }
}

export async function updateAssignment(assignmentId: string, updates: Partial<Assignment>) {
  try {
    const assignmentRef = doc(db, 'assignments', assignmentId);
    await updateDoc(assignmentRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating assignment:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteAssignment(assignmentId: string) {
  try {
    const assignmentRef = doc(db, 'assignments', assignmentId);
    await deleteDoc(assignmentRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return { success: false, error: error.message };
  }
}

// ===== SUBMISSIONS =====
export function listenSubmissionsByAssignment(assignmentId: string, onChange: (submissions: Submission[]) => void) {
  const col = collection(db, 'submissions');
  const q = query(col, where('assignmentId', '==', assignmentId), orderBy('submittedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const submissions = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Submission[];
    onChange(submissions);
  });
}

export function listenSubmissionsByStudent(studentId: string, onChange: (submissions: Submission[]) => void) {
  const col = collection(db, 'submissions');
  const q = query(col, where('studentId', '==', studentId), orderBy('submittedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const submissions = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Submission[];
    onChange(submissions);
  });
}

export async function submitAssignment(submissionData: Omit<Submission, 'id' | 'submittedAt'>) {
  try {
    const docRef = await addDoc(collection(db, 'submissions'), {
      ...submissionData,
      submittedAt: serverTimestamp(),
      status: 'submitted'
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return { success: false, error: error.message };
  }
}

export async function gradeSubmission(submissionId: string, grade: number, feedback?: string) {
  try {
    const submissionRef = doc(db, 'submissions', submissionId);
    await updateDoc(submissionRef, {
      grade,
      feedback,
      status: 'graded',
      gradedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error grading submission:', error);
    return { success: false, error: error.message };
  }
}

// ===== ANALYTICS =====
export async function getAnalyticsData(): Promise<AnalyticsData> {
  try {
    // Get total users by role with individual error handling
    const results = await Promise.allSettled([
      getDocs(collection(db, 'users')),
      getDocs(query(collection(db, 'users'), where('role', '==', 'faculty'))),
      getDocs(query(collection(db, 'users'), where('role', '==', 'student'))),
      getDocs(query(collection(db, 'faculty_requests'), where('status', '==', 'pending'))),
      getDocs(collection(db, 'courses')),
      getDocs(collection(db, 'assignments'))
    ]);

    const [usersResult, facultyResult, studentsResult, pendingResult, coursesResult, assignmentsResult] = results;

    return {
      totalUsers: usersResult.status === 'fulfilled' ? usersResult.value.size : 0,
      totalFaculty: facultyResult.status === 'fulfilled' ? facultyResult.value.size : 0,
      totalStudents: studentsResult.status === 'fulfilled' ? studentsResult.value.size : 0,
      pendingApprovals: pendingResult.status === 'fulfilled' ? pendingResult.value.size : 0,
      totalCourses: coursesResult.status === 'fulfilled' ? coursesResult.value.size : 0,
      totalAssignments: assignmentsResult.status === 'fulfilled' ? assignmentsResult.value.size : 0,
      recentActivity: [] // This would be implemented based on your activity tracking needs
    };
  } catch (error) {
    console.error('Error getting analytics data:', error);
    // Return default values instead of throwing
    return {
      totalUsers: 0,
      totalFaculty: 0,
      totalStudents: 0,
      pendingApprovals: 0,
      totalCourses: 0,
      totalAssignments: 0,
      recentActivity: []
    };
  }
}

// ===== NOTIFICATIONS =====
export function listenNotificationsByUser(userId: string, onChange: (notifications: Notification[]) => void) {
  const col = collection(db, 'notifications');
  const q = query(col, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snap) => {
    const notifications = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Notification[];
    onChange(notifications);
  });
}

export async function createNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>) {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notificationData,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { isRead: true });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
}


