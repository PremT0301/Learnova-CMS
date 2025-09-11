import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { logAudit } from '@/lib/audit';
import { Plus, Search, Trash2, Pencil, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Department = {
  id: string;
  name: string;
  code: string;
  head?: string;
  active: boolean;
};

export default function Departments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [creatingData, setCreatingData] = useState({ name: '', code: '', head: '', active: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{ name: string; code: string; head?: string; active: boolean }>({ name: '', code: '', head: '', active: true });

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'departments'));
      const list: Department[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name ?? '',
          code: data.code ?? '',
          head: data.head,
          active: data.active ?? true,
        };
      });
      setDepartments(list);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load departments', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return departments.filter((d) =>
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      (d.head ?? '').toLowerCase().includes(q)
    );
  }, [departments, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = creatingData.name.trim();
    const code = creatingData.code.trim().toUpperCase();
    if (!name || !code) {
      toast({ title: 'Validation', description: 'Name and code are required', variant: 'destructive' });
      return;
    }
    try {
      // prevent duplicate code
      const dupQ = query(collection(db, 'departments'), where('code', '==', code));
      const dupSnap = await getDocs(dupQ);
      if (!dupSnap.empty) {
        toast({ title: 'Duplicate', description: 'A department with this code already exists', variant: 'destructive' });
        return;
      }
      await addDoc(collection(db, 'departments'), {
        name,
        code,
        head: creatingData.head.trim() || undefined,
        active: creatingData.active,
        createdAt: new Date().toISOString(),
      });
      logAudit('department_create', { name, code }, user?.id);
      toast({ title: 'Created', description: 'Department created successfully' });
      setIsCreating(false);
      setCreatingData({ name: '', code: '', head: '', active: true });
      await fetchDepartments();
    } catch {
      toast({ title: 'Error', description: 'Failed to create department', variant: 'destructive' });
    }
  };

  const startEdit = (dept: Department) => {
    setEditingId(dept.id);
    setEditingData({ name: dept.name, code: dept.code, head: dept.head, active: dept.active });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    const name = editingData.name.trim();
    const code = editingData.code.trim().toUpperCase();
    if (!name || !code) {
      toast({ title: 'Validation', description: 'Name and code are required', variant: 'destructive' });
      return;
    }
    try {
      await updateDoc(doc(db, 'departments', id), {
        name,
        code,
        head: (editingData.head ?? '').trim() || null,
        active: editingData.active,
        updatedAt: new Date().toISOString(),
      });
      logAudit('department_update', { id, name, code }, user?.id);
      toast({ title: 'Updated', description: 'Department updated successfully' });
      setEditingId(null);
      await fetchDepartments();
    } catch {
      toast({ title: 'Error', description: 'Failed to update department', variant: 'destructive' });
    }
  };

  const remove = async (id: string) => {
    try {
      // Guard: prevent delete if assigned in courses or users (head or department)
      const coursesWithDept = await getDocs(query(collection(db, 'courses'), where('departmentId', '==', id)));
      if (!coursesWithDept.empty) {
        toast({ title: 'Blocked', description: 'Cannot delete: department has assigned courses', variant: 'destructive' });
        return;
      }
      const facultyWithDept = await getDocs(query(collection(db, 'users'), where('departmentId', '==', id)));
      if (!facultyWithDept.empty) {
        toast({ title: 'Blocked', description: 'Cannot delete: department has assigned faculty/users', variant: 'destructive' });
        return;
      }
      await deleteDoc(doc(db, 'departments', id));
      toast({ title: 'Deleted', description: 'Department removed' });
      logAudit('department_delete', { id }, user?.id);
      await fetchDepartments();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete department', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Departments</h1>
          <p className="text-muted-foreground">Manage academic departments</p>
        </div>
        <Button className="btn-primary" onClick={() => setIsCreating(true)}>
          <Plus size={18} className="mr-2" /> New Department
        </Button>
      </div>

      {/* Search */}
      <Card className="card-academic p-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search by name, code, or head"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {/* Create form */}
      {isCreating && (
        <Card className="card-academic p-6">
          <form onSubmit={handleCreate} className="grid md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Name *</Label>
              <Input id="dept-name" value={creatingData.name} onChange={(e) => setCreatingData({ ...creatingData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-code">Code *</Label>
              <Input id="dept-code" value={creatingData.code} onChange={(e) => setCreatingData({ ...creatingData, code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-head">Head (optional)</Label>
              <Input id="dept-head" value={creatingData.head} onChange={(e) => setCreatingData({ ...creatingData, head: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="btn-primary">
                <Save size={16} className="mr-2" /> Save
              </Button>
              <Button type="button" variant="outline" onClick={() => { setIsCreating(false); setCreatingData({ name: '', code: '', head: '', active: true }); }}>
                <X size={16} className="mr-2" /> Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* List */}
      <Card className="card-academic p-6">
        {loading ? (
          <p className="text-muted-foreground">Loading departments...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2">Name</th>
                  <th className="py-2">Code</th>
                  <th className="py-2">Head</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-t border-border/60">
                    <td className="py-3">
                      {editingId === d.id ? (
                        <Input value={editingData.name} onChange={(e) => setEditingData({ ...editingData, name: e.target.value })} />
                      ) : (
                        d.name
                      )}
                    </td>
                    <td className="py-3">
                      {editingId === d.id ? (
                        <Input value={editingData.code} onChange={(e) => setEditingData({ ...editingData, code: e.target.value })} />
                      ) : (
                        d.code
                      )}
                    </td>
                    <td className="py-3">
                      {editingId === d.id ? (
                        <Input value={editingData.head ?? ''} onChange={(e) => setEditingData({ ...editingData, head: e.target.value })} />
                      ) : (
                        d.head ?? '-'
                      )}
                    </td>
                    <td className="py-3">
                      {editingId === d.id ? (
                        <Select value={String(editingData.active)} onValueChange={(v) => setEditingData({ ...editingData, active: v === 'true' })}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs ${d.active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {d.active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {editingId === d.id ? (
                        <div className="flex gap-2">
                          <Button size="sm" className="btn-primary" onClick={() => saveEdit(d.id)}>
                            <Save size={14} className="mr-1" /> Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X size={14} className="mr-1" /> Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(d)}>
                            <Pencil size={14} className="mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => remove(d.id)}>
                            <Trash2 size={14} className="mr-1" /> Delete
                          </Button>
                        </div>
                      )}
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


