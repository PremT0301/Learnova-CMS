import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Users, FileText, BarChart3, Calendar, Award, Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  listenCoursesByInstructor, 
  listenAssignmentsByCourse,
  listenAnnouncementsByRole,
  Course,
  Assignment,
  AnnouncementDoc
} from '@/services/firebaseService';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementDoc[]>([]);

  // Real-time Firebase listeners
  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    let unsubscribeCourses: (() => void) | undefined;
    let unsubscribeAnnouncements: (() => void) | undefined;

    const initializeRealTimeData = () => {
      // Listen to courses taught by this faculty
      unsubscribeCourses = listenCoursesByInstructor(user.id, (coursesData) => {
        setCourses(coursesData);
        setLoading(false);
      });

      // Listen to announcements visible to faculty
      unsubscribeAnnouncements = listenAnnouncementsByRole('faculty', (announcementsData) => {
        setAnnouncements(announcementsData);
      });
    };

    initializeRealTimeData();

    // Cleanup listeners on unmount
    return () => {
      if (unsubscribeCourses) unsubscribeCourses();
      if (unsubscribeAnnouncements) unsubscribeAnnouncements();
    };
  }, [user?.id]);

  // Computed analytics
  const analytics = React.useMemo(() => {
    const totalStudents = courses.reduce((sum, course) => sum + (course.enrolled || 0), 0);
    const totalCourses = courses.length;
    const totalAssignments = assignments.length;
    const activeAssignments = assignments.filter(a => a.status === 'published').length;
    const completedAssignments = assignments.filter(a => a.status === 'completed').length;
    const totalAnnouncements = announcements.length;

    return {
      totalStudents,
      totalCourses,
      totalAssignments,
      activeAssignments,
      completedAssignments,
      totalAnnouncements
    };
  }, [courses, assignments, announcements]);

  // Upcoming deadlines (assignments due soon)
  const upcomingDeadlines = React.useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return assignments
      .filter(assignment => {
        const dueDate = new Date(assignment.dueDate);
        return dueDate >= now && dueDate <= nextWeek && assignment.status === 'published';
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [assignments]);

  const stats = [
    {
      title: 'My Courses',
      value: analytics.totalCourses.toString(),
      change: 'Active this semester',
      icon: BookOpen,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'Total Students',
      value: analytics.totalStudents.toString(),
      change: 'Across all courses',
      icon: Users,
      color: 'text-success',
      bg: 'bg-success/10'
    },
    {
      title: 'Active Assignments',
      value: analytics.activeAssignments.toString(),
      change: 'Assignments to review',
      icon: FileText,
      color: 'text-warning',
      bg: 'bg-warning/10'
    },
    {
      title: 'Announcements',
      value: analytics.totalAnnouncements.toString(),
      change: 'Visible to faculty',
      icon: Award,
      color: 'text-accent',
      bg: 'bg-accent/10'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Faculty Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}! Here's your teaching overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="card-academic p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <Card className="card-academic p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Courses</h2>
            <Button variant="outline" size="sm">Manage Courses</Button>
          </div>
          <div className="space-y-4">
            {courses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="text-muted-foreground mx-auto mb-4" size={48} />
                <p className="text-lg font-medium mb-2">No courses yet</p>
                <p className="text-muted-foreground">Create your first course to get started</p>
              </div>
            ) : (
              courses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{course.title}</h3>
                    <p className="text-sm text-muted-foreground">{course.code}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-sm">
                        <Users size={14} />
                        <span>{course.enrolled || 0} students</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <FileText size={14} />
                        <span>{course.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                      {course.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="card-academic p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Upcoming Deadlines</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="text-muted-foreground mx-auto mb-4" size={48} />
                <p className="text-lg font-medium mb-2">No upcoming deadlines</p>
                <p className="text-muted-foreground">All assignments are up to date</p>
              </div>
            ) : (
              upcomingDeadlines.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <h3 className="font-medium">{assignment.title}</h3>
                    <p className="text-sm text-muted-foreground">{assignment.courseId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{new Date(assignment.dueDate).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">Due soon</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="card-academic p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button variant="outline" className="justify-start">
            <BookOpen className="mr-2" size={18} />
            Create Assignment
          </Button>
          <Button variant="outline" className="justify-start">
            <Users className="mr-2" size={18} />
            View Students
          </Button>
          <Button variant="outline" className="justify-start">
            <BarChart3 className="mr-2" size={18} />
            Gradebook
          </Button>
          <Button variant="outline" className="justify-start">
            <Calendar className="mr-2" size={18} />
            Schedule
          </Button>
        </div>
      </Card>

      {/* Recent Announcements */}
      <Card className="card-academic p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Announcements</h2>
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <Award className="text-muted-foreground mx-auto mb-4" size={48} />
              <p className="text-lg font-medium mb-2">No announcements</p>
              <p className="text-muted-foreground">Check back later for updates</p>
            </div>
          ) : (
            announcements.slice(0, 3).map((announcement) => (
              <div key={announcement.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className={`p-2 rounded-full ${
                  announcement.priority === 'high' ? 'bg-red-100' :
                  announcement.priority === 'medium' ? 'bg-yellow-100' :
                  'bg-green-100'
                }`}>
                  <AlertCircle className={`w-4 h-4 ${
                    announcement.priority === 'high' ? 'text-red-600' :
                    announcement.priority === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{announcement.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {announcement.description.length > 100 
                      ? `${announcement.description.substring(0, 100)}...` 
                      : announcement.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    By {announcement.createdByName} • {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={
                  announcement.priority === 'high' ? 'destructive' :
                  announcement.priority === 'medium' ? 'default' : 'secondary'
                }>
                  {announcement.priority}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
