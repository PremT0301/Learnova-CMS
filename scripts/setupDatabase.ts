/**
 * Database Setup Script
 *
 * This script will:
 * 1. Remove all existing sample data
 * 2. Add 3 departments (CSE, CE, IT)
 * 3. Add 3 courses with proper assignments
 * 4. Enroll all students in all courses
 *
 * Run with: npm run setup-db
 */

import * as dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  query,
  where,
  updateDoc,
  writeBatch,
  arrayUnion
} from 'firebase/firestore';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections to clean (excluding users and faculty_requests)
const COLLECTIONS_TO_CLEAN = [
  'courses',
  'assignments',
  'submissions',
  'announcements',
  'enrollments',
  'notifications',
  'departments',
  'grades',
  'attendance'
];

// Department data
const DEPARTMENTS = [
  { name: 'Computer Science and Engineering', code: 'CSE', active: true },
  { name: 'Civil Engineering', code: 'CE', active: true },
  { name: 'Information Technology', code: 'IT', active: true }
];

// Course data template
const COURSES = [
  {
    title: 'DATA SCIENCE',
    code: 'CSE001',
    department: 'CSE',
    description: 'Introduction to Data Science covering data analysis, visualization, and machine learning fundamentals.',
    credits: 4,
    capacity: 50,
    startDate: '2025-01-15',
    endDate: '2025-05-15',
    status: 'active' as const
  },
  {
    title: 'MACHINE LEARNING',
    code: 'CE001',
    department: 'CE',
    description: 'Comprehensive course on Machine Learning algorithms, neural networks, and practical applications.',
    credits: 4,
    capacity: 50,
    startDate: '2025-01-15',
    endDate: '2025-05-15',
    status: 'active' as const
  },
  {
    title: 'FULL STACK DEVELOPMENT',
    code: 'IT001',
    department: 'IT',
    description: 'Complete full stack web development course covering frontend, backend, and database technologies.',
    credits: 4,
    capacity: 50,
    startDate: '2025-01-15',
    endDate: '2025-05-15',
    status: 'active' as const
  }
];

async function cleanCollection(collectionName: string) {
  console.log(`🧹 Cleaning collection: ${collectionName}`);
  const snapshot = await getDocs(collection(db, collectionName));
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  console.log(`✅ Deleted ${snapshot.size} documents from ${collectionName}`);
}

async function getUsers() {
  console.log('📋 Fetching users...');
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const students = users.filter(u => u.role === 'student');
  const faculty = users.filter(u => u.role === 'faculty');
  const admin = users.filter(u => u.role === 'admin');
  
  console.log(`Found ${students.length} students, ${faculty.length} faculty, ${admin.length} admin`);
  
  return { students, faculty, admin, all: users };
}

async function createDepartments() {
  console.log('\n🏢 Creating departments...');
  const departmentIds: Record<string, string> = {};
  
  for (const dept of DEPARTMENTS) {
    const docRef = await addDoc(collection(db, 'departments'), {
      ...dept,
      createdAt: new Date().toISOString()
    });
    departmentIds[dept.code] = docRef.id;
    console.log(`✅ Created department: ${dept.name} (${dept.code})`);
  }
  
  return departmentIds;
}

async function createCourses(faculty: any[], students: any[]) {
  console.log('\n📚 Creating courses...');
  
  if (faculty.length < 3) {
    throw new Error(`Need at least 3 faculty members, found ${faculty.length}`);
  }
  
  if (students.length < 3) {
    throw new Error(`Need at least 3 students, found ${students.length}`);
  }
  
  const courseIds: string[] = [];
  
  for (let i = 0; i < COURSES.length; i++) {
    const courseData = COURSES[i];
    const assignedFaculty = faculty[i];
    
    // Get all student IDs for enrollment
    const studentIds = students.map(s => s.id);
    
    const course = {
      ...courseData,
      instructor: assignedFaculty.name,
      instructorId: assignedFaculty.id,
      enrolled: students.length,
      studentsEnrolled: studentIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'courses'), course);
    courseIds.push(docRef.id);
    
    console.log(`✅ Created course: ${courseData.title} (${courseData.code})`);
    console.log(`   Instructor: ${assignedFaculty.name} (${assignedFaculty.email})`);
    console.log(`   Enrolled: ${students.length} students`);
  }
  
  return courseIds;
}

async function updateUserDepartments(faculty: any[]) {
  console.log('\n👥 Updating faculty departments...');
  
  const departments = ['CSE', 'CE', 'IT'];
  
  for (let i = 0; i < Math.min(faculty.length, 3); i++) {
    const facultyMember = faculty[i];
    const department = departments[i];
    
    await updateDoc(doc(db, 'users', facultyMember.id), {
      department: department,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`✅ Updated ${facultyMember.name} - Department: ${department}`);
  }
}

async function main() {
  console.log('🚀 Starting database setup...\n');
  
  try {
    // Step 1: Clean existing data
    console.log('📦 STEP 1: Cleaning existing data');
    console.log('='.repeat(50));
    for (const collectionName of COLLECTIONS_TO_CLEAN) {
      await cleanCollection(collectionName);
    }
    
    // Step 2: Get users
    console.log('\n📦 STEP 2: Fetching users');
    console.log('='.repeat(50));
    const { students, faculty, admin } = await getUsers();
    
    if (students.length !== 3) {
      console.warn(`⚠️  Warning: Expected 3 students, found ${students.length}`);
    }
    if (faculty.length !== 3) {
      console.warn(`⚠️  Warning: Expected 3 faculty, found ${faculty.length}`);
    }
    if (admin.length !== 1) {
      console.warn(`⚠️  Warning: Expected 1 admin, found ${admin.length}`);
    }
    
    // Step 3: Create departments
    console.log('\n📦 STEP 3: Creating departments');
    console.log('='.repeat(50));
    await createDepartments();
    
    // Step 4: Update faculty departments
    console.log('\n📦 STEP 4: Assigning departments to faculty');
    console.log('='.repeat(50));
    await updateUserDepartments(faculty);
    
    // Step 5: Create courses with enrollments
    console.log('\n📦 STEP 5: Creating courses and enrolling students');
    console.log('='.repeat(50));
    await createCourses(faculty, students);
    
    console.log('\n' + '='.repeat(50));
    console.log('✨ Database setup completed successfully!');
    console.log('='.repeat(50));
    console.log('\n📊 Summary:');
    console.log(`   • Departments: 3 (CSE, CE, IT)`);
    console.log(`   • Courses: 3 (DATA SCIENCE, MACHINE LEARNING, FULL STACK DEVELOPMENT)`);
    console.log(`   • Faculty assigned: 3 (one per course)`);
    console.log(`   • Students enrolled: ${students.length} (all enrolled in all courses)`);
    console.log(`   • Total users: ${students.length + faculty.length + admin.length}`);
    
  } catch (error) {
    console.error('\n❌ Error during setup:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
main();

