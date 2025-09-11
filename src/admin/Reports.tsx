import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db, functions } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

type ReportType = 'course_completion' | 'average_grades' | 'user_growth';

export default function Reports() {
  const { toast } = useToast();
  const [report, setReport] = useState<ReportType>('course_completion');
  const [filters, setFilters] = useState({ course: '', role: '', from: '', to: '' });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // minimal demo data from Firestore collections
    async function load() {
      setLoading(true);
      try {
        const { httpsCallable } = await import('firebase/functions');
        const call = httpsCallable(functions, 'generateReport');
        const res: any = await call({ type: report });
        setData(res.data.data ?? []);
      } catch {
        toast({ title: 'Error', description: 'Failed to load report data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [report, filters, toast]);

  const exportCsv = () => {
    const header = ['name', 'value'];
    const rows = data.map((r) => [r.name, r.value]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Reports</h1>
          <p className="text-muted-foreground">Generate and export system reports</p>
        </div>
        <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
      </div>

      <Card className="card-academic p-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <Select value={report} onValueChange={(v) => setReport(v as ReportType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select report" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course_completion">Course Completion</SelectItem>
                <SelectItem value="average_grades">Average Grades</SelectItem>
                <SelectItem value="user_growth">User Growth</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Course (optional)" value={filters.course} onChange={(e) => setFilters({ ...filters, course: e.target.value })} />
          <Input placeholder="Role (optional)" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
            <Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>
        </div>
      </Card>

      <Card className="card-academic p-6">
        {loading ? (
          <p className="text-muted-foreground">Loading chart...</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {report === 'user_growth' ? (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} />
                </LineChart>
              ) : (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4f46e5" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}


