import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { addSampleAnnouncements, checkAnnouncementsExist } from '@/utils/sampleAnnouncements';
import { 
  Megaphone, Calendar, Clock, User, BookOpen, AlertCircle, 
  Info, CheckCircle, Filter, Search, Pin, Star, Loader2, RefreshCw
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  type: 'academic' | 'technical' | 'general' | 'system';
  priority: 'high' | 'medium' | 'low';
  course?: string;
  courseCode?: string;
  instructor?: string;
  content: string;
  createdAt: any;
  isRead: boolean;
  isPinned: boolean;
  attachments?: string[];
  authorId: string;
  authorName: string;
  targetAudience: 'all' | 'students' | 'faculty' | 'specific_course';
  courseId?: string;
  readBy?: string[];
}

export default function StudentAnnouncements() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingSamples, setAddingSamples] = useState(false);

  // Fetch announcements from Firebase
  const fetchAnnouncements = async () => {
    try {
      setError(null);
      const announcementsRef = collection(db, 'announcements');
      
      // Approach 1: Get all announcements and filter client-side (no index needed)
      // This is more reliable and doesn't require Firebase index configuration
      const q = query(
        announcementsRef,
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const announcementsData: Announcement[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filter for announcements visible to students
        if (data.targetAudience === 'all' || data.targetAudience === 'students') {
          announcementsData.push({
            id: doc.id,
            title: data.title || '',
            type: data.type || 'general',
            priority: data.priority || 'medium',
            course: data.course || 'General',
            courseCode: data.courseCode || 'ALL',
            instructor: data.instructor || data.authorName || 'System',
            content: data.content || '',
            createdAt: data.createdAt,
            isRead: data.readBy?.includes(user?.id) || false,
            isPinned: data.isPinned || false,
            attachments: data.attachments || [],
            authorId: data.authorId || '',
            authorName: data.authorName || 'System',
            targetAudience: data.targetAudience || 'all',
            courseId: data.courseId || '',
            readBy: data.readBy || []
          });
        }
      });
      
      setAnnouncements(announcementsData);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Alternative approach using server-side filtering (requires Firebase index)
  // Uncomment this and comment out the above function if you want to use server-side filtering
  /*
  const fetchAnnouncementsWithIndex = async () => {
    try {
      setError(null);
      const announcementsRef = collection(db, 'announcements');
      
      // This requires a composite index in Firebase Console:
      // Collection: announcements
      // Fields: targetAudience (Ascending), createdAt (Descending)
      const q = query(
        announcementsRef,
        where('targetAudience', 'in', ['all', 'students']),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const announcementsData: Announcement[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        announcementsData.push({
          id: doc.id,
          title: data.title || '',
          type: data.type || 'general',
          priority: data.priority || 'medium',
          course: data.course || 'General',
          courseCode: data.courseCode || 'ALL',
          instructor: data.instructor || data.authorName || 'System',
          content: data.content || '',
          createdAt: data.createdAt,
          isRead: data.readBy?.includes(user?.id) || false,
          isPinned: data.isPinned || false,
          attachments: data.attachments || [],
          authorId: data.authorId || '',
          authorName: data.authorName || 'System',
          targetAudience: data.targetAudience || 'all',
          courseId: data.courseId || '',
          readBy: data.readBy || []
        });
      });
      
      setAnnouncements(announcementsData);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  */

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [user]);

  // Mark announcement as read
  const markAsRead = async (announcementId: string) => {
    try {
      const announcementRef = doc(db, 'announcements', announcementId);
      const currentAnnouncement = announcements.find(a => a.id === announcementId);
      
      // Get current readBy array or create new one
      const currentReadBy = currentAnnouncement?.readBy || [];
      const updatedReadBy = [...currentReadBy, user?.id];
      
      await updateDoc(announcementRef, {
        readBy: updatedReadBy
      });
      
      // Update local state
      setAnnouncements(prev => 
        prev.map(announcement => 
          announcement.id === announcementId 
            ? { ...announcement, isRead: true }
            : announcement
        )
      );
    } catch (err) {
      console.error('Error marking announcement as read:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements();
  };

  const handleAddSampleData = async () => {
    setAddingSamples(true);
    try {
      const success = await addSampleAnnouncements();
      if (success) {
        await fetchAnnouncements();
      }
    } catch (err) {
      console.error('Error adding sample data:', err);
    } finally {
      setAddingSamples(false);
    }
  };

  // Get unique courses from announcements
  const courses = ['General', ...new Set(announcements.map(a => a.course).filter(Boolean))];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'academic':
        return <BookOpen className="w-4 h-4 text-primary" />;
      case 'technical':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'general':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Megaphone className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    };
    return <Badge variant={variants[priority as keyof typeof variants] || 'outline'}>{priority}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      academic: 'default',
      technical: 'secondary',
      general: 'outline'
    };
    return <Badge variant={variants[type as keyof typeof variants] || 'outline'}>{type}</Badge>;
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || announcement.type === filterType;
    const matchesCourse = filterCourse === 'all' || announcement.course === filterCourse;
    return matchesSearch && matchesType && matchesCourse;
  });

  const unreadCount = announcements.filter(a => !a.isRead).length;
  const pinnedCount = announcements.filter(a => a.isPinned).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading announcements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-destructive" />
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Announcements</h1>
          <p className="text-muted-foreground">Stay updated with course and system announcements</p>
        </div>
        <div className="flex gap-2">
          {announcements.length === 0 && (
            <Button 
              onClick={handleAddSampleData} 
              variant="default" 
              size="sm" 
              disabled={addingSamples}
            >
              {addingSamples ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Megaphone className="w-4 h-4 mr-2" />
              )}
              Add Sample Data
            </Button>
          )}
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Megaphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{announcements.length}</p>
            </div>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <AlertCircle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unread</p>
              <p className="text-2xl font-bold">{unreadCount}</p>
            </div>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Read</p>
              <p className="text-2xl font-bold">{announcements.length - unreadCount}</p>
            </div>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <Pin className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pinned</p>
              <p className="text-2xl font-bold">{pinnedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-academic p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course} value={course}>{course}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements
          .sort((a, b) => {
            // Sort by pinned first, then by date
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
          .map((announcement) => (
          <Card 
            key={announcement.id} 
            className={`card-academic p-6 ${!announcement.isRead ? 'border-l-4 border-l-primary' : ''}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {announcement.isPinned && <Pin className="w-4 h-4 text-accent" />}
                  {getTypeIcon(announcement.type)}
                  <h3 className="text-xl font-semibold">{announcement.title}</h3>
                  {getPriorityBadge(announcement.priority)}
                  {getTypeBadge(announcement.type)}
                  {!announcement.isRead && (
                    <Badge variant="destructive" className="animate-pulse">New</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{announcement.courseCode} - {announcement.course}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{announcement.instructor}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{announcement.createdAt?.toDate ? announcement.createdAt.toDate().toLocaleDateString() : new Date(announcement.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{announcement.createdAt?.toDate ? announcement.createdAt.toDate().toLocaleTimeString() : new Date(announcement.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {announcement.content}
                </p>

                {announcement.attachments && announcement.attachments.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Attachments:</p>
                    <div className="flex flex-wrap gap-2">
                      {announcement.attachments.map((file, index) => (
                        <Button key={index} variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          {file}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Details
                </Button>
                {!announcement.isRead && (
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => markAsRead(announcement.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Read
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Star className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Pin className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredAnnouncements.length === 0 && announcements.length === 0 && (
        <Card className="card-academic p-12 text-center">
          <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No announcements available</h3>
          <p className="text-muted-foreground mb-4">
            There are currently no announcements to display. Check back later for updates from your instructors and administrators.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleAddSampleData} variant="default" disabled={addingSamples}>
              {addingSamples ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Megaphone className="w-4 h-4 mr-2" />
              )}
              Add Sample Data
            </Button>
          </div>
        </Card>
      )}

      {filteredAnnouncements.length === 0 && announcements.length > 0 && (
        <Card className="card-academic p-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No announcements match your filters</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or clearing the filters to see all announcements.
          </p>
          <Button 
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setFilterCourse('all');
            }}
            variant="outline"
            className="mt-4"
          >
            Clear Filters
          </Button>
        </Card>
      )}
    </div>
  );
}
