import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Shield, GraduationCap, Settings, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    { icon: Shield, label: 'Manage Users', onClick: () => navigate('/admin/users') },
    { icon: GraduationCap, label: 'Departments', onClick: () => {} },
    { icon: BarChart3, label: 'Analytics', onClick: () => navigate('/admin/analytics') },
  ];

  const stats = [
    { label: 'Total Users', value: '—', icon: Users },
    { label: 'Active Students', value: '—', icon: GraduationCap },
    { label: 'Faculty', value: '—', icon: Shield },
    { label: 'Reports', value: '—', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, roles, and system settings.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="card-academic p-6 flex items-center gap-4">
            <s.icon className="text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-semibold">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="card-academic p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <Button key={a.label} variant="outline" className="justify-start" onClick={a.onClick}>
              <a.icon className="mr-2" size={18} /> {a.label}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}


