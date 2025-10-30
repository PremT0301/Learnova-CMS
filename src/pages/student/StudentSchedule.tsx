import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar as CalendarIcon, Clock, MapPin, User, BookOpen, 
  Bell, Plus, Filter, ChevronLeft, ChevronRight,
  GraduationCap, Coffee, Users, AlertCircle
} from 'lucide-react';

export default function StudentSchedule() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState('week');
  const [selectedSemester, setSelectedSemester] = useState('spring2024');

  // Sample schedule data
  const scheduleData = [
    {
      id: '1',
      title: 'Data Structures & Algorithms',
      code: 'CS-301',
      instructor: 'Prof. Chen',
      type: 'lecture',
      day: 'Monday',
      time: '10:00 AM - 11:30 AM',
      room: 'CS-101',
      building: 'Computer Science Building',
      startTime: '10:00',
      endTime: '11:30',
      color: 'bg-blue-500'
    },
    {
      id: '2',
      title: 'Database Management Systems',
      code: 'CS-401',
      instructor: 'Dr. Smith',
      type: 'lecture',
      day: 'Monday',
      time: '2:00 PM - 3:30 PM',
      room: 'CS-205',
      building: 'Computer Science Building',
      startTime: '14:00',
      endTime: '15:30',
      color: 'bg-green-500'
    },
    {
      id: '3',
      title: 'Web Development Lab',
      code: 'CS-350L',
      instructor: 'Prof. Johnson',
      type: 'lab',
      day: 'Tuesday',
      time: '1:00 PM - 3:00 PM',
      room: 'CS-LAB-1',
      building: 'Computer Science Building',
      startTime: '13:00',
      endTime: '15:00',
      color: 'bg-purple-500'
    },
    {
      id: '4',
      title: 'Data Structures & Algorithms',
      code: 'CS-301',
      instructor: 'Prof. Chen',
      type: 'discussion',
      day: 'Wednesday',
      time: '11:00 AM - 12:00 PM',
      room: 'CS-103',
      building: 'Computer Science Building',
      startTime: '11:00',
      endTime: '12:00',
      color: 'bg-blue-500'
    },
    {
      id: '5',
      title: 'Database Management Systems',
      code: 'CS-401',
      instructor: 'Dr. Smith',
      type: 'lab',
      day: 'Wednesday',
      time: '3:00 PM - 5:00 PM',
      room: 'CS-LAB-2',
      building: 'Computer Science Building',
      startTime: '15:00',
      endTime: '17:00',
      color: 'bg-green-500'
    },
    {
      id: '6',
      title: 'Web Development',
      code: 'CS-350',
      instructor: 'Prof. Johnson',
      type: 'lecture',
      day: 'Thursday',
      time: '9:00 AM - 10:30 AM',
      room: 'CS-201',
      building: 'Computer Science Building',
      startTime: '09:00',
      endTime: '10:30',
      color: 'bg-purple-500'
    },
    {
      id: '7',
      title: 'Office Hours',
      code: 'CS-301',
      instructor: 'Prof. Chen',
      type: 'office_hours',
      day: 'Friday',
      time: '2:00 PM - 4:00 PM',
      room: 'CS-301',
      building: 'Computer Science Building',
      startTime: '14:00',
      endTime: '16:00',
      color: 'bg-orange-500'
    }
  ];

  const upcomingEvents = [
    {
      id: '1',
      title: 'Midterm Exam - CS-301',
      date: '2024-02-15',
      time: '2:00 PM - 4:00 PM',
      type: 'exam',
      location: 'CS-101',
      description: 'Data Structures & Algorithms Midterm'
    },
    {
      id: '2',
      title: 'Project Due - CS-401',
      date: '2024-02-20',
      time: '11:59 PM',
      type: 'assignment',
      location: 'Online',
      description: 'Database Design Project Submission'
    },
    {
      id: '3',
      title: 'Career Fair',
      date: '2024-02-25',
      time: '10:00 AM - 3:00 PM',
      type: 'event',
      location: 'Student Union',
      description: 'Annual University Career Fair'
    }
  ];

  const getDaySchedule = (day: string) => {
    return scheduleData.filter(item => item.day === day);
  };

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return getDaySchedule(today);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lecture':
        return <BookOpen className="w-4 h-4" />;
      case 'lab':
        return <GraduationCap className="w-4 h-4" />;
      case 'discussion':
        return <Users className="w-4 h-4" />;
      case 'office_hours':
        return <Coffee className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      lecture: 'default',
      lab: 'secondary',
      discussion: 'outline',
      office_hours: 'destructive',
      exam: 'destructive',
      assignment: 'secondary',
      event: 'default'
    };
    return <Badge variant={variants[type as keyof typeof variants] || 'outline'}>{type}</Badge>;
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">My Schedule</h1>
        <p className="text-muted-foreground">View your class schedule and upcoming events</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Classes</p>
              <p className="text-2xl font-bold">{scheduleData.length}</p>
            </div>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <Clock className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Classes</p>
              <p className="text-2xl font-bold">{getTodaySchedule().length}</p>
            </div>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <AlertCircle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upcoming Events</p>
              <p className="text-2xl font-bold">{upcomingEvents.length}</p>
            </div>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <CalendarIcon className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Semester</p>
              <p className="text-2xl font-bold">Spring 2024</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Schedule View */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-academic p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Weekly Schedule</h2>
              <div className="flex gap-2">
                <Select value={viewMode} onValueChange={setViewMode}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </div>
            </div>

            {viewMode === 'week' && (
              <div className="space-y-4">
                {daysOfWeek.slice(0, 5).map((day) => {
                  const daySchedule = getDaySchedule(day);
                  return (
                    <div key={day} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3 text-lg">{day}</h3>
                      {daySchedule.length > 0 ? (
                        <div className="space-y-2">
                          {daySchedule.map((item) => (
                            <div key={item.id} className={`p-3 rounded-lg ${item.color} text-white`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{item.title}</h4>
                                  <p className="text-sm opacity-90">{item.code}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm">{item.time}</p>
                                  <p className="text-xs opacity-90">{item.room}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No classes scheduled</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="space-y-3">
                {scheduleData.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(item.type)}
                      <div>
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.code} • {item.instructor}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.day}</p>
                      <p className="text-sm text-muted-foreground">{item.time}</p>
                      <p className="text-xs text-muted-foreground">{item.room}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
            <div className="space-y-3">
              {getTodaySchedule().length > 0 ? (
                getTodaySchedule().map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(item.type)}
                      <h4 className="font-medium text-sm">{item.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                    <p className="text-xs text-muted-foreground">{item.room}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No classes today</p>
              )}
            </div>
          </Card>

          {/* Upcoming Events */}
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    {getTypeBadge(event.type)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <CalendarIcon className="w-3 h-3" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Clock className="w-3 h-3" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{event.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Calendar */}
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Calendar</h2>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
