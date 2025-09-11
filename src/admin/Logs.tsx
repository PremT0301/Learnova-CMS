import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/firebase';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type LogItem = { id: string; timestamp: string; userId?: string; action: string; details?: unknown };

export default function Logs() {
  const { toast } = useToast();
  const [items, setItems] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [qAction, setQAction] = useState('');
  const [qUser, setQUser] = useState('');
  const [qDate, setQDate] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc')));
        const list: LogItem[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setItems(list);
      } catch {
        toast({ title: 'Error', description: 'Failed to load logs', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  const filtered = useMemo(() => {
    return items.filter((i) =>
      (qAction ? i.action.includes(qAction) : true) &&
      (qUser ? (i.userId ?? '').includes(qUser) : true) &&
      (qDate ? (i.timestamp ?? '').startsWith(qDate) : true)
    );
  }, [items, qAction, qUser, qDate]);

  const exportCsv = () => {
    const header = ['timestamp', 'userId', 'action', 'details'];
    const rows = filtered.map((i) => [i.timestamp, i.userId ?? '', i.action, JSON.stringify(i.details ?? {})]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Audit Logs</h1>
          <p className="text-muted-foreground">Track administrative actions and events</p>
        </div>
        <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
      </div>

      <Card className="card-academic p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Input placeholder="Filter by action" value={qAction} onChange={(e) => setQAction(e.target.value)} />
          <Input placeholder="Filter by userId" value={qUser} onChange={(e) => setQUser(e.target.value)} />
          <Input placeholder="Filter by date (YYYY-MM-DD)" value={qDate} onChange={(e) => setQDate(e.target.value)} />
        </div>
      </Card>

      <Card className="card-academic p-6">
        {loading ? (
          <p className="text-muted-foreground">Loading logs...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2">Timestamp</th>
                  <th className="py-2">User</th>
                  <th className="py-2">Action</th>
                  <th className="py-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id} className="border-t border-border/60">
                    <td className="py-3">{i.timestamp}</td>
                    <td className="py-3">{i.userId ?? '-'}</td>
                    <td className="py-3">{i.action}</td>
                    <td className="py-3"><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(i.details ?? {}, null, 2)}</pre></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}


