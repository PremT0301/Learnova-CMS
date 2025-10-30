import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  Calendar, 
  Clock,
  GraduationCap,
  MapPin,
  User,
  Mail,
  Hash,
  Building2,
  Award,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Course } from '@/types';

interface StudentEnrollment {
  id: string;
  name: string;
  email: string;
  department?: string;
  enrolledAt?: string;
  rollNumber?: string;
}

interface CourseDetailsData extends Course {
  schedule?: {
    days?: string[];
    time?: string;
    room?: string;
    building?: string;
  };
  syllabus?: string;
  prerequisites?: string[];
  studentsEnrolled?: string[];
}

export default function CourseDetails() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseDetailsData | null>(null);
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [instructorDetails, setInstructorDetails] = useState<any>(null);
  const [departmentName, setDepartmentName] = useState<string>('');

  useEffect(() => {
    if (courseId) {
      loadCourseDetails();
    }
  }, [courseId]);

  const loadCourseDetails = async () => {
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
          variant: 'destructive'
        });
        navigate('/courses');
        return;
      }

      const courseData = { id: courseSnap.id, ...courseSnap.data() } as CourseDetailsData;
      setCourse(courseData);

      // Fetch department name
      if (courseData.department) {
        const deptRef = doc(db, 'departments', courseData.department);
        const deptSnap = await getDoc(deptRef);
        if (deptSnap.exists()) {
          setDepartmentName(deptSnap.data().name || courseData.department);
        } else {
          setDepartmentName(courseData.department);
        }
      }

      // Fetch instructor details
      if (courseData.instructorId) {
        const instructorRef = doc(db, 'users', courseData.instructorId);
        const instructorSnap = await getDoc(instructorRef);
        if (instructorSnap.exists()) {
          setInstructorDetails({ id: instructorSnap.id, ...instructorSnap.data() });
        }
      }

      // Fetch enrolled students
      if (courseData.studentsEnrolled && courseData.studentsEnrolled.length > 0) {
        const enrolledStudents: StudentEnrollment[] = [];
        
        for (const studentId of courseData.studentsEnrolled) {
          const studentRef = doc(db, 'users', studentId);
          const studentSnap = await getDoc(studentRef);
          
          if (studentSnap.exists()) {
            const studentData = studentSnap.data();
            enrolledStudents.push({
              id: studentSnap.id,
              name: studentData.name || 'Unknown',
              email: studentData.email || '',
              department: studentData.department || '',
              rollNumber: studentData.rollNumber || studentData.studentId || studentSnap.id.substring(0, 8).toUpperCase()
            });
          }
        }
        
        setStudents(enrolledStudents);
      }
    } catch (error) {
      console.error('Error loading course details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Card className="card-academic p-12 text-center shadow-sm">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Loading course details...</p>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-6 p-6">
        <Card className="card-academic p-12 text-center shadow-sm">
          <BookOpen className="text-muted-foreground mx-auto mb-4" size={48} />
          <p className="text-lg font-medium mb-2">Course not found</p>
          <Button onClick={() => navigate('/courses')} className="mt-4">
            <ArrowLeft className="mr-2" size={16} />
            Back to Courses
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/courses')}
          className="shadow-sm hover:shadow-md transition-shadow"
        >
          <ArrowLeft className="mr-2" size={16} />
          Back to Courses
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gradient-primary">{course.title}</h1>
          <p className="text-muted-foreground mt-1">Complete course information and enrolled students</p>
        </div>
      </div>

      {/* Course Overview Card */}
      <Card className="card-academic p-6 shadow-md">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-primary/10">
              <BookOpen className="text-primary" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{course.title}</h2>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="default" className="text-sm px-3 py-1">
                  {course.code}
                </Badge>
                <Badge 
                  variant={course.status === 'active' ? 'default' : 'secondary'}
                  className="text-sm px-3 py-1"
                >
                  {course.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="text-primary mt-1" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-semibold text-foreground">{departmentName || course.department}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <GraduationCap className="text-primary mt-1" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">Instructor</p>
                <p className="font-semibold text-foreground">{course.instructor}</p>
                {instructorDetails?.email && (
                  <p className="text-sm text-muted-foreground">{instructorDetails.email}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Award className="text-primary mt-1" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">Credits</p>
                <p className="font-semibold text-foreground">{course.credits} Credit Hours</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="text-primary mt-1" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold text-foreground">
                  {formatDate(course.startDate)} - {formatDate(course.endDate)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="text-primary mt-1" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">Enrollment</p>
                <p className="font-semibold text-foreground">
                  {course.enrolled} / {course.capacity} Students
                </p>
              </div>
            </div>

            {course.schedule && (
              <div className="flex items-start gap-3">
                <Clock className="text-primary mt-1" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Schedule</p>
                  <p className="font-semibold text-foreground">
                    {course.schedule.days?.join(', ') || 'Not specified'}
                  </p>
                  {course.schedule.time && (
                    <p className="text-sm text-muted-foreground">{course.schedule.time}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {course.description && (
          <div className="mt-6 pt-6 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="text-primary" size={20} />
              <h3 className="font-semibold text-foreground">Course Description</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">{course.description}</p>
          </div>
        )}

        {/* Schedule Details */}
        {course.schedule?.room && (
          <div className="mt-6 pt-6 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="text-primary" size={20} />
              <h3 className="font-semibold text-foreground">Location</h3>
            </div>
            <p className="text-muted-foreground">
              {course.schedule.room}
              {course.schedule.building && `, ${course.schedule.building}`}
            </p>
          </div>
        )}
      </Card>

      {/* Enrolled Students Card */}
      <Card className="card-academic p-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10">
              <Users className="text-success" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Enrolled Students</h2>
              <p className="text-sm text-muted-foreground">
                {students.length} {students.length === 1 ? 'student' : 'students'} enrolled in this course
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {students.length}
          </Badge>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12">
            <Users className="text-muted-foreground mx-auto mb-4" size={48} />
            <p className="text-lg font-medium mb-2">No students enrolled yet</p>
            <p className="text-muted-foreground">Students will appear here once they enroll in this course</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Hash size={16} />
                      Roll Number
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      Student Name
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      Email
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} />
                      Department
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr
                    key={student.id}
                    className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {index + 1}
                        </div>
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {student.rollNumber}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-semibold text-foreground">{student.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">{student.email}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="font-normal">
                        {student.department || 'N/A'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Additional Information */}
      {(course.prerequisites && course.prerequisites.length > 0) && (
        <Card className="card-academic p-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <Award className="text-warning" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Prerequisites</h2>
              <p className="text-sm text-muted-foreground">Required courses before enrollment</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {course.prerequisites.map((prereq, index) => (
              <Badge key={index} variant="secondary" className="px-3 py-1.5 text-sm">
                {prereq}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

