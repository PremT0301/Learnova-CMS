import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';

type Announcement = { id: string; title: string; message: string; target: 'all'|'students'|'faculty'; startDate?: string; endDate?: string };

export default function Announcements() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', target: 'all' as Announcement['target'], startDate: '', endDate: '' });

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'announcements'), orderBy('startDate', 'desc')));
      const list: Announcement[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setItems(list);
    } catch {
      toast({ title: 'Error', description: 'Failed to load announcements', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast({ title: 'Validation', description: 'Title and message are required', variant: 'destructive' });
      return;
    }
    try {
      const payload = { ...form, createdAt: new Date().toISOString() };
      await addDoc(collection(db, 'announcements'), payload);
      logAudit('announcement_create', payload as any, user?.id);
      toast({ title: 'Created', description: 'Announcement published' });
      setCreating(false);
      setForm({ title: '', message: '', target: 'all', startDate: '', endDate: '' });
      await load();
    } catch {
      toast({ title: 'Error', description: 'Failed to create announcement', variant: 'destructive' });
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
      logAudit('announcement_delete', { id }, user?.id);
      toast({ title: 'Deleted', description: 'Announcement removed' });
      await load();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete announcement', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Global Announcements</h1>
          <p className="text-muted-foreground">Broadcast messages to users</p>
        </div>
        <Button className="btn-primary" onClick={() => setCreating(true)}>New Announcement</Button>
      </div>

      {creating && (
        <Card className="card-academic p-6">
          <form onSubmit={create} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Target</Label>
                <select className="w-full border rounded-md p-2 bg-background" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value as Announcement['target'] })}>
                  <option value="all">All Users</option>
                  <option value="students">Students</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="btn-primary">Publish</Button>
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="card-academic p-6">
        {loading ? (
          <p className="text-muted-foreground">Loading announcements...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2">Title</th>
                  <th className="py-2">Target</th>
                  <th className="py-2">Start</th>
                  <th className="py-2">End</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-t border-border/60">
                    <td className="py-3">{a.title}</td>
                    <td className="py-3 capitalize">{a.target}</td>
                    <td className="py-3">{a.startDate ?? '-'}</td>
                    <td className="py-3">{a.endDate ?? '-'}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => remove(a.id)}>Delete</Button>
                      </div>
                    </td>
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


