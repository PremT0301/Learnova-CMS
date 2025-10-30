import React, { useEffect, useState } from 'react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Courses</h1>
          <p className="text-muted-foreground">Explore and manage course offerings</p>
        </div>
        {canCreateCourse && (
          <Button className="btn-primary">
            <Plus size={20} className="mr-2" />
            Create Course
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="card-academic p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses, instructors, or course codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">All Departments</Button>
            <Button variant="outline">Active Courses</Button>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="text-primary" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Courses</p>
              <p className="text-2xl font-bold">{courses.length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-success" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Active Courses</p>
              <p className="text-2xl font-bold">{courses.filter(c => c.status === 'active').length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Users className="text-warning" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Enrollments</p>
              <p className="text-2xl font-bold">{courses.reduce((sum, c) => sum + (c.enrolled || 0), 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Clock className="text-accent" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">This Semester</p>
              <p className="text-2xl font-bold">{courses.filter(c => c.status === 'active').length}</p>
            </div>
          </div>
        </Card>
      </div>

      {loading ? (
        <Card className="card-academic p-12 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Loading courses...</p>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <Card className="card-academic p-12 text-center">
          <BookOpen className="text-muted-foreground mx-auto mb-4" size={48} />
          <p className="text-lg font-medium mb-2">No courses found</p>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms' : 'No courses have been created yet'}
          </p>
        </Card>
      ) : (
        /* Courses Grid */
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="card-academic card-hover overflow-hidden">
              <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="text-primary/50" size={48} />
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-medium">
                  {course.code}
                </div>
                <div className="absolute top-4 left-4">
                  <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                    {course.status}
                  </Badge>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-1">{course.title}</h3>
                    <p className="text-muted-foreground text-sm">{course.instructor}</p>
                  </div>
                  <div className="flex items-center gap-1 text-warning">
                    <Star size={16} fill="currentColor" />
                    <span className="text-sm font-medium">4.8</span>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users size={16} />
                      <span>{course.enrolled || 0}/{course.capacity || 0} enrolled</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar size={16} />
                      <span>{course.credits} credits</span>
                    </div>
                  </div>

                  <div className="progress-academic">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(course.capacity ? ((course.enrolled || 0) / course.capacity) * 100 : 0)}%` }} 
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    {user?.role === 'student' ? (
                      <Button 
                        className="flex-1 btn-primary"
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrolling === course.id}
                      >
                        {enrolling === course.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Enroll Now'
                        )}
                      </Button>
                    ) : (
                      <Button className="flex-1" variant="outline">
                        View Details
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
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