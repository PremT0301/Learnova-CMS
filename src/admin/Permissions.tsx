import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
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

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'roles'));
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
                <div>
                  <Button className="btn-primary" onClick={() => save(r.id)}>Save</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}


