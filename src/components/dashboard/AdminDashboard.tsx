import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, BookOpen, FileText, TrendingUp, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function AdminDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Users',
      value: '1,247',
      change: '+12%',
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'Active Courses',
      value: '89',
      change: '+5%',
      icon: BookOpen,
      color: 'text-success',
      bg: 'bg-success/10'
    },
    {
      title: 'Assignments',
      value: '342',
      change: '+18%',
      icon: FileText,
      color: 'text-accent',
      bg: 'bg-accent/10'
    },
    {
      title: 'System Load',
      value: '78%',
      change: '-3%',
      icon: TrendingUp,
      color: 'text-warning',
      bg: 'bg-warning/10'
    }
  ];

  const recentActivities = [
    { action: 'New user registered', user: 'John Smith', time: '2 minutes ago', type: 'user' },
    { action: 'Course published', user: 'Dr. Anderson', time: '15 minutes ago', type: 'course' },
    { action: 'Assignment submitted', user: 'Sarah Johnson', time: '1 hour ago', type: 'assignment' },
    { action: 'Grade updated', user: 'Prof. Wilson', time: '2 hours ago', type: 'grade' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient-primary mb-2">
          Welcome back, {user?.name}
        </h1>
        <p className="text-muted-foreground text-lg">
          Here's what's happening in your institution today.
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
                <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                  {stat.change} from last month
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon size={24} className={stat.color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card className="card-academic p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-primary" />
            <h3 className="text-lg font-semibold">Recent Activities</h3>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">by {activity.user}</p>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="card-academic p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={20} className="text-primary" />
            <h3 className="text-lg font-semibold">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <button className="w-full p-3 text-left rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/20">
              <p className="font-medium text-primary">Add New User</p>
              <p className="text-sm text-muted-foreground">Create faculty or student accounts</p>
            </button>
            <button className="w-full p-3 text-left rounded-lg bg-success/5 hover:bg-success/10 transition-colors border border-success/20">
              <p className="font-medium text-success">Create Course</p>
              <p className="text-sm text-muted-foreground">Set up a new course offering</p>
            </button>
            <button className="w-full p-3 text-left rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors border border-accent/20">
              <p className="font-medium text-accent">View Reports</p>
              <p className="text-sm text-muted-foreground">Access system analytics</p>
            </button>
          </div>
        </Card>
      </div>

      {/* System Health */}
      <Card className="card-academic p-6">
        <h3 className="text-lg font-semibold mb-4">System Health</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Server Performance</span>
              <span>92%</span>
            </div>
            <div className="progress-academic">
              <div className="progress-fill" style={{ width: '92%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Database Health</span>
              <span>87%</span>
            </div>
            <div className="progress-academic">
              <div className="progress-fill" style={{ width: '87%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Active Sessions</span>
              <span>78%</span>
            </div>
            <div className="progress-academic">
              <div className="progress-fill" style={{ width: '78%' }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}