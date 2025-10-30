import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { facultyCourseService } from '@/services/facultyService';
import { 
  Plus, Calendar, Clock, MapPin, Users, BookOpen, 
  Edit, Trash2, Search, Filter, Download, Upload, 
  Grid3X3, List, Eye, CalendarDays
} from 'lucide-react';

export default function FacultyScheduling() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    type: 'lecture',
    capacity: 50,
    isRecurring: false,
    recurringPattern: 'weekly',
    recurringEndDate: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadCourses();
      loadSchedules();
    }
  }, [user]);

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
    }
  };

  const loadSchedules = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Mock data for now - replace with actual Firebase call
      const mockSchedules = [
        {
          id: '1',
          title: 'Data Structures Lecture',
          description: 'Introduction to Binary Trees and Traversal Algorithms',
          courseId: '1',
          courseName: 'CS-301: Data Structures & Algorithms',
          date: '2024-01-22',
          startTime: '10:00',
          endTime: '11:30',
          location: 'Room 101, Computer Science Building',
          type: 'lecture',
          capacity: 50,
          enrolled: 45,
          isRecurring: true,
          recurringPattern: 'weekly',
          facultyId: user.id,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Database Lab Session',
          description: 'Hands-on SQL query practice and database design',
          courseId: '2',
          courseName: 'CS-401: Database Management Systems',
          date: '2024-01-23',
          startTime: '14:00',
          endTime: '16:00',
          location: 'Lab 205, Engineering Building',
          type: 'lab',
          capacity: 30,
          enrolled: 38,
          isRecurring: false,
          facultyId: user.id,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Software Engineering Office Hours',
          description: 'Drop-in office hours for project consultations',
          courseId: '3',
          courseName: 'CS-450: Software Engineering',
          date: '2024-01-24',
          startTime: '15:00',
          endTime: '17:00',
          location: 'Office 302, Faculty Building',
          type: 'office_hours',
          capacity: 10,
          enrolled: 8,
          isRecurring: true,
          recurringPattern: 'weekly',
          facultyId: user.id,
          createdAt: new Date().toISOString()
        }
      ];
      setSchedules(mockSchedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load schedules',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = () => {
    setEditingSchedule(null);
    setFormData({
      title: '',
      description: '',
      courseId: courses.length > 0 ? courses[0].id : '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      type: 'lecture',
      capacity: 50,
      isRecurring: false,
      recurringPattern: 'weekly',
      recurringEndDate: ''
    });
    setShowScheduleForm(true);
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title,
      description: schedule.description,
      courseId: schedule.courseId,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      location: schedule.location,
      type: schedule.type,
      capacity: schedule.capacity,
      isRecurring: schedule.isRecurring,
      recurringPattern: schedule.recurringPattern,
      recurringEndDate: schedule.recurringEndDate || ''
    });
    setShowScheduleForm(true);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      // Mock deletion - replace with actual Firebase call
      setSchedules(schedules.filter(s => s.id !== scheduleId));
      toast({
        title: 'Success',
        description: 'Schedule deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete schedule',
        variant: 'destructive'
      });
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!user?.id || !formData.title || !formData.courseId || !formData.date || !formData.startTime || !formData.endTime) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const scheduleData = {
        ...formData,
        facultyId: user.id,
        courseName: courses.find(c => c.id === formData.courseId)?.name || 'Unknown Course',
        enrolled: 0, // Will be calculated from actual enrollments
        createdAt: editingSchedule ? editingSchedule.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingSchedule) {
        // Mock update - replace with actual Firebase call
        setSchedules(schedules.map(s => s.id === editingSchedule.id ? { ...s, ...scheduleData } : s));
        toast({
          title: 'Success',
          description: 'Schedule updated successfully.'
        });
      } else {
        // Mock create - replace with actual Firebase call
        const newSchedule = {
          ...scheduleData,
          id: Date.now().toString()
        };
        setSchedules([...schedules, newSchedule]);
        toast({
          title: 'Success',
          description: 'Schedule created successfully.'
        });
      }
      setShowScheduleForm(false);
      setEditingSchedule(null);
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'Error',
        description: `Failed to save schedule: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || schedule.courseId === selectedCourse;
    const matchesType = filterType === 'all' || schedule.type === filterType;
    return matchesSearch && matchesCourse && matchesType;
  });

  const getTypeColor = (type) => {
    switch (type) {
      case 'lecture': return 'bg-primary/10 text-primary';
      case 'lab': return 'bg-success/10 text-success';
      case 'office_hours': return 'bg-warning/10 text-warning';
      case 'exam': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'lecture': return <BookOpen size={16} />;
      case 'lab': return <Users size={16} />;
      case 'office_hours': return <Clock size={16} />;
      case 'exam': return <Award size={16} />;
      default: return <Calendar size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Schedule & Events</h1>
          <p className="text-muted-foreground">Manage your class schedules, office hours, and events. View your calendar and schedule overview.</p>
        </div>
        <Button className="btn-primary" onClick={handleCreateSchedule}>
          <Plus size={20} className="mr-2" />
          Create Schedule
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="card-academic p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search schedules..."
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
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="lecture">Lecture</SelectItem>
              <SelectItem value="lab">Lab</SelectItem>
              <SelectItem value="office_hours">Office Hours</SelectItem>
              <SelectItem value="exam">Exam</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarDays size={16} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Schedule Overview Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Schedules</p>
              <p className="text-2xl font-bold">{schedules.length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <Clock className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold">{schedules.filter(s => {
                const scheduleDate = new Date(s.date);
                const now = new Date();
                const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
                return scheduleDate >= weekStart && scheduleDate <= weekEnd;
              }).length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <Users className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Capacity</p>
              <p className="text-2xl font-bold">{schedules.reduce((sum, s) => sum + s.capacity, 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <BookOpen className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Courses Covered</p>
              <p className="text-2xl font-bold">{new Set(schedules.map(s => s.courseId)).size}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Calendar or List View */}
      {viewMode === 'calendar' ? (
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3 mb-6">
            <CalendarDays className="text-primary" />
            <h2 className="text-lg font-semibold">Calendar View</h2>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - date.getDay() + i);
              const dateStr = date.toISOString().split('T')[0];
              const daySchedules = filteredSchedules.filter(s => s.date === dateStr);
              
              return (
                <div key={i} className={`min-h-[80px] p-2 border rounded-lg ${
                  date.getMonth() === new Date().getMonth() ? 'bg-background' : 'bg-muted/20'
                }`}>
                  <div className="text-sm font-medium mb-1">{date.getDate()}</div>
                  {daySchedules.slice(0, 2).map((schedule, idx) => (
                    <div key={idx} className={`text-xs p-1 rounded mb-1 truncate ${
                      schedule.type === 'lecture' ? 'bg-primary/10 text-primary' :
                      schedule.type === 'lab' ? 'bg-success/10 text-success' :
                      schedule.type === 'office_hours' ? 'bg-warning/10 text-warning' :
                      'bg-accent/10 text-accent'
                    }`}>
                      {schedule.startTime} - {schedule.title}
                    </div>
                  ))}
                  {daySchedules.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{daySchedules.length - 2} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <>
          {/* Schedules List */}
          {filteredSchedules.length === 0 ? (
        <Card className="card-academic p-6 text-center">
          <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Schedules Found</h2>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCourse !== 'all' || filterType !== 'all'
              ? "No schedules match your criteria."
              : "Start by creating your first schedule."}
          </p>
          <Button className="btn-primary" onClick={handleCreateSchedule}>
            <Plus size={20} className="mr-2" />
            Create Schedule
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSchedules.map((schedule) => (
            <Card key={schedule.id} className="card-academic p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold">{schedule.title}</h2>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(schedule.type)}`}>
                      {schedule.type.replace('_', ' ').toUpperCase()}
                    </span>
                    {schedule.isRecurring && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                        RECURRING
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{schedule.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-muted-foreground" />
                      <span>{new Date(schedule.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-muted-foreground" />
                      <span>{schedule.startTime} - {schedule.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-muted-foreground" />
                      <span>{schedule.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-muted-foreground" />
                      <span>{schedule.enrolled}/{schedule.capacity} enrolled</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditSchedule(schedule)}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteSchedule(schedule.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p><strong>Course:</strong> {schedule.courseName}</p>
                {schedule.isRecurring && (
                  <p><strong>Recurring:</strong> {schedule.recurringPattern} until {schedule.recurringEndDate || 'End of semester'}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
        </>
      )}

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <Dialog open={true} onOpenChange={() => {
          setShowScheduleForm(false);
          setEditingSchedule(null);
        }}>
          <DialogContent className="sm:max-w-[600px] p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gradient-primary">
                {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveSchedule} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                    <Input id="title" value={formData.title} onChange={handleChange} placeholder="e.g., Data Structures Lecture" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseId">Course <span className="text-red-500">*</span></Label>
                    <Select value={formData.courseId} onValueChange={(value) => handleSelectChange('courseId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Schedule Type</Label>
                    <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lecture">Lecture</SelectItem>
                        <SelectItem value="lab">Lab</SelectItem>
                        <SelectItem value="office_hours">Office Hours</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                    <Input id="date" type="date" value={formData.date} onChange={handleChange} required />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time <span className="text-red-500">*</span></Label>
                      <Input id="startTime" type="time" value={formData.startTime} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time <span className="text-red-500">*</span></Label>
                      <Input id="endTime" type="time" value={formData.endTime} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={formData.location} onChange={handleChange} placeholder="e.g., Room 101, CS Building" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input id="capacity" type="number" value={formData.capacity} onChange={handleChange} min="1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={formData.description} onChange={handleChange} placeholder="Schedule description..." rows={3} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    id="isRecurring"
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={handleChange}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isRecurring">Make this a recurring schedule</Label>
                </div>
                {formData.isRecurring && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recurringPattern">Recurring Pattern</Label>
                      <Select value={formData.recurringPattern} onValueChange={(value) => handleSelectChange('recurringPattern', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pattern" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recurringEndDate">End Date</Label>
                      <Input id="recurringEndDate" type="date" value={formData.recurringEndDate} onChange={handleChange} />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowScheduleForm(false);
                  setEditingSchedule(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    editingSchedule ? 'Update Schedule' : 'Create Schedule'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
