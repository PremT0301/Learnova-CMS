import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  addDoc,
  updateDoc,
  doc,
  writeBatch
} from 'firebase/firestore';
import { Database, Trash2, Plus, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

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

export default function DatabaseSetup() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const cleanCollection = async (collectionName: string) => {
    addLog(`🧹 Cleaning collection: ${collectionName}`);
    const snapshot = await getDocs(collection(db, collectionName));
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    addLog(`✅ Deleted ${snapshot.size} documents from ${collectionName}`);
  };

  const getUsers = async () => {
    addLog('📋 Fetching users...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const students = users.filter((u: any) => u.role === 'student');
    const faculty = users.filter((u: any) => u.role === 'faculty');
    const admin = users.filter((u: any) => u.role === 'admin');
    
    addLog(`Found ${students.length} students, ${faculty.length} faculty, ${admin.length} admin`);
    
    return { students, faculty, admin };
  };

  const createDepartments = async () => {
    addLog('🏢 Creating departments...');
    
    for (const dept of DEPARTMENTS) {
      await addDoc(collection(db, 'departments'), {
        ...dept,
        createdAt: new Date().toISOString()
      });
      addLog(`✅ Created department: ${dept.name} (${dept.code})`);
    }
  };

  const createCourses = async (faculty: any[], students: any[]) => {
    addLog('📚 Creating courses...');
    
    if (faculty.length < 3) {
      throw new Error(`Need at least 3 faculty members, found ${faculty.length}`);
    }
    
    if (students.length < 3) {
      throw new Error(`Need at least 3 students, found ${students.length}`);
    }
    
    for (let i = 0; i < COURSES.length; i++) {
      const courseData = COURSES[i];
      const assignedFaculty = faculty[i];
      
      // Get all student IDs for enrollment
      const studentIds = students.map((s: any) => s.id);
      
      const course = {
        ...courseData,
        instructor: assignedFaculty.name,
        instructorId: assignedFaculty.id,
        enrolled: students.length,
        studentsEnrolled: studentIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'courses'), course);
      
      addLog(`✅ Created course: ${courseData.title} (${courseData.code})`);
      addLog(`   Instructor: ${assignedFaculty.name}`);
      addLog(`   Enrolled: ${students.length} students`);
    }
  };

  const updateUserDepartments = async (faculty: any[]) => {
    addLog('👥 Updating faculty departments...');
    
    const departments = ['CSE', 'CE', 'IT'];
    
    for (let i = 0; i < Math.min(faculty.length, 3); i++) {
      const facultyMember = faculty[i];
      const department = departments[i];
      
      await updateDoc(doc(db, 'users', facultyMember.id), {
        department: department,
        updatedAt: new Date().toISOString()
      });
      
      addLog(`✅ Updated ${facultyMember.name} - Department: ${department}`);
    }
  };

  const handleSetup = async () => {
    if (!confirm('⚠️ This will DELETE all existing courses, assignments, announcements, and other data. Users will NOT be deleted. Are you sure?')) {
      return;
    }

    setLoading(true);
    setLogs([]);
    setCompleted(false);

    try {
      addLog('🚀 Starting database setup...');
      
      // Step 1: Clean existing data
      addLog('📦 STEP 1: Cleaning existing data');
      for (const collectionName of COLLECTIONS_TO_CLEAN) {
        await cleanCollection(collectionName);
      }
      
      // Step 2: Get users
      addLog('📦 STEP 2: Fetching users');
      const { students, faculty, admin } = await getUsers();
      
      if (students.length !== 3) {
        addLog(`⚠️  Warning: Expected 3 students, found ${students.length}`);
      }
      if (faculty.length !== 3) {
        addLog(`⚠️  Warning: Expected 3 faculty, found ${faculty.length}`);
      }
      if (admin.length !== 1) {
        addLog(`⚠️  Warning: Expected 1 admin, found ${admin.length}`);
      }
      
      // Step 3: Create departments
      addLog('📦 STEP 3: Creating departments');
      await createDepartments();
      
      // Step 4: Update faculty departments
      addLog('📦 STEP 4: Assigning departments to faculty');
      await updateUserDepartments(faculty);
      
      // Step 5: Create courses with enrollments
      addLog('📦 STEP 5: Creating courses and enrolling students');
      await createCourses(faculty, students);
      
      addLog('✨ Database setup completed successfully!');
      addLog(`📊 Summary:`);
      addLog(`   • Departments: 3 (CSE, CE, IT)`);
      addLog(`   • Courses: 3 (DATA SCIENCE, MACHINE LEARNING, FULL STACK DEVELOPMENT)`);
      addLog(`   • Faculty assigned: 3 (one per course)`);
      addLog(`   • Students enrolled: ${students.length} (all enrolled in all courses)`);
      
      setCompleted(true);
      
      toast({
        title: 'Success',
        description: 'Database setup completed successfully!',
      });
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      console.error('Setup error:', error);
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to setup database',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Database Setup</h1>
        <p className="text-muted-foreground">
          Clean and populate the database with fresh data
        </p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Warning:</strong> This will permanently delete all courses, assignments, submissions, 
          announcements, and other data. User accounts will NOT be deleted.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Setup Configuration
          </CardTitle>
          <CardDescription>
            This will set up the database with the following data:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Departments (3):</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>Computer Science and Engineering (CSE)</li>
              <li>Civil Engineering (CE)</li>
              <li>Information Technology (IT)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Courses (3):</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>DATA SCIENCE (CSE001) - Department: CSE</li>
              <li>MACHINE LEARNING (CE001) - Department: CE</li>
              <li>FULL STACK DEVELOPMENT (IT001) - Department: IT</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Enrollments:</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>All 3 students will be enrolled in all 3 courses</li>
              <li>Each course will be assigned to one faculty member</li>
            </ul>
          </div>

          <Button 
            onClick={handleSetup} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up database...
              </>
            ) : completed ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Setup Complete
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Start Database Setup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

