// Sample data for testing announcements functionality
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

export const sampleAnnouncements = [
  {
    title: 'Welcome to the New Semester!',
    type: 'general',
    priority: 'high',
    course: 'General',
    courseCode: 'ALL',
    instructor: 'Administration',
    content: 'Welcome back to campus! We hope you have a productive and successful semester. Please review the updated academic calendar and important dates.',
    isPinned: true,
    attachments: ['academic_calendar.pdf'],
    authorId: 'admin-001',
    authorName: 'Academic Administration',
    targetAudience: 'all'
  },
  {
    title: 'Midterm Exam Schedule - CS-301',
    type: 'academic',
    priority: 'high',
    course: 'Data Structures & Algorithms',
    courseCode: 'CS-301',
    instructor: 'Prof. Chen',
    content: 'The midterm exam for CS-301 has been scheduled for February 15th at 2:00 PM in Room 101. Please bring your student ID and a calculator. No electronic devices allowed.',
    isPinned: true,
    attachments: ['exam_schedule.pdf', 'exam_guidelines.pdf'],
    authorId: 'faculty-001',
    authorName: 'Prof. Chen',
    targetAudience: 'specific_course',
    courseId: 'cs-301-spring-2024'
  },
  {
    title: 'Assignment Submission Guidelines',
    type: 'academic',
    priority: 'medium',
    course: 'Database Management Systems',
    courseCode: 'CS-401',
    instructor: 'Dr. Smith',
    content: 'Please ensure all assignments are submitted through the LMS portal before 11:59 PM on the due date. Late submissions will incur a 10% penalty per day.',
    isPinned: false,
    attachments: [],
    authorId: 'faculty-002',
    authorName: 'Dr. Smith',
    targetAudience: 'specific_course',
    courseId: 'cs-401-spring-2024'
  },
  {
    title: 'Library Extended Hours During Finals',
    type: 'general',
    priority: 'medium',
    course: 'General',
    courseCode: 'ALL',
    instructor: 'Library Services',
    content: 'The university library will be open 24/7 during finals week (February 26 - March 5). Study rooms are available for group work on a first-come, first-served basis.',
    isPinned: false,
    attachments: ['library_hours.pdf', 'study_room_booking.pdf'],
    authorId: 'library-001',
    authorName: 'Library Services',
    targetAudience: 'students'
  },
  {
    title: 'Web Development Project Showcase',
    type: 'academic',
    priority: 'medium',
    course: 'Web Development',
    courseCode: 'CS-350',
    instructor: 'Prof. Johnson',
    content: 'Join us for the Web Development project showcase on February 10th at 6:00 PM in the Computer Science Building. Pizza and refreshments will be provided!',
    isPinned: false,
    attachments: ['showcase_flyer.pdf', 'project_guidelines.pdf'],
    authorId: 'faculty-003',
    authorName: 'Prof. Johnson',
    targetAudience: 'specific_course',
    courseId: 'cs-350-spring-2024'
  },
  {
    title: 'Campus WiFi Maintenance Scheduled',
    type: 'technical',
    priority: 'medium',
    course: 'General',
    courseCode: 'ALL',
    instructor: 'IT Services',
    content: 'Scheduled maintenance for campus WiFi will occur on January 22nd from 2:00 AM to 6:00 AM. Some services may be temporarily unavailable during this time.',
    isPinned: false,
    attachments: [],
    authorId: 'it-001',
    authorName: 'IT Services',
    targetAudience: 'all'
  },
  {
    title: 'Career Fair - Spring 2024',
    type: 'general',
    priority: 'high',
    course: 'General',
    courseCode: 'ALL',
    instructor: 'Career Services',
    content: 'The Spring 2024 Career Fair will be held on March 15th from 10:00 AM to 3:00 PM in the Student Union. Over 50 companies will be attending. Dress professionally and bring copies of your resume!',
    isPinned: true,
    attachments: ['career_fair_companies.pdf', 'resume_tips.pdf'],
    authorId: 'career-001',
    authorName: 'Career Services',
    targetAudience: 'students'
  }
];

// Function to add sample announcements to Firestore (for testing)
export const addSampleAnnouncements = async () => {
  try {
    const announcementsRef = collection(db, 'announcements');
    
    for (const announcement of sampleAnnouncements) {
      await addDoc(announcementsRef, {
        ...announcement,
        createdAt: serverTimestamp(),
        readBy: [],
        updatedAt: serverTimestamp()
      });
    }
    
    console.log('Sample announcements added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding sample announcements:', error);
    return false;
  }
};

// Function to check if announcements exist
export const checkAnnouncementsExist = async () => {
  try {
    const { getDocs, collection } = await import('firebase/firestore');
    const announcementsRef = collection(db, 'announcements');
    const querySnapshot = await getDocs(announcementsRef);
    return querySnapshot.size > 0;
  } catch (error) {
    console.error('Error checking announcements:', error);
    return false;
  }
};
