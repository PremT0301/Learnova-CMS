import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase';

// Types for Faculty data structures
export interface FacultyProfile {
  id?: string;
  name: string;
  email: string;
  department: string;
  officeLocation?: string;
  officeHours?: string;
  phone?: string;
  bio?: string;
  notifications: {
    emailNotifications: boolean;
    assignmentReminders: boolean;
    gradeNotifications: boolean;
    announcementAlerts: boolean;
    weeklyReports: boolean;
    deadlineAlerts: boolean;
  };
  preferences: {
    timezone: string;
    dateFormat: string;
    gradeScale: string;
    defaultLanguage: string;
    theme: string;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    loginNotifications: boolean;
    passwordExpiry: number;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FacultyAssignment {
  id?: string;
  facultyId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  type: 'Programming' | 'Project' | 'Exam' | 'Portfolio' | 'Quiz' | 'Essay';
  status: 'draft' | 'active' | 'completed';
  attachments?: string[];
  rubric?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FacultyAnnouncement {
  id?: string;
  facultyId: string;
  courseId?: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'published' | 'scheduled';
  scheduledDate?: string;
  recipients: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CourseEnrollment {
  id?: string;
  courseId: string;
  studentId: string;
  enrolledAt: Timestamp;
  status: 'active' | 'dropped' | 'completed';
}

export interface AssignmentSubmission {
  id?: string;
  assignmentId: string;
  studentId: string;
  submittedAt: Timestamp;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
}

// Faculty Profile Operations
export const facultyProfileService = {
  // Get faculty profile
  async getProfile(facultyId: string): Promise<FacultyProfile | null> {
    try {
      const profileDoc = await getDoc(doc(db, 'faculty_profiles', facultyId));
      if (profileDoc.exists()) {
        return { id: profileDoc.id, ...profileDoc.data() } as FacultyProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching faculty profile:', error);
      throw error;
    }
  },

  // Create or update faculty profile
  async updateProfile(facultyId: string, profileData: Partial<FacultyProfile>): Promise<void> {
    try {
      const profileRef = doc(db, 'faculty_profiles', facultyId);
      await updateDoc(profileRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      // If document doesn't exist, create it
      if (error.code === 'not-found') {
        await addDoc(collection(db, 'faculty_profiles'), {
          ...profileData,
          id: facultyId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        console.error('Error updating faculty profile:', error);
        throw error;
      }
    }
  },

  // Subscribe to profile changes
  subscribeToProfile(facultyId: string, callback: (profile: FacultyProfile | null) => void) {
    return onSnapshot(doc(db, 'faculty_profiles', facultyId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as FacultyProfile);
      } else {
        callback(null);
      }
    });
  }
};

// Assignment Operations
export const assignmentService = {
  // Get assignments for a faculty member
  async getAssignments(facultyId: string): Promise<FacultyAssignment[]> {
    try {
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('facultyId', '==', facultyId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(assignmentsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FacultyAssignment));
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  },

  // Get assignments for a specific course
  async getCourseAssignments(courseId: string): Promise<FacultyAssignment[]> {
    try {
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('courseId', '==', courseId),
        orderBy('dueDate', 'asc')
      );
      const snapshot = await getDocs(assignmentsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FacultyAssignment));
    } catch (error) {
      console.error('Error fetching course assignments:', error);
      throw error;
    }
  },

  // Create new assignment
  async createAssignment(assignmentData: Omit<FacultyAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'assignments'), {
        ...assignmentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  },

  // Update assignment
  async updateAssignment(assignmentId: string, updates: Partial<FacultyAssignment>): Promise<void> {
    try {
      const assignmentRef = doc(db, 'assignments', assignmentId);
      await updateDoc(assignmentRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  },

  // Delete assignment
  async deleteAssignment(assignmentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'assignments', assignmentId));
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }
  },

  // Get assignment submissions
  async getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    try {
      const submissionsQuery = query(
        collection(db, 'assignment_submissions'),
        where('assignmentId', '==', assignmentId),
        orderBy('submittedAt', 'desc')
      );
      const snapshot = await getDocs(submissionsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssignmentSubmission));
    } catch (error) {
      console.error('Error fetching assignment submissions:', error);
      throw error;
    }
  },

  // Subscribe to assignments for real-time updates
  subscribeToAssignments(facultyId: string, callback: (assignments: FacultyAssignment[]) => void) {
    const assignmentsQuery = query(
      collection(db, 'assignments'),
      where('facultyId', '==', facultyId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(assignmentsQuery, (snapshot) => {
      const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FacultyAssignment));
      callback(assignments);
    });
  }
};

// Announcement Operations
export const announcementService = {
  // Get announcements for a faculty member
  async getAnnouncements(facultyId: string): Promise<FacultyAnnouncement[]> {
    try {
      const announcementsQuery = query(
        collection(db, 'faculty_announcements'),
        where('facultyId', '==', facultyId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(announcementsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FacultyAnnouncement));
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  },

  // Create new announcement
  async createAnnouncement(announcementData: Omit<FacultyAnnouncement, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'faculty_announcements'), {
        ...announcementData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  },

  // Update announcement
  async updateAnnouncement(announcementId: string, updates: Partial<FacultyAnnouncement>): Promise<void> {
    try {
      const announcementRef = doc(db, 'faculty_announcements', announcementId);
      await updateDoc(announcementRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  },

  // Delete announcement
  async deleteAnnouncement(announcementId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'faculty_announcements', announcementId));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  },

  // Subscribe to announcements for real-time updates
  subscribeToAnnouncements(facultyId: string, callback: (announcements: FacultyAnnouncement[]) => void) {
    const announcementsQuery = query(
      collection(db, 'faculty_announcements'),
      where('facultyId', '==', facultyId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(announcementsQuery, (snapshot) => {
      const announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FacultyAnnouncement));
      callback(announcements);
    });
  }
};

// Course Operations
export const facultyCourseService = {
  // Get courses taught by faculty
  async getFacultyCourses(facultyId: string): Promise<any[]> {
    try {
      const coursesQuery = query(
        collection(db, 'courses'),
        where('instructorId', '==', facultyId)
      );
      const snapshot = await getDocs(coursesQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching faculty courses:', error);
      throw error;
    }
  },

  // Get enrolled students for a course
  async getCourseStudents(courseId: string): Promise<any[]> {
    try {
      const enrollmentsQuery = query(
        collection(db, 'course_enrollments'),
        where('courseId', '==', courseId),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(enrollmentsQuery);
      const studentIds = snapshot.docs.map(doc => doc.data().studentId);
      
      // Fetch student details
      const students = [];
      for (const studentId of studentIds) {
        const studentDoc = await getDoc(doc(db, 'users', studentId));
        if (studentDoc.exists()) {
          students.push({ id: studentDoc.id, ...studentDoc.data() });
        }
      }
      return students;
    } catch (error) {
      console.error('Error fetching course students:', error);
      throw error;
    }
  },

  // Subscribe to faculty courses for real-time updates
  subscribeToFacultyCourses(facultyId: string, callback: (courses: any[]) => void) {
    const coursesQuery = query(
      collection(db, 'courses'),
      where('instructorId', '==', facultyId)
    );
    return onSnapshot(coursesQuery, (snapshot) => {
      const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(courses);
    });
  }
};

// Analytics Operations
export const facultyAnalyticsService = {
  // Get faculty analytics data
  async getAnalytics(facultyId: string): Promise<any> {
    try {
      // Get courses
      const courses = await facultyCourseService.getFacultyCourses(facultyId);
      
      // Get assignments
      const assignments = await assignmentService.getAssignments(facultyId);
      
      // Get announcements
      const announcements = await announcementService.getAnnouncements(facultyId);
      
      // Calculate analytics
      const totalStudents = courses.reduce((sum, course) => sum + (course.enrolled || 0), 0);
      const totalAssignments = assignments.length;
      const activeAssignments = assignments.filter(a => a.status === 'active').length;
      const completedAssignments = assignments.filter(a => a.status === 'completed').length;
      
      return {
        totalStudents,
        totalCourses: courses.length,
        totalAssignments,
        activeAssignments,
        completedAssignments,
        totalAnnouncements: announcements.length,
        courses: courses.map(course => ({
          id: course.id,
          title: course.title,
          code: course.code,
          enrolled: course.enrolled || 0,
          capacity: course.capacity || 0
        }))
      };
    } catch (error) {
      console.error('Error fetching faculty analytics:', error);
      throw error;
    }
  },

  // Get grade distribution for a course
  async getGradeDistribution(courseId: string): Promise<any> {
    try {
      const submissionsQuery = query(
        collection(db, 'assignment_submissions'),
        where('courseId', '==', courseId),
        where('status', '==', 'graded')
      );
      const snapshot = await getDocs(submissionsQuery);
      
      const grades = snapshot.docs.map(doc => doc.data().grade).filter(grade => grade !== undefined);
      
      // Calculate distribution
      const distribution = {
        A: grades.filter(g => g >= 90).length,
        B: grades.filter(g => g >= 80 && g < 90).length,
        C: grades.filter(g => g >= 70 && g < 80).length,
        D: grades.filter(g => g >= 60 && g < 70).length,
        F: grades.filter(g => g < 60).length
      };
      
      return distribution;
    } catch (error) {
      console.error('Error fetching grade distribution:', error);
      throw error;
    }
  }
};

export default {
  facultyProfileService,
  assignmentService,
  announcementService,
  facultyCourseService,
  facultyAnalyticsService
};
