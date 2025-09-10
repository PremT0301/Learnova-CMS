import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Clock, Award, TrendingUp, Calendar, Users } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Enrolled Courses',
      value: '5',
      change: 'This semester',
      icon: BookOpen,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'Current GPA',
      value: '3.7',
      change: '+0.2 this term',
      icon: Award,
      color: 'text-success',
      bg: 'bg-success/10'
    },
    {
      title: 'Pending Tasks',
      value: '8',
      change: 'Due this week',
      icon: Clock,
      color: 'text-warning',
      bg: 'bg-warning/10'
    },
    {
      title: 'Progress',
      value: '78%',
      change: 'Course completion',
      icon: TrendingUp,
      color: 'text-accent',
      bg: 'bg-accent/10'
    }
  ];

  const enrolledCourses = [
    {
      id: '1',
      title: 'Data Structures & Algorithms',
      code: 'CS-301',
      instructor: 'Prof. Chen',
      progress: 85,
      grade: 'A-',
      nextClass: 'Tomorrow, 10:00 AM'
    },
    {
      id: '2',
      title: 'Database Management Systems',
      code: 'CS-401',
      instructor: 'Dr. Smith',
      progress: 72,
      grade: 'B+',
      nextClass: 'Today, 2:00 PM'
    },
    {
      id: '3',
      title: 'Web Development',
      code: 'CS-350',
      instructor: 'Prof. Johnson',
      progress: 90,
      grade: 'A',
      nextClass: 'Friday, 1:00 PM'
    }
  ];

  const upcomingAssignments = [
    { 
      title: 'Binary Tree Implementation',
      course: 'CS-301',
      dueDate: '2024-01-20',
      status: 'pending'
    },
    { 
      title: 'Database Design Project',
      course: 'CS-401',
      dueDate: '2024-01-22',
      status: 'pending'
    },
    { 
      title: 'React Portfolio',
      course: 'CS-350',
      dueDate: '2024-01-25',
      status: 'in-progress'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Student Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}! Here's your academic overview.</p>
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
        {/* Enrolled Courses */}
        <Card className="card-academic p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Courses</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-4">
            {enrolledCourses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">{course.code} • {course.instructor}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp size={14} />
                      <span>{course.progress}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Award size={14} />
                      <span>{course.grade}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Next class:</p>
                  <p className="text-sm font-medium">{course.nextClass}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Assignments */}
        <Card className="card-academic p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Upcoming Assignments</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-3">
            {upcomingAssignments.map((assignment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <h3 className="font-medium">{assignment.title}</h3>
                  <p className="text-sm text-muted-foreground">{assignment.course}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{assignment.dueDate}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    assignment.status === 'pending' 
                      ? 'bg-warning/20 text-warning' 
                      : 'bg-primary/20 text-primary'
                  }`}>
                    {assignment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="card-academic p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="p-2 bg-success/20 rounded-full">
              <Award className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="font-medium">Assignment submitted: Binary Tree Implementation</p>
              <p className="text-sm text-muted-foreground">CS-301 • 2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="p-2 bg-primary/20 rounded-full">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Enrolled in: Machine Learning Introduction</p>
              <p className="text-sm text-muted-foreground">CS-450 • 1 day ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="p-2 bg-warning/20 rounded-full">
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="font-medium">Assignment due: Database Design Project</p>
              <p className="text-sm text-muted-foreground">CS-401 • Due in 2 days</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
