import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  listenAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement,
  AnnouncementDoc,
  UserRole
} from '@/services/firebaseService';
import { Bell, Plus, Edit, Trash2, Eye, Users, GraduationCap, Shield, Calendar, AlertCircle } from 'lucide-react';

export default function Announcements() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    visibleTo: ['admin'] as UserRole[], 
    priority: 'medium' as 'low' | 'medium' | 'high',
    isActive: true
  });

  // Real-time Firebase listener
  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenAnnouncements((announcementsData) => {
      setAnnouncements(announcementsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast({ title: 'Validation Error', description: 'Title and description are required', variant: 'destructive' });
      return;
    }

    try {
      const result = await createAnnouncement({
        title: form.title,
        description: form.description,
        createdBy: user?.id || '',
        createdByName: user?.name || 'Admin',
        visibleTo: form.visibleTo,
        priority: form.priority,
        isActive: form.isActive
      });

      if (result.success) {
        toast({ 
          title: 'Announcement Created', 
          description: 'The announcement has been published and is visible to all target users.',
          variant: 'default'
        });
        setForm({ 
          title: '', 
          description: '', 
          visibleTo: ['admin'], 
          priority: 'medium',
          isActive: true
        });
        setCreating(false);
      } else {
        toast({ 
          title: 'Creation Failed', 
          description: result.error || 'Failed to create announcement',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast({ 
        title: 'Creation Failed', 
        description: 'An unexpected error occurred',
        variant: 'destructive' 
      });
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const result = await updateAnnouncement(id, {
        title: form.title,
        description: form.description,
        visibleTo: form.visibleTo,
        priority: form.priority,
        isActive: form.isActive
      });

      if (result.success) {
        toast({ 
          title: 'Announcement Updated', 
          description: 'The announcement has been updated successfully.',
          variant: 'default'
        });
        setEditing(null);
        setForm({ 
          title: '', 
          description: '', 
          visibleTo: ['admin'], 
          priority: 'medium',
          isActive: true
        });
      } else {
        toast({ 
          title: 'Update Failed', 
          description: result.error || 'Failed to update announcement',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast({ 
        title: 'Update Failed', 
        description: 'An unexpected error occurred',
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteAnnouncement(id);
      if (result.success) {
        toast({ 
          title: 'Announcement Deleted', 
          description: 'The announcement has been removed successfully.',
          variant: 'default'
        });
      } else {
        toast({ 
          title: 'Deletion Failed', 
          description: result.error || 'Failed to delete announcement',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({ 
        title: 'Deletion Failed', 
        description: 'An unexpected error occurred',
        variant: 'destructive' 
      });
    }
  };

  const startEdit = (announcement: AnnouncementDoc) => {
    setEditing(announcement.id);
    setForm({
      title: announcement.title,
      description: announcement.description,
      visibleTo: announcement.visibleTo,
      priority: announcement.priority,
      isActive: announcement.isActive
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setCreating(false);
    setForm({ 
      title: '', 
      description: '', 
      visibleTo: ['admin'], 
      priority: 'medium',
      isActive: true
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Global Announcements</h1>
          <p className="text-muted-foreground">Create and manage announcements visible across all user roles</p>
        </div>
        <Button 
          className="btn-primary flex items-center gap-2" 
          onClick={() => setCreating(true)}
        >
          <Plus size={20} />
          New Announcement
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Bell className="text-primary" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Announcements</p>
              <p className="text-2xl font-bold">{announcements.length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-warning" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">High Priority</p>
              <p className="text-2xl font-bold">{announcements.filter(a => a.priority === 'high').length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Users className="text-success" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">All Users</p>
              <p className="text-2xl font-bold">{announcements.filter(a => a.visibleTo.includes('admin') && a.visibleTo.includes('faculty') && a.visibleTo.includes('student')).length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Calendar className="text-accent" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{announcements.filter(a => a.isActive).length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Create/Edit Form */}
      {(creating || editing) && (
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="text-primary" size={24} />
            <h2 className="text-lg font-semibold">
              {editing ? 'Edit Announcement' : 'Create New Announcement'}
            </h2>
          </div>
          <form onSubmit={editing ? (e) => { e.preventDefault(); handleUpdate(editing); } : handleCreate} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input 
                  id="title"
                  value={form.title} 
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Enter announcement title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value as 'low' | 'medium' | 'high' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea 
                id="description"
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Enter announcement description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Visible To</Label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { role: 'admin' as UserRole, label: 'Admins', icon: Shield },
                  { role: 'faculty' as UserRole, label: 'Faculty', icon: GraduationCap },
                  { role: 'student' as UserRole, label: 'Students', icon: Users }
                ].map(({ role, label, icon: Icon }) => (
                  <div key={role} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={role}
                      checked={form.visibleTo.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, visibleTo: [...form.visibleTo, role] });
                        } else {
                          setForm({ ...form, visibleTo: form.visibleTo.filter(r => r !== role) });
                        }
                      }}
                      className="rounded border-border"
                    />
                    <Label htmlFor={role} className="flex items-center gap-2">
                      <Icon size={16} />
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-border"
              />
              <Label htmlFor="isActive">Active (visible to users)</Label>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="btn-primary">
                {editing ? 'Update Announcement' : 'Create Announcement'}
              </Button>
              <Button type="button" variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Announcements List */}
      <Card className="card-academic p-0 overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">All Announcements</h2>
          <p className="text-sm text-muted-foreground">
            Manage announcements that are visible to users across the platform
          </p>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="text-muted-foreground mx-auto mb-4" size={48} />
            <p className="text-lg font-medium mb-2">No announcements yet</p>
            <p className="text-muted-foreground">Create your first announcement to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-6 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{announcement.title}</h3>
                      <Badge variant={
                        announcement.priority === 'high' ? 'destructive' :
                        announcement.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {announcement.priority}
                      </Badge>
                      <Badge variant={announcement.isActive ? 'default' : 'secondary'}>
                        {announcement.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">{announcement.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        {announcement.visibleTo.join(', ')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye size={16} />
                        By {announcement.createdByName}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => startEdit(announcement)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}


