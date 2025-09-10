import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/firebase';
import { collection, getDocs, updateDoc, query, where } from 'firebase/firestore';
import type { User, UserRole } from '@/types';
import { Plus, Search } from 'lucide-react';

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          email: data.email ?? '',
          name: data.name ?? data.email ?? 'User',
          role: (data.role ?? 'student') as UserRole,
          avatar: data.avatar,
          department: data.department,
          joinDate: data.joinDate ?? new Date().toISOString().slice(0, 10),
        } as User;
      });
      setUsers(list);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  }, [users, search]);


  const handleRoleChange = async (email: string, role: UserRole) => {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, { role });
        setUsers(prev => prev.map(u => u.email === email ? { ...u, role } : u));
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleToggleActive = async (email: string, active: boolean) => {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, { active });
        // Refresh the list to show updated status
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Users Management</h1>
          <p className="text-muted-foreground">Manage users, change roles, and control access.</p>
        </div>
        <Button 
          className="btn-primary"
          onClick={() => window.location.href = '/admin/users/create'}
        >
          <Plus size={20} className="mr-2" />
          Add User
        </Button>
      </div>

      <Card className="card-academic p-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            className="pl-10" 
            placeholder="Search by name, email, or role" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </Card>

      <Card className="card-academic p-6">
        {loading ? (
          <p className="text-muted-foreground">Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Department</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-t border-border/60">
                    <td className="py-3">{u.name}</td>
                    <td className="py-3">{u.email}</td>
                    <td className="py-3">
                      <Select value={u.role} onValueChange={(v) => handleRoleChange(u.email, v as UserRole)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="faculty">Faculty</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3">{u.department ?? '-'}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggleActive(u.email, true)}>Activate</Button>
                        <Button variant="outline" size="sm" onClick={() => handleToggleActive(u.email, false)}>Deactivate</Button>
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


