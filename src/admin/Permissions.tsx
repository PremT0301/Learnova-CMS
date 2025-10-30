import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/firebase';
import { collection, deleteDoc, doc, getDocs, query, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';

type RolePerm = { id: string; permissions: string[] };

export default function Permissions() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [roles, setRoles] = useState<RolePerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'roles')));
        const rows: RolePerm[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setRoles(rows);
      } catch {
        toast({ title: 'Error', description: 'Failed to load roles', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  const save = async (id: string) => {
    const perms = (editing[id] ?? '').split(',').map((p) => p.trim()).filter(Boolean);
    try {
      await setDoc(doc(db, 'roles', id), { permissions: perms }, { merge: true });
      toast({ title: 'Saved', description: `Permissions updated for ${id}` });
      logAudit('permissions_update', { role: id, permissions: perms }, user?.id);
    } catch {
      toast({ title: 'Error', description: 'Failed to update permissions', variant: 'destructive' });
    }
  };

  const addRole = async () => {
    const id = newRole.trim().toLowerCase();
    if (!id) return;
    try {
      await setDoc(doc(db, 'roles', id), { permissions: [] }, { merge: true });
      toast({ title: 'Role added', description: `Role ${id} created` });
      logAudit('role_create', { role: id }, user?.id);
      setNewRole('');
      const snap = await getDocs(query(collection(db, 'roles')));
      setRoles(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch {
      toast({ title: 'Error', description: 'Failed to create role', variant: 'destructive' });
    }
  };

  const deleteRole = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'roles', id));
      toast({ title: 'Role deleted', description: id });
      logAudit('role_delete', { role: id }, user?.id);
      const snap = await getDocs(query(collection(db, 'roles')));
      setRoles(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch {
      toast({ title: 'Error', description: 'Failed to delete role', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Roles & Permissions</h1>
        <p className="text-muted-foreground">Define capabilities for each role</p>
      </div>

      <Card className="card-academic p-6">
        {loading ? (
          <p className="text-muted-foreground">Loading roles...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end gap-2 border-b pb-4">
              <div className="flex-1">
                <Label>New Role</Label>
                <Input placeholder="e.g., reviewer" value={newRole} onChange={(e) => setNewRole(e.target.value)} />
              </div>
              <Button className="btn-primary" onClick={addRole}>Add Role</Button>
            </div>
            {roles.map((r) => (
              <div key={r.id} className="grid md:grid-cols-3 gap-4 items-end border-b pb-4">
                <div>
                  <Label>Role</Label>
                  <div className="font-medium">{r.id}</div>
                </div>
                <div>
                  <Label>Permissions (comma separated)</Label>
                  <Input
                    defaultValue={(r.permissions ?? []).join(', ')}
                    onChange={(e) => setEditing({ ...editing, [r.id]: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="btn-primary" onClick={() => save(r.id)}>Save</Button>
                  <Button variant="outline" onClick={() => deleteRole(r.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}


