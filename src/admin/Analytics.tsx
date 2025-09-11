import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';

export default function Analytics() {
  const [roleFilter, setRoleFilter] = useState<'all'|'student'|'faculty'|'admin'>('all');
  const [loading, setLoading] = useState(true);
  const [usersSummary, setUsersSummary] = useState({ total: 0, students: 0, faculty: 0, admins: 0 });
  const [userGrowth, setUserGrowth] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const usersCol = collection(db, 'users');
        const snap = await getDocs(usersCol);
        const all = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        const students = all.filter(u => u.role === 'student').length;
        const faculty = all.filter(u => u.role === 'faculty').length;
        const admins = all.filter(u => u.role === 'admin').length;
        setUsersSummary({ total: all.length, students, faculty, admins });

        // Simple demo growth: split counts
        setUserGrowth([
          { name: 'Week -2', value: Math.max(0, all.length - 10) },
          { name: 'Week -1', value: Math.max(0, all.length - 5) },
          { name: 'This Week', value: all.length },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const roleFilteredGrowth = useMemo(() => {
    // If role filter applied, adjust numbers proportionally based on summary
    if (roleFilter === 'all') return userGrowth;
    const map = { student: usersSummary.students, faculty: usersSummary.faculty, admin: usersSummary.admins } as const;
    const total = usersSummary.total || 1;
    const ratio = map[roleFilter] / total;
    return userGrowth.map((p) => ({ ...p, value: Math.round(p.value * ratio) }));
  }, [roleFilter, userGrowth, usersSummary]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Admin • Analytics</h1>
          <p className="text-muted-foreground">Key insights and reports.</p>
        </div>
        <div className="w-48">
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="card-academic p-6"><p className="text-sm text-muted-foreground">Total Users</p><p className="text-2xl font-bold">{usersSummary.total}</p></Card>
        <Card className="card-academic p-6"><p className="text-sm text-muted-foreground">Students</p><p className="text-2xl font-bold">{usersSummary.students}</p></Card>
        <Card className="card-academic p-6"><p className="text-sm text-muted-foreground">Faculty</p><p className="text-2xl font-bold">{usersSummary.faculty}</p></Card>
        <Card className="card-academic p-6"><p className="text-sm text-muted-foreground">Admins</p><p className="text-2xl font-bold">{usersSummary.admins}</p></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 />
            <h2 className="text-lg font-semibold">User Growth</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roleFilteredGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 />
            <h2 className="text-lg font-semibold">Users by Role</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Students', value: usersSummary.students },
                { name: 'Faculty', value: usersSummary.faculty },
                { name: 'Admins', value: usersSummary.admins },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}


