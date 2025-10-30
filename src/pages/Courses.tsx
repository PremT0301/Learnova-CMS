import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Users, Calendar, Star, BookOpen, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  listenCourses, 
  listenCoursesByInstructor, 
  listenCoursesByStudent,
  createCourse,
  updateCourse,
  enrollStudentInCourse,
  Course
} from '@/services/firebaseService';

export default function Courses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  // Real-time Firebase listeners
  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    let unsubscribe: (() => void) | undefined;

    const initializeRealTimeData = () => {
      if (user.role === 'faculty') {
        // Faculty sees their own courses
        unsubscribe = listenCoursesByInstructor(user.id, (coursesData) => {
          setCourses(coursesData);
          setLoading(false);
        });
      } else if (user.role === 'student') {
        // Students see courses they're enrolled in
        unsubscribe = listenCoursesByStudent(user.id, (coursesData) => {
          setCourses(coursesData);
          setLoading(false);
        });
      } else {
        // Admin sees all courses
        unsubscribe = listenCourses((coursesData) => {
          setCourses(coursesData);
          setLoading(false);
        });
      }
    };

    initializeRealTimeData();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id, user?.role]);

  const isEnrolled = (course: Course) => {
    if (!user?.id || user.role !== 'student') return false;
    // Check if the course has studentsEnrolled array and if user is in it
    const courseData = course as any;
    return courseData.studentsEnrolled?.includes(user.id) || false;
  };

  const handleEnroll = async (courseId: string) => {
    if (!user?.id) return;

    setEnrolling(courseId);
    try {
      const result = await enrollStudentInCourse(courseId, user.id);
      if (result.success) {
        toast({
          title: 'Enrollment Successful',
          description: 'You have been enrolled in this course',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Enrollment Failed',
          description: result.error || 'Failed to enroll in course',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast({
        title: 'Enrollment Failed',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setEnrolling(null);
    }
  };

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateCourse = user?.role === 'admin' || user?.role === 'faculty';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Courses</h1>
          <p className="text-muted-foreground mt-1">Explore and manage course offerings</p>
        </div>
        {canCreateCourse && (
          <Button className="btn-primary shadow-md hover:shadow-lg transition-shadow">
            <Plus size={20} className="mr-2" />
            Create Course
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="card-academic p-4 shadow-sm border-border/50">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses, instructors, or course codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 border-border/50 focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-border/50 hover:bg-accent/10">All Departments</Button>
            <Button variant="outline" className="border-border/50 hover:bg-accent/10">Active Courses</Button>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-academic p-5 shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <BookOpen className="text-primary" size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Courses</p>
              <p className="text-2xl font-bold mt-1">{courses.length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-5 shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <TrendingUp className="text-success" size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Courses</p>
              <p className="text-2xl font-bold mt-1">{courses.filter(c => c.status === 'active').length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-5 shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <Users className="text-warning" size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Enrollments</p>
              <p className="text-2xl font-bold mt-1">{courses.reduce((sum, c) => sum + (c.enrolled || 0), 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-5 shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/10">
              <Clock className="text-accent" size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">This Semester</p>
              <p className="text-2xl font-bold mt-1">{courses.filter(c => c.status === 'active').length}</p>
            </div>
          </div>
        </Card>
      </div>

      {loading ? (
        <Card className="card-academic p-12 text-center shadow-sm">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Loading courses...</p>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <Card className="card-academic p-12 text-center shadow-sm">
          <BookOpen className="text-muted-foreground mx-auto mb-4" size={48} />
          <p className="text-lg font-medium mb-2">No courses found</p>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms' : 'No courses have been created yet'}
          </p>
        </Card>
      ) : (
        /* Courses Grid */
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="card-academic card-hover overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border-border/50">
              <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/10 to-accent/15">
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="text-primary/40" size={56} />
                </div>
                <div className="absolute top-3 right-3">
                  <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                    <span className="text-sm font-semibold text-foreground">{course.code}</span>
                  </div>
                </div>
                <div className="absolute top-3 left-3">
                  <Badge
                    variant={course.status === 'active' ? 'default' : 'secondary'}
                    className="shadow-sm"
                  >
                    {course.status}
                  </Badge>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1">{course.title}</h3>
                    <p className="text-muted-foreground text-sm truncate">{course.instructor}</p>
                  </div>
                  <div className="flex items-center gap-1 text-warning ml-2 flex-shrink-0">
                    <Star size={16} fill="currentColor" />
                    <span className="text-sm font-semibold">4.8</span>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users size={15} />
                      <span className="font-medium">{course.enrolled || 0}/{course.capacity || 0} enrolled</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar size={15} />
                      <span className="font-medium">{course.credits} credits</span>
                    </div>
                  </div>

                  <div className="progress-academic h-2 rounded-full">
                    <div
                      className="progress-fill h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(course.capacity ? ((course.enrolled || 0) / course.capacity) * 100 : 0)}%` }}
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    {user?.role === 'student' ? (
                      <>
                        {isEnrolled(course) ? (
                          <Button
                            className="flex-1 btn-primary shadow-sm hover:shadow-md transition-shadow"
                            onClick={() => navigate(`/course/${course.id}`)}
                          >
                            <BookOpen className="mr-2" size={16} />
                            Open Course
                          </Button>
                        ) : (
                          <Button
                            className="flex-1 btn-primary shadow-sm hover:shadow-md transition-shadow"
                            onClick={() => handleEnroll(course.id)}
                            disabled={enrolling === course.id}
                          >
                            {enrolling === course.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              'Enroll Now'
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="shadow-sm hover:shadow-md transition-shadow"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          View Details
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          className="flex-1 btn-primary shadow-sm hover:shadow-md transition-shadow"
                          onClick={() => navigate(`/course/${course.id}`)}
                        >
                          <BookOpen className="mr-2" size={16} />
                          Open Course
                        </Button>
                        <Button
                          variant="outline"
                          className="shadow-sm hover:shadow-md transition-shadow"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          View Details
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-shadow">
                      <Star size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}