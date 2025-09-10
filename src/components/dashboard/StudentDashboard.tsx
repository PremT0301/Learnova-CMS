import React from 'react';
import { Card } from '@/components/ui/card';
import { BookOpen, Clock, Award, TrendingUp, Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function StudentDashboard() {
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
      dueDate: 'Today, 11:59 PM', 
      status: 'urgent',
      points: 100
    },
    { 
      title: 'Database Design Project', 
      course: 'CS-401', 
      dueDate: 'Tomorrow, 11:59 PM', 
      status: 'pending',
      points: 150
    },
    { 
      title: 'React Portfolio Website', 
      course: 'CS-350', 
      dueDate: 'Friday, 11:59 PM', 
      status: 'draft',
      points: 200
    },
  ];

  const recentGrades = [
    { assignment: 'Sorting Algorithms Quiz', course: 'CS-301', grade: 'A', points: '95/100' },
    { assignment: 'SQL Query Assignment', course: 'CS-401', grade: 'B+', points: '87/100' },
    { assignment: 'HTML/CSS Project', course: 'CS-350', grade: 'A-', points: '92/100' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient-primary mb-2">
          Welcome back, {user?.name}
        </h1>
        <p className="text-muted-foreground text-lg">
          Let's continue your learning journey. You're doing great!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid">
        {stats.map((stat, index) => (
          <Card key={index} className="card-academic card-hover p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                <p className="text-sm mt-1 text-muted-foreground">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon size={24} className={stat.color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <Card className="card-academic p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen size={20} className="text-primary" />
              <h3 className="text-lg font-semibold">My Courses</h3>
            </div>
            <button className="btn-primary px-4 py-2 text-sm">
              <Plus size={16} className="mr-2" />
              Enroll
            </button>
          </div>
          <div className="space-y-4">
            {enrolledCourses.map((course) => (
              <div key={course.id} className="p-4 rounded-lg bg-muted/30 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">{course.title}</h4>
                    <p className="text-sm text-muted-foreground">{course.code} • {course.instructor}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-success">{course.grade}</span>
                    <p className="text-xs text-muted-foreground">Current Grade</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="progress-academic">
                    <div className="progress-fill" style={{ width: `${course.progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} />
                    Next class: {course.nextClass}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Assignments */}
        <Card className="card-academic p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-warning" />
            <h3 className="text-lg font-semibold">Upcoming Assignments</h3>
          </div>
          <div className="space-y-4">
            {upcomingAssignments.map((assignment, index) => (
              <div key={index} className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{assignment.title}</h4>
                    <p className="text-sm text-muted-foreground">{assignment.course}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded ${
                      assignment.status === 'urgent' ? 'bg-destructive/10 text-destructive' :
                      assignment.status === 'pending' ? 'bg-warning/10 text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {assignment.dueDate}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{assignment.points} pts</p>
                  </div>
                </div>
                <button className="w-full mt-3 py-2 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm font-medium">
                  {assignment.status === 'draft' ? 'Continue Working' : 'Start Assignment'}
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Grades */}
      <Card className="card-academic p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award size={20} className="text-success" />
          <h3 className="text-lg font-semibold">Recent Grades</h3>
        </div>
        <div className="space-y-3">
          {recentGrades.map((grade, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <h4 className="font-medium text-foreground">{grade.assignment}</h4>
                <p className="text-sm text-muted-foreground">{grade.course}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-success">{grade.grade}</span>
                <p className="text-sm text-muted-foreground">{grade.points}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}