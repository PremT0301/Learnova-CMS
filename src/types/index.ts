export type UserRole = 'admin' | 'faculty' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  joinDate: string;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  instructor: string;
  instructorId: string;
  department: string;
  credits: number;
  capacity: number;
  enrolled: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'completed';
  image?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  type: 'homework' | 'quiz' | 'exam' | 'project';
  status: 'draft' | 'published' | 'completed';
  attachments?: string[];
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  attachments?: string[];
  submittedAt: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late';
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  status: 'active' | 'completed' | 'dropped';
  progress: number;
  grade?: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'document' | 'link' | 'other';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt?: string;
  isPublished: boolean;
  order?: number;
}

export interface CourseAnnouncement {
  id: string;
  courseId: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  priority: 'low' | 'medium' | 'high';
  isPinned: boolean;
  attachments?: string[];
  createdAt: string;
  updatedAt?: string;
}