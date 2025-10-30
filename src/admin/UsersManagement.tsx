import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { listenUsers, updateUser, deleteUser, UserRole } from '@/services/firebaseService';
import type { User } from '@/types';
import { Plus, Search, Edit, Trash2, Shield, GraduationCap, Users, CheckCircle, XCircle, Calendar } from 'lucide-react';

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  // Real-time Firebase listener
  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenUsers((usersData) => {
      setUsers(usersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  }, [users, search]);


  const handleRoleChange = async (userId: string, role: UserRole) => {
    setProcessing(userId);
    try {
      const result = await updateUser(userId, { role });
      if (result.success) {
        toast({ 
          title: 'Role Updated', 
          description: `User role has been changed to ${role}`,
          variant: 'default'
        });
      } else {
        toast({ 
          title: 'Update Failed', 
          description: result.error || 'Failed to update user role',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast({ 
        title: 'Update Failed', 
        description: 'An unexpected error occurred',
        variant: 'destructive' 
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleToggleActive = async (userId: string, active: boolean) => {
    setProcessing(userId);
    try {
      const result = await updateUser(userId, { active });
      if (result.success) {
        toast({ 
          title: active ? 'User Activated' : 'User Deactivated', 
          description: `User has been ${active ? 'activated' : 'deactivated'} successfully`,
          variant: 'default'
        });
      } else {
        toast({ 
          title: 'Update Failed', 
          description: result.error || 'Failed to update user status',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast({ 
        title: 'Update Failed', 
        description: 'An unexpected error occurred',
        variant: 'destructive' 
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    setProcessing(userId);
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        toast({ 
          title: 'User Deleted', 
          description: `${userName} has been removed from the system`,
          variant: 'default'
        });
      } else {
        toast({ 
          title: 'Deletion Failed', 
          description: result.error || 'Failed to delete user',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ 
        title: 'Deletion Failed', 
        description: 'An unexpected error occurred',
        variant: 'destructive' 
      });
    } finally {
      setProcessing(null);
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const students = users.filter(u => u.role === 'student').length;
    const faculty = users.filter(u => u.role === 'faculty').length;
    const admins = users.filter(u => u.role === 'admin').length;
    const active = users.filter(u => u.active !== false).length;
    return { total, students, faculty, admins, active };
  }, [users]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Users Management</h1>
          <p className="text-muted-foreground">Manage users, change roles, and control access in real-time</p>
        </div>
        <Button 
          className="btn-primary flex items-center gap-2"
          onClick={() => window.location.href = '/admin/users/create'}
        >
          <Plus size={20} />
          Add User
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Users className="text-primary" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-success" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Students</p>
              <p className="text-2xl font-bold">{stats.students}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Shield className="text-warning" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Faculty</p>
              <p className="text-2xl font-bold">{stats.faculty}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Shield className="text-accent" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="text-2xl font-bold">{stats.admins}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-success" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
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

      {/* Users Table */}
      <Card className="card-academic p-0 overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">All Users</h2>
          <p className="text-sm text-muted-foreground">
            Manage user accounts, roles, and permissions. Changes are applied in real-time.
          </p>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="text-muted-foreground mx-auto mb-4" size={48} />
            <p className="text-lg font-medium mb-2">No users found</p>
            <p className="text-muted-foreground">
              {search ? 'Try adjusting your search criteria' : 'No users have been added yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-4 font-medium">User</th>
                  <th className="text-left px-6 py-4 font-medium">Email</th>
                  <th className="text-left px-6 py-4 font-medium">Role</th>
                  <th className="text-left px-6 py-4 font-medium">Department</th>
                  <th className="text-left px-6 py-4 font-medium">Status</th>
                  <th className="text-left px-6 py-4 font-medium">Join Date</th>
                  <th className="text-left px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {u.role === 'admin' ? <Shield className="text-primary" size={20} /> :
                           u.role === 'faculty' ? <GraduationCap className="text-warning" size={20} /> :
                           <Users className="text-success" size={20} />}
                        </div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{u.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm">{u.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Select 
                        value={u.role} 
                        onValueChange={(v) => handleRoleChange(u.id, v as UserRole)}
                        disabled={processing === u.id}
                      >
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
                    <td className="px-6 py-4">
                      <span className="text-sm">{u.department || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.active !== false ? 'default' : 'secondary'}>
                        {u.active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="text-muted-foreground" size={16} />
                        <span className="text-sm">{u.joinDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleToggleActive(u.id, u.active !== false ? false : true)}
                          disabled={processing === u.id}
                        >
                          {processing === u.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : u.active !== false ? (
                            <>
                              <XCircle size={16} />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          disabled={processing === u.id}
                        >
                          {processing === u.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Trash2 size={16} />
                              Delete
                            </>
                          )}
                        </Button>
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


