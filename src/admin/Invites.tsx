import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db, functions } from '@/firebase';
import { addDoc, collection, getDocs, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';

type Invite = { id: string; email: string; role: 'student'|'faculty'|'admin'; status: 'sent'|'accepted'|'expired'|'revoked'; createdAt: string };

export default function Invites() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [list, setList] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: '', role: 'student' as Invite['role'] });

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'invites'), orderBy('createdAt', 'desc')));
      setList(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch {
      toast({ title: 'Error', description: 'Failed to load invites', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!email) {
      toast({ title: 'Validation', description: 'Email is required', variant: 'destructive' });
      return;
    }
    try {
      const { httpsCallable } = await import('firebase/functions');
      const call = httpsCallable(functions, 'sendInvite');
      await call({ email, role: form.role });
      const payload = { email, role: form.role, status: 'sent', createdAt: new Date().toISOString() };
      logAudit('invite_send', payload as any, user?.id);
      toast({ title: 'Invite sent', description: `Invitation sent to ${email}` });
      setForm({ email: '', role: 'student' });
      await load();
    } catch {
      toast({ title: 'Error', description: 'Failed to send invite', variant: 'destructive' });
    }
  };

  const updateStatus = async (id: string, status: Invite['status']) => {
    try {
      await updateDoc(doc(db, 'invites', id), { status });
      logAudit('invite_status', { id, status }, user?.id);
      await load();
    } catch {
      toast({ title: 'Error', description: 'Failed to update invite status', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">User Onboarding & Invites</h1>
        <p className="text-muted-foreground">Send email invites and track status</p>
      </div>

      <Card className="card-academic p-6">
        <form onSubmit={sendInvite} className="grid md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <select className="w-full border rounded-md p-2 bg-background" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Invite['role'] })}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <Button type="submit" className="btn-primary">Send Invite</Button>
          </div>
        </form>
      </Card>

      <Card className="card-academic p-6">
        {loading ? (
          <p className="text-muted-foreground">Loading invites...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Created</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((inv) => (
                  <tr key={inv.id} className="border-t border-border/60">
                    <td className="py-3">{inv.email}</td>
                    <td className="py-3 capitalize">{inv.role}</td>
                    <td className="py-3 capitalize">{inv.status}</td>
                    <td className="py-3">{inv.createdAt}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => updateStatus(inv.id, 'sent')}>Resend</Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(inv.id, 'revoked')}>Revoke</Button>
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


