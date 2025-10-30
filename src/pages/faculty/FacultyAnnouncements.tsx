import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { announcementService, facultyCourseService } from '@/services/facultyService';
import { 
  Plus, Search, Calendar, Clock, Users, Bell, 
  Edit, Trash2, Eye, Send, Pin
} from 'lucide-react';

export default function FacultyAnnouncements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');

  useEffect(() => {
    if (user?.id) {
      loadAnnouncements();
      loadCourses();
    }
  }, [user]);

  const loadAnnouncements = async () => {
    if (!user?.id) return;
    
    try {
      const announcementsData = await announcementService.getAnnouncements(user.id);
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error loading announcements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load announcements',
        variant: 'destructive'
      });
    }
  };

  const loadCourses = async () => {
    if (!user?.id) return;
    
    try {
      const coursesData = await facultyCourseService.getFacultyCourses(user.id);
      setCourses(coursesData.map(course => ({
        id: course.id,
        name: `${course.code}: ${course.title}`
      })));
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await announcementService.deleteAnnouncement(announcementId);
      setAnnouncements(announcements.filter(a => a.id !== announcementId));
      toast({
        title: 'Success',
        description: 'Announcement deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive'
      });
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.courseId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || announcement.courseId === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Announcements</h1>
          <p className="text-muted-foreground">Create and manage course announcements.</p>
        </div>
        <Button className="btn-primary">
          <Plus size={20} className="mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="card-academic p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <Card key={announcement.id} className="card-academic p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{announcement.title}</h3>
                  <Badge variant="secondary">{announcement.course}</Badge>
                  <Badge className={getPriorityColor(announcement.priority)}>
                    {announcement.priority}
                  </Badge>
                  <Badge className={getStatusColor(announcement.status)}>
                    {announcement.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-3">{announcement.content}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>{announcement.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>{announcement.recipients} recipients</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit size={16} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDeleteAnnouncement(announcement.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Eye size={16} className="mr-2" />
                View
              </Button>
              <Button variant="outline" size="sm">
                <Send size={16} className="mr-2" />
                Send
              </Button>
              <Button variant="outline" size="sm">
                <Pin size={16} className="mr-2" />
                Pin
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="card-academic p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button variant="outline" className="justify-start">
            <Plus className="mr-2" size={18} />
            Create Announcement
          </Button>
          <Button variant="outline" className="justify-start">
            <Bell className="mr-2" size={18} />
            Send Reminder
          </Button>
          <Button variant="outline" className="justify-start">
            <Calendar className="mr-2" size={18} />
            Schedule Announcement
          </Button>
          <Button variant="outline" className="justify-start">
            <Users className="mr-2" size={18} />
            Bulk Message
          </Button>
        </div>
      </Card>
    </div>
  );
}
