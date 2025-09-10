import React from 'react';
import { Card } from '@/components/ui/card';
import { BookOpen, Users, FileText, Clock, Plus, GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function FacultyDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'My Courses',
      value: '6',
      change: '+1 this semester',
      icon: BookOpen,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'Total Students',
      value: '187',
      change: '+23 enrolled',
      icon: Users,
      color: 'text-success',
      bg: 'bg-success/10'
    },
    {
      title: 'Pending Grades',
      value: '42',
      change: 'Due this week',
      icon: FileText,
      color: 'text-warning',
      bg: 'bg-warning/10'
    },
    {
      title: 'Avg Grade',
      value: '3.4',
      change: 'GPA this term',
      icon: GraduationCap,
      color: 'text-accent',
      bg: 'bg-accent/10'
    }
  ];

  const courses = [
    {
      id: '1',
      title: 'Data Structures & Algorithms',
      code: 'CS-301',
      students: 45,
      assignments: 8,
      nextClass: 'Tomorrow, 10:00 AM'
    },
    {
      id: '2',
      title: 'Database Management Systems',
      code: 'CS-401',
      students: 38,
      assignments: 5,
      nextClass: 'Today, 2:00 PM'
    },
    {
      id: '3',
      title: 'Software Engineering',
      code: 'CS-501',
      students: 42,
      assignments: 6,
      nextClass: 'Friday, 9:00 AM'
    }
  ];

  const upcomingDeadlines = [
    { title: 'Algorithm Assignment #3', course: 'CS-301', dueDate: 'Today, 11:59 PM', submissions: 38, total: 45 },
    { title: 'Database Project', course: 'CS-401', dueDate: 'Tomorrow, 11:59 PM', submissions: 25, total: 38 },
    { title: 'Software Design Document', course: 'CS-501', dueDate: 'Friday, 11:59 PM', submissions: 15, total: 42 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient-primary mb-2">
          Good morning, {user?.name}
        </h1>
        <p className="text-muted-foreground text-lg">
          Ready to inspire and educate your students today?
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
              New Course
            </button>
          </div>
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="p-4 rounded-lg bg-muted/30 card-hover">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{course.title}</h4>
                    <p className="text-sm text-muted-foreground">{course.code}</p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {course.students} students
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{course.assignments} assignments</span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {course.nextClass}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="card-academic p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={20} className="text-warning" />
            <h3 className="text-lg font-semibold">Upcoming Deadlines</h3>
          </div>
          <div className="space-y-4">
            {upcomingDeadlines.map((deadline, index) => (
              <div key={index} className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{deadline.title}</h4>
                    <p className="text-sm text-muted-foreground">{deadline.course}</p>
                  </div>
                  <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded">
                    {deadline.dueDate}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="progress-academic flex-1 mr-3">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(deadline.submissions / deadline.total) * 100}%` }} 
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {deadline.submissions}/{deadline.total} submitted
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="card-academic p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <button className="p-4 text-left rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/20">
            <Plus size={20} className="text-primary mb-2" />
            <p className="font-medium text-primary">Create Assignment</p>
            <p className="text-sm text-muted-foreground">Add new coursework</p>
          </button>
          <button className="p-4 text-left rounded-lg bg-success/5 hover:bg-success/10 transition-colors border border-success/20">
            <FileText size={20} className="text-success mb-2" />
            <p className="font-medium text-success">Grade Submissions</p>
            <p className="text-sm text-muted-foreground">Review student work</p>
          </button>
          <button className="p-4 text-left rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors border border-accent/20">
            <Users size={20} className="text-accent mb-2" />
            <p className="font-medium text-accent">View Students</p>
            <p className="text-sm text-muted-foreground">Manage class roster</p>
          </button>
        </div>
      </Card>
    </div>
  );
}