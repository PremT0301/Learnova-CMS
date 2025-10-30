import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [pageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<LogItem | null>(null);

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

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

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
          <>
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
                  {paginated.map((i) => (
                    <tr key={i.id} className="border-t border-border/60">
                      <td className="py-3">{i.timestamp}</td>
                      <td className="py-3">{i.userId ?? '-'}</td>
                      <td className="py-3">{i.action}</td>
                      <td className="py-3">
                        <Button size="sm" variant="outline" onClick={() => setSelected(i)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">Page {page} of {Math.max(1, Math.ceil(filtered.length / pageSize))}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= Math.ceil(filtered.length / pageSize)} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Timestamp:</span> {selected.timestamp}</div>
              <div><span className="text-muted-foreground">User:</span> {selected.userId ?? '-'}</div>
              <div><span className="text-muted-foreground">Action:</span> {selected.action}</div>
              <div>
                <span className="text-muted-foreground">Details:</span>
                <pre className="text-xs whitespace-pre-wrap bg-muted/40 p-3 rounded mt-1">{JSON.stringify(selected.details ?? {}, null, 2)}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


