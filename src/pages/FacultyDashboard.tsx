import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Users, FileText, BarChart3, Calendar, Award } from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'My Courses',
      value: '3',
      change: 'Active this semester',
      icon: BookOpen,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'Total Students',
      value: '127',
      change: 'Across all courses',
      icon: Users,
      color: 'text-success',
      bg: 'bg-success/10'
    },
    {
      title: 'Pending Grading',
      value: '12',
      change: 'Assignments to review',
      icon: FileText,
      color: 'text-warning',
      bg: 'bg-warning/10'
    },
    {
      title: 'Avg. Rating',
      value: '4.8',
      change: 'Student feedback',
      icon: Award,
      color: 'text-accent',
      bg: 'bg-accent/10'
    }
  ];

  const myCourses = [
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
      title: 'Advanced Programming',
      code: 'CS-401',
      students: 38,
      assignments: 6,
      nextClass: 'Today, 2:00 PM'
    },
    {
      id: '3',
      title: 'Software Engineering',
      code: 'CS-450',
      students: 44,
      assignments: 10,
      nextClass: 'Friday, 1:00 PM'
    }
  ];

  const pendingGrading = [
    { 
      title: 'Binary Tree Implementation',
      course: 'CS-301',
      submissions: 42,
      dueDate: '2024-01-18'
    },
    { 
      title: 'Database Design Project',
      course: 'CS-401',
      submissions: 35,
      dueDate: '2024-01-20'
    },
    { 
      title: 'React Portfolio',
      course: 'CS-450',
      submissions: 40,
      dueDate: '2024-01-22'
    }
  ];

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
            {myCourses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">{course.code}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm">
                      <Users size={14} />
                      <span>{course.students} students</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <FileText size={14} />
                      <span>{course.assignments} assignments</span>
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

        {/* Pending Grading */}
        <Card className="card-academic p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Pending Grading</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-3">
            {pendingGrading.map((assignment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <h3 className="font-medium">{assignment.title}</h3>
                  <p className="text-sm text-muted-foreground">{assignment.course}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{assignment.submissions} submissions</p>
                  <p className="text-xs text-muted-foreground">Due: {assignment.dueDate}</p>
                </div>
              </div>
            ))}
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

      {/* Recent Activity */}
      <Card className="card-academic p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="p-2 bg-success/20 rounded-full">
              <FileText className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="font-medium">Graded: Binary Tree Implementation</p>
              <p className="text-sm text-muted-foreground">CS-301 • 42 submissions graded • 2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="p-2 bg-primary/20 rounded-full">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Created new assignment: Database Design Project</p>
              <p className="text-sm text-muted-foreground">CS-401 • Due Jan 20 • 1 day ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="p-2 bg-warning/20 rounded-full">
              <Users className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="font-medium">New student enrolled: CS-301</p>
              <p className="text-sm text-muted-foreground">John Doe joined your Data Structures course • 2 days ago</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
