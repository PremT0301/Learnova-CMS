import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Pin, 
  Calendar,
  User,
  AlertCircle,
  Megaphone,
  Trash2,
  Edit
} from 'lucide-react';
import { CourseAnnouncement } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface AnnouncementsTabProps {
  courseId: string;
  announcements: CourseAnnouncement[];
  onRefresh: () => void;
  isInstructor: boolean;
}

export default function AnnouncementsTab({ 
  courseId, 
  announcements, 
  onRefresh,
  isInstructor 
}: AnnouncementsTabProps) {
  const { user } = useToast();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    isPinned: false
  });

  const handleCreateAnnouncement = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, 'course_announcements'), {
        courseId,
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        isPinned: formData.isPinned,
        authorId: user?.id || '',
        authorName: user?.name || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Success',
        description: 'Announcement created successfully',
      });

      setShowCreateDialog(false);
      setFormData({
        title: '',
        content: '',
        priority: 'medium',
        isPinned: false
      });
      onRefresh();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to create announcement',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await deleteDoc(doc(db, 'course_announcements', announcementId));
      toast({
        title: 'Success',
        description: 'Announcement deleted successfully',
      });
      onRefresh();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive',
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Course Announcements</h2>
          <p className="text-muted-foreground">Stay updated with course news and updates</p>
        </div>
        {isInstructor && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="mr-2" size={16} />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title *</label>
                  <Input
                    placeholder="Enter announcement title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Content *</label>
                  <Textarea
                    placeholder="Enter announcement content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Priority</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: 'low' | 'medium' | 'high') => 
                        setFormData({ ...formData, priority: value })
                      }
                    >
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
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="isPinned"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="isPinned" className="text-sm font-medium cursor-pointer">
                      Pin this announcement
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAnnouncement} disabled={creating}>
                    {creating ? 'Creating...' : 'Create Announcement'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {sortedAnnouncements.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Megaphone className="mx-auto mb-4 text-muted-foreground" size={48} />
              <h3 className="text-lg font-semibold mb-2">No Announcements Yet</h3>
              <p className="text-muted-foreground">
                {isInstructor 
                  ? 'Create your first announcement to keep students informed'
                  : 'Check back later for course updates and announcements'}
              </p>
            </div>
          </Card>
        ) : (
          sortedAnnouncements.map((announcement) => (
            <Card key={announcement.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  {announcement.isPinned && (
                    <Pin className="text-primary mt-1 flex-shrink-0" size={18} />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {announcement.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{announcement.authorName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                      </div>
                      <Badge className={getPriorityColor(announcement.priority)}>
                        {announcement.priority}
                      </Badge>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{announcement.content}</p>
                  </div>
                </div>
                {isInstructor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

