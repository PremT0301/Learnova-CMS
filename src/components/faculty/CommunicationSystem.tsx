import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { communicationService, Message, Notification, BroadcastMessage } from '@/services/communicationService';
import { facultyCourseService } from '@/services/facultyService';
import { 
  Mail, Send, Plus, Eye, Trash2, Bell, Users, 
  MessageSquare, Megaphone, Search, Filter,
  Clock, User, BookOpen, AlertCircle, CheckCircle,
  Paperclip, Download, Reply, Forward
} from 'lucide-react';

export default function CommunicationSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('messages');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Message composition
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageForm, setMessageForm] = useState({
    recipientId: '',
    recipientName: '',
    subject: '',
    content: '',
    priority: 'normal',
    type: 'message'
  });

  // Broadcast composition
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    content: '',
    recipientType: 'course_students',
    courseId: '',
    userIds: []
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [messagesData, sentData, notificationsData, broadcastsData, coursesData] = await Promise.all([
        communicationService.getMessages(user.id),
        communicationService.getSentMessages(user.id),
        communicationService.getNotifications(user.id),
        communicationService.getBroadcasts(user.id),
        facultyCourseService.getFacultyCourses(user.id)
      ]);
      
      setMessages(messagesData);
      setSentMessages(sentData);
      setNotifications(notificationsData);
      setBroadcasts(broadcastsData);
      setCourses(coursesData.map(course => ({
        id: course.id,
        name: `${course.code}: ${course.title}`
      })));
      
      // Load students for selected courses
      if (coursesData.length > 0) {
        const studentsData = await facultyCourseService.getCourseStudents(coursesData[0].id);
        setStudents(studentsData);
      }
    } catch (error) {
      console.error('Error loading communication data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load communication data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageForm.recipientId || !messageForm.subject || !messageForm.content) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      await communicationService.sendMessage({
        senderId: user.id,
        senderName: user.name,
        senderRole: 'faculty',
        recipientId: messageForm.recipientId,
        recipientName: messageForm.recipientName,
        recipientRole: 'student',
        subject: messageForm.subject,
        content: messageForm.content,
        type: messageForm.type as any,
        priority: messageForm.priority as any
      });

      setMessageForm({
        recipientId: '',
        recipientName: '',
        subject: '',
        content: '',
        priority: 'normal',
        type: 'message'
      });
      setShowMessageDialog(false);
      
      toast({
        title: 'Success',
        description: 'Message sent successfully'
      });
      
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.content) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const broadcast = await communicationService.createBroadcast({
        senderId: user.id,
        senderName: user.name,
        title: broadcastForm.title,
        content: broadcastForm.content,
        recipientType: broadcastForm.recipientType as any,
        courseId: broadcastForm.courseId || undefined,
        userIds: broadcastForm.userIds.length > 0 ? broadcastForm.userIds : undefined
      });

      // Send the broadcast
      await communicationService.sendBroadcast(broadcast.id);

      setBroadcastForm({
        title: '',
        content: '',
        recipientType: 'course_students',
        courseId: '',
        userIds: []
      });
      setShowBroadcastDialog(false);
      
      toast({
        title: 'Success',
        description: 'Broadcast sent successfully'
      });
      
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast({
        title: 'Error',
        description: 'Failed to send broadcast',
        variant: 'destructive'
      });
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await communicationService.markMessageAsRead(messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await communicationService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast({
        title: 'Success',
        description: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive'
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Megaphone className="w-4 h-4" />;
      case 'assignment_reminder': return <BookOpen className="w-4 h-4" />;
      case 'grade_notification': return <CheckCircle className="w-4 h-4" />;
      case 'system': return <AlertCircle className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         msg.senderName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || msg.type === filterType;
    const matchesPriority = filterPriority === 'all' || msg.priority === filterPriority;
    return matchesSearch && matchesType && matchesPriority;
  });

  const unreadCount = messages.filter(msg => !msg.isRead).length;
  const unreadNotifications = notifications.filter(notif => !notif.isRead).length;

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading communication system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Communication System</h1>
          <p className="text-muted-foreground">Manage messages, broadcasts, and notifications with students.</p>
        </div>
        <div className="flex gap-2">
          <Button className="btn-primary" onClick={() => setShowMessageDialog(true)}>
            <Plus size={20} className="mr-2" />
            New Message
          </Button>
          <Button variant="outline" onClick={() => setShowBroadcastDialog(true)}>
            <Megaphone size={20} className="mr-2" />
            Broadcast
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unread Messages</p>
              <p className="text-2xl font-bold">{unreadCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <MessageSquare className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Messages</p>
              <p className="text-2xl font-bold">{messages.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <Bell className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Notifications</p>
              <p className="text-2xl font-bold">{unreadNotifications}</p>
            </div>
          </div>
        </Card>
        
        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <Megaphone className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Broadcasts Sent</p>
              <p className="text-2xl font-bold">{broadcasts.filter(b => b.status === 'sent').length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="messages">
            Messages
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent Messages</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
            {unreadNotifications > 0 && (
              <Badge className="ml-2 bg-warning text-warning-foreground text-xs">
                {unreadNotifications}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="message">Message</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="assignment_reminder">Assignment Reminder</SelectItem>
                <SelectItem value="grade_notification">Grade Notification</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredMessages.length === 0 ? (
            <Card className="card-academic p-6 text-center">
              <Mail size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Messages Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterType !== 'all' || filterPriority !== 'all'
                  ? "No messages match your criteria."
                  : "You don't have any messages yet."}
              </p>
              <Button className="btn-primary" onClick={() => setShowMessageDialog(true)}>
                <Plus size={20} className="mr-2" />
                Send Message
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredMessages.map((message) => (
                <Card 
                  key={message.id} 
                  className={`card-academic p-6 cursor-pointer transition-all ${
                    !message.isRead ? 'border-primary/20 bg-primary/5' : ''
                  }`}
                  onClick={() => handleMarkAsRead(message.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-muted">
                        {getTypeIcon(message.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          {message.subject}
                          {!message.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">From: {message.senderName}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {message.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getPriorityColor(message.priority)}>
                            {message.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.createdAt.toDate()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Reply size={16} />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Forward size={16} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMessage(message.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-6">
          <h2 className="text-2xl font-bold">Sent Messages</h2>
          
          {sentMessages.length === 0 ? (
            <Card className="card-academic p-6 text-center">
              <Send size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Sent Messages</h3>
              <p className="text-muted-foreground mb-4">You haven't sent any messages yet.</p>
              <Button className="btn-primary" onClick={() => setShowMessageDialog(true)}>
                <Plus size={20} className="mr-2" />
                Send Message
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sentMessages.map((message) => (
                <Card key={message.id} className="card-academic p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-success/10">
                        <Send className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{message.subject}</h3>
                        <p className="text-sm text-muted-foreground">To: {message.recipientName}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {message.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getPriorityColor(message.priority)}>
                            {message.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.createdAt.toDate()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <h2 className="text-2xl font-bold">Notifications</h2>
          
          {notifications.length === 0 ? (
            <Card className="card-academic p-6 text-center">
              <Bell size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Notifications</h3>
              <p className="text-muted-foreground">You don't have any notifications yet.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`card-academic p-6 ${
                    !notification.isRead ? 'border-primary/20 bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-warning/10">
                        <Bell className="w-6 h-6 text-warning" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt.toDate()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="broadcasts" className="space-y-6">
          <h2 className="text-2xl font-bold">Broadcasts</h2>
          
          {broadcasts.length === 0 ? (
            <Card className="card-academic p-6 text-center">
              <Megaphone size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Broadcasts</h3>
              <p className="text-muted-foreground mb-4">You haven't sent any broadcasts yet.</p>
              <Button className="btn-primary" onClick={() => setShowBroadcastDialog(true)}>
                <Plus size={20} className="mr-2" />
                Create Broadcast
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {broadcasts.map((broadcast) => (
                <Card key={broadcast.id} className="card-academic p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-accent/10">
                        <Megaphone className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{broadcast.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {broadcast.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            className={
                              broadcast.status === 'sent' ? 'bg-success/10 text-success' :
                              broadcast.status === 'scheduled' ? 'bg-warning/10 text-warning' :
                              'bg-muted/10 text-muted-foreground'
                            }
                          >
                            {broadcast.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {broadcast.sentAt ? 
                              new Date(broadcast.sentAt.toDate()).toLocaleDateString() :
                              new Date(broadcast.createdAt.toDate()).toLocaleDateString()
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Send Message Dialog */}
      {showMessageDialog && (
        <Dialog open={true} onOpenChange={() => setShowMessageDialog(false)}>
          <DialogContent className="sm:max-w-[600px] p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gradient-primary">
                Send Message
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient</Label>
                  <Select 
                    value={messageForm.recipientId} 
                    onValueChange={(value) => {
                      const student = students.find(s => s.id === value);
                      setMessageForm(prev => ({ 
                        ...prev, 
                        recipientId: value,
                        recipientName: student?.name || ''
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
                  <Input 
                    id="subject" 
                    value={messageForm.subject} 
                    onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter message subject"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Message Content <span className="text-red-500">*</span></Label>
                  <Textarea 
                    id="content" 
                    value={messageForm.content} 
                    onChange={(e) => setMessageForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter your message..."
                    rows={6}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={messageForm.priority} 
                      onValueChange={(value) => setMessageForm(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Message Type</Label>
                    <Select 
                      value={messageForm.type} 
                      onValueChange={(value) => setMessageForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="message">Message</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="assignment_reminder">Assignment Reminder</SelectItem>
                        <SelectItem value="grade_notification">Grade Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowMessageDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage} className="btn-primary">
                  <Send size={16} className="mr-2" />
                  Send Message
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Broadcast Dialog */}
      {showBroadcastDialog && (
        <Dialog open={true} onOpenChange={() => setShowBroadcastDialog(false)}>
          <DialogContent className="sm:max-w-[600px] p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gradient-primary">
                Create Broadcast
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Broadcast Title <span className="text-red-500">*</span></Label>
                  <Input 
                    id="title" 
                    value={broadcastForm.title} 
                    onChange={(e) => setBroadcastForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter broadcast title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Broadcast Content <span className="text-red-500">*</span></Label>
                  <Textarea 
                    id="content" 
                    value={broadcastForm.content} 
                    onChange={(e) => setBroadcastForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter your broadcast message..."
                    rows={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipientType">Recipients</Label>
                  <Select 
                    value={broadcastForm.recipientType} 
                    onValueChange={(value) => setBroadcastForm(prev => ({ ...prev, recipientType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course_students">Course Students</SelectItem>
                      <SelectItem value="all_students">All Students</SelectItem>
                      <SelectItem value="all_faculty">All Faculty</SelectItem>
                      <SelectItem value="specific_users">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {broadcastForm.recipientType === 'course_students' && (
                  <div className="space-y-2">
                    <Label htmlFor="courseId">Select Course</Label>
                    <Select 
                      value={broadcastForm.courseId} 
                      onValueChange={(value) => setBroadcastForm(prev => ({ ...prev, courseId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <DialogFooter className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowBroadcastDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendBroadcast} className="btn-primary">
                  <Megaphone size={16} className="mr-2" />
                  Send Broadcast
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
