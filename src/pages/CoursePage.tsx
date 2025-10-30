import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  BookOpen, 
  Megaphone,
  FileText,
  Users,
  Upload,
  Plus,
  Calendar,
  Clock,
  User,
  Mail,
  Hash,
  Download,
  Link as LinkIcon,
  Pin,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  addDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Course, CourseMaterial, CourseAnnouncement, Assignment } from '@/types';
import AnnouncementsTab from '@/components/course/AnnouncementsTab';
import MaterialsTab from '@/components/course/MaterialsTab';
import AssignmentsTab from '@/components/course/AssignmentsTab';

interface StudentEnrollment {
  id: string;
  name: string;
  email: string;
  department?: string;
  rollNumber?: string;
}

interface CourseData extends Course {
  studentsEnrolled?: string[];
}

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [departmentName, setDepartmentName] = useState<string>('');
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [announcements, setAnnouncements] = useState<CourseAnnouncement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const isFaculty = user?.role === 'faculty';
  const isInstructor = course?.instructorId === user?.id;

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    if (!courseId) return;

    setLoading(true);
    try {
      // Fetch course details
      const courseRef = doc(db, 'courses', courseId);
      const courseSnap = await getDoc(courseRef);

      if (!courseSnap.exists()) {
        toast({
          title: 'Error',
          description: 'Course not found',
          variant: 'destructive',
        });
        navigate('/courses');
        return;
      }

      const courseData = { id: courseSnap.id, ...courseSnap.data() } as CourseData;
      setCourse(courseData);

      // Fetch department name
      if (courseData.department) {
        const deptRef = doc(db, 'departments', courseData.department);
        const deptSnap = await getDoc(deptRef);
        if (deptSnap.exists()) {
          setDepartmentName(deptSnap.data().name || deptSnap.data().code || '');
        }
      }

      // Fetch enrolled students
      if (courseData.studentsEnrolled && courseData.studentsEnrolled.length > 0) {
        const studentsData: StudentEnrollment[] = [];
        for (const studentId of courseData.studentsEnrolled) {
          const studentRef = doc(db, 'users', studentId);
          const studentSnap = await getDoc(studentRef);
          if (studentSnap.exists()) {
            const studentData = studentSnap.data();
            studentsData.push({
              id: studentSnap.id,
              name: studentData.name || 'Unknown',
              email: studentData.email || '',
              department: studentData.department || '',
              rollNumber: studentData.rollNumber || studentData.studentId || studentSnap.id.substring(0, 8).toUpperCase(),
            });
          }
        }
        setStudents(studentsData);
      }

      // Fetch course materials
      await loadMaterials();

      // Fetch course announcements
      await loadAnnouncements();

      // Fetch course assignments
      await loadAssignments();

    } catch (error) {
      console.error('Error loading course data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    if (!courseId) return;
    try {
      const materialsRef = collection(db, 'course_materials');
      const q = query(
        materialsRef,
        where('courseId', '==', courseId),
        orderBy('uploadedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const materialsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CourseMaterial[];
      setMaterials(materialsData);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const loadAnnouncements = async () => {
    if (!courseId) return;
    try {
      const announcementsRef = collection(db, 'course_announcements');
      const q = query(
        announcementsRef,
        where('courseId', '==', courseId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const announcementsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CourseAnnouncement[];
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const loadAssignments = async () => {
    if (!courseId) return;
    try {
      const assignmentsRef = collection(db, 'assignments');
      const q = query(
        assignmentsRef,
        where('courseId', '==', courseId),
        orderBy('dueDate', 'asc')
      );
      const snapshot = await getDocs(q);
      const assignmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Assignment[];
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/courses')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Courses
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{course.title}</h1>
              <div className="flex items-center gap-3">
                <Badge variant="default">{course.code}</Badge>
                <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                  {course.status}
                </Badge>
                <span className="text-muted-foreground">{departmentName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">
              <BookOpen className="mr-2" size={16} />
              Overview
            </TabsTrigger>
            <TabsTrigger value="announcements">
              <Megaphone className="mr-2" size={16} />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="materials">
              <FileText className="mr-2" size={16} />
              Materials
            </TabsTrigger>
            <TabsTrigger value="assignments">
              <FileText className="mr-2" size={16} />
              Assignments
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Course Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Instructor</p>
                    <p className="font-medium">{course.instructor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Credits</p>
                    <p className="font-medium">{course.credits} Credit Hours</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Enrollment</p>
                    <p className="font-medium">{course.enrolled} / {course.capacity} Students</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-foreground">{course.description}</p>
                </div>
              </Card>

              {/* Participants */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users size={20} />
                  Participants ({students.length} Students)
                </h2>
                <div className="space-y-2">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      <Badge variant="outline">{student.rollNumber}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <AnnouncementsTab
              courseId={courseId || ''}
              announcements={announcements}
              onRefresh={loadAnnouncements}
              isInstructor={isInstructor}
            />
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <MaterialsTab
              courseId={courseId || ''}
              materials={materials}
              onRefresh={loadMaterials}
              isInstructor={isInstructor}
            />
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            <AssignmentsTab
              courseId={courseId || ''}
              assignments={assignments}
              onRefresh={loadAssignments}
              isInstructor={isInstructor}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

