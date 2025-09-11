import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Shield, GraduationCap, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/firebase';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState([
    { label: 'Total Users', value: '—', icon: Users },
    { label: 'Active Students', value: '—', icon: GraduationCap },
    { label: 'Faculty', value: '—', icon: Shield },
    { label: 'Courses', value: '—', icon: BarChart3 },
  ]);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError(null);
      try {
        const usersCol = collection(db, 'users');
        const coursesCol = collection(db, 'courses');
        const totalUsersSnap = await getCountFromServer(usersCol);
        const facultySnap = await getCountFromServer(query(usersCol, where('role', '==', 'faculty')));
        const activeStudentsSnap = await getCountFromServer(query(usersCol, where('role', '==', 'student'), where('active', '==', true)));
        const coursesSnap = await getCountFromServer(coursesCol);

        setStats([
          { label: 'Total Users', value: String(totalUsersSnap.data().count), icon: Users },
          { label: 'Active Students', value: String(activeStudentsSnap.data().count), icon: GraduationCap },
          { label: 'Faculty', value: String(facultySnap.data().count), icon: Shield },
          { label: 'Courses', value: String(coursesSnap.data().count), icon: BarChart3 },
        ]);
      } catch (e) {
        setError('Failed to load stats');
        toast({ title: 'Error', description: 'Failed to load admin stats', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [toast]);

  const quickActions = [
    { icon: Shield, label: 'Users', onClick: () => navigate('/admin/users') },
    { icon: GraduationCap, label: 'Departments', onClick: () => navigate('/admin/departments') },
    { icon: BarChart3, label: 'Analytics', onClick: () => navigate('/admin/analytics') },
    { icon: BarChart3, label: 'Reports', onClick: () => navigate('/admin/reports') },
    { icon: BarChart3, label: 'Audit Logs', onClick: () => navigate('/admin/logs') },
    { icon: BarChart3, label: 'Announcements', onClick: () => navigate('/admin/announcements') },
    { icon: BarChart3, label: 'Backups', onClick: () => navigate('/admin/backups') },
    { icon: BarChart3, label: 'Permissions', onClick: () => navigate('/admin/permissions') },
    { icon: BarChart3, label: 'Invites', onClick: () => navigate('/admin/invites') },
    { icon: BarChart3, label: 'Health', onClick: () => navigate('/admin/health') },
    { icon: BarChart3, label: 'Support', onClick: () => navigate('/admin/support') },
    { icon: BarChart3, label: 'Settings', onClick: () => navigate('/admin/settings') },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, roles, and system settings.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="card-academic p-6">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse mb-3" />
              <div className="h-4 w-24 bg-muted animate-pulse mb-2" />
              <div className="h-6 w-16 bg-muted animate-pulse" />
            </Card>
          ))
        ) : (
          stats.map((s) => (
            <Card key={s.label} className="card-academic p-6 flex items-center gap-4">
              <s.icon className="text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-semibold">{s.value}</p>
              </div>
            </Card>
          ))
        )}
      </div>

      {error && (
        <Card className="card-academic p-4">
          <p className="text-destructive">{error}</p>
        </Card>
      )}

      <Card className="card-academic p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
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


