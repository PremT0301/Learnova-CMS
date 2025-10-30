import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy, where, onSnapshot, limit } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  Search, 
  Filter,
  Users,
  Clock,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  User,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  Calendar,
  Timer
} from 'lucide-react';

type UserSession = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  device: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  location?: string;
  loginTime: string;
  lastActivity: string;
  status: 'active' | 'idle' | 'offline';
  actions: number;
  pages: string[];
  isSecure: boolean;
};

type ActivityLog = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failed' | 'warning';
};

type ActivityStats = {
  totalActiveUsers: number;
  totalSessions: number;
  averageSessionTime: number;
  suspiciousActivities: number;
  failedLogins: number;
  newUsersToday: number;
  peakConcurrency: number;
  deviceBreakdown: { [key: string]: number };
  browserBreakdown: { [key: string]: number };
  osBreakdown: { [key: string]: number };
  topPages: { [key: string]: number };
  hourlyActivity: { [key: string]: number };
};

type SuspiciousActivity = {
  id: string;
  userId: string;
  userName: string;
  type: 'multiple_failed_logins' | 'unusual_location' | 'rapid_actions' | 'privilege_escalation' | 'bulk_operations';
  description: string;
  severity: 'medium' | 'high' | 'critical';
  timestamp: string;
  details: any;
  resolved: boolean;
};

export default function UserActivityMonitoring() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<UserSession[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'faculty' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'idle' | 'offline'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [stats, setStats] = useState<ActivityStats>({
    totalActiveUsers: 0,
    totalSessions: 0,
    averageSessionTime: 0,
    suspiciousActivities: 0,
    failedLogins: 0,
    newUsersToday: 0,
    peakConcurrency: 0,
    deviceBreakdown: {},
    browserBreakdown: {},
    osBreakdown: {},
    topPages: {},
    hourlyActivity: {}
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Load user sessions (mock data for demo)
      const mockSessions: UserSession[] = [
        {
          id: '1',
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          userRole: 'student',
          sessionId: 'sess_123',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          device: 'desktop',
          browser: 'Chrome',
          os: 'Windows 10',
          location: 'New York, US',
          loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          status: 'active',
          actions: 45,
          pages: ['/dashboard', '/courses', '/grades'],
          isSecure: true
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'Jane Smith',
          userEmail: 'jane@example.com',
          userRole: 'faculty',
          sessionId: 'sess_456',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          device: 'mobile',
          browser: 'Safari',
          os: 'iOS 15',
          location: 'Los Angeles, US',
          loginTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          lastActivity: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          status: 'idle',
          actions: 12,
          pages: ['/dashboard', '/gradebook'],
          isSecure: true
        },
        {
          id: '3',
          userId: 'user3',
          userName: 'Admin User',
          userEmail: 'admin@example.com',
          userRole: 'admin',
          sessionId: 'sess_789',
          ipAddress: '10.0.0.50',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          device: 'desktop',
          browser: 'Chrome',
          os: 'macOS',
          location: 'San Francisco, US',
          loginTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          lastActivity: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
          status: 'active',
          actions: 78,
          pages: ['/admin', '/admin/users', '/admin/analytics'],
          isSecure: true
        }
      ];

      // Load activity logs (mock data for demo)
      const mockLogs: ActivityLog[] = [
        {
          id: '1',
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          userRole: 'student',
          action: 'login',
          resource: 'authentication',
          details: { method: 'email_password' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          severity: 'low',
          status: 'success'
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'Jane Smith',
          userEmail: 'jane@example.com',
          userRole: 'faculty',
          action: 'grade_submission',
          resource: 'gradebook',
          details: { courseId: 'course1', assignmentId: 'assign1' },
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          severity: 'medium',
          status: 'success'
        },
        {
          id: '3',
          userId: 'user3',
          userName: 'Admin User',
          userEmail: 'admin@example.com',
          userRole: 'admin',
          action: 'user_creation',
          resource: 'user_management',
          details: { newUserId: 'user4', role: 'student' },
          ipAddress: '10.0.0.50',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          severity: 'high',
          status: 'success'
        },
        {
          id: '4',
          userId: 'unknown',
          userName: 'Unknown User',
          userEmail: 'hacker@evil.com',
          userRole: 'unknown',
          action: 'failed_login',
          resource: 'authentication',
          details: { attempts: 5, blocked: true },
          ipAddress: '203.0.113.42',
          userAgent: 'curl/7.68.0',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          severity: 'critical',
          status: 'failed'
        }
      ];

      // Load suspicious activities (mock data for demo)
      const mockSuspicious: SuspiciousActivity[] = [
        {
          id: '1',
          userId: 'unknown',
          userName: 'Unknown User',
          type: 'multiple_failed_logins',
          description: 'Multiple failed login attempts from suspicious IP',
          severity: 'critical',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          details: { ip: '203.0.113.42', attempts: 5 },
          resolved: false
        },
        {
          id: '2',
          userId: 'user1',
          userName: 'John Doe',
          type: 'unusual_location',
          description: 'Login from unusual geographic location',
          severity: 'medium',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          details: { previousLocation: 'New York', currentLocation: 'Moscow' },
          resolved: false
        }
      ];

      setSessions(mockSessions);
      setFilteredSessions(mockSessions);
      setActivityLogs(mockLogs);
      setFilteredLogs(mockLogs);
      setSuspiciousActivities(mockSuspicious);

      // Calculate stats
      const totalActiveUsers = mockSessions.filter(s => s.status === 'active').length;
      const totalSessions = mockSessions.length;
      const averageSessionTime = mockSessions.reduce((sum, s) => {
        const loginTime = new Date(s.loginTime).getTime();
        const lastActivity = new Date(s.lastActivity).getTime();
        return sum + (lastActivity - loginTime);
      }, 0) / totalSessions / (1000 * 60 * 60); // Convert to hours

      const deviceBreakdown = mockSessions.reduce((acc, s) => {
        acc[s.device] = (acc[s.device] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const browserBreakdown = mockSessions.reduce((acc, s) => {
        acc[s.browser] = (acc[s.browser] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const osBreakdown = mockSessions.reduce((acc, s) => {
        acc[s.os] = (acc[s.os] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const topPages = mockSessions.reduce((acc, s) => {
        s.pages.forEach(page => {
          acc[page] = (acc[page] || 0) + 1;
        });
        return acc;
      }, {} as { [key: string]: number });

      setStats({
        totalActiveUsers,
        totalSessions,
        averageSessionTime,
        suspiciousActivities: mockSuspicious.length,
        failedLogins: mockLogs.filter(l => l.action === 'failed_login').length,
        newUsersToday: 2, // Mock data
        peakConcurrency: 15, // Mock data
        deviceBreakdown,
        browserBreakdown,
        osBreakdown,
        topPages,
        hourlyActivity: {} // Would be calculated from real data
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'Failed to load activity data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Set up real-time listeners for live updates
    const sessionsQuery = query(collection(db, 'user_sessions'), orderBy('lastActivity', 'desc'), limit(50));
    const sessionsUnsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserSession[];
      setSessions(sessionsData);
    });

    const logsQuery = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(100));
    const logsUnsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
      setActivityLogs(logsData);
    });

    return () => {
      sessionsUnsubscribe();
      logsUnsubscribe();
    };
  }, []);

  useEffect(() => {
    let filtered = sessions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.ipAddress.includes(searchTerm)
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(session => session.userRole === roleFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    setFilteredSessions(filtered);
  }, [sessions, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    let filtered = activityLogs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by severity
    if (severityFilter !== 'all') {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }

    setFilteredLogs(filtered);
  }, [activityLogs, searchTerm, severityFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'idle':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'desktop':
        return <Monitor size={16} />;
      case 'mobile':
        return <Smartphone size={16} />;
      case 'tablet':
        return <Tablet size={16} />;
      default:
        return <User size={16} />;
    }
  };

  const formatDuration = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">User Activity Monitoring</h1>
          <p className="text-muted-foreground">Real-time monitoring of user sessions and activities.</p>
        </div>
        <Button
          onClick={loadData}
          variant="outline"
          className="btn-secondary"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Users className="text-green-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold">{stats.totalActiveUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Activity className="text-blue-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Timer className="text-purple-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Avg Session</p>
              <p className="text-2xl font-bold">{stats.averageSessionTime.toFixed(1)}h</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Suspicious</p>
              <p className="text-2xl font-bold">{stats.suspiciousActivities}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="activities">Activity Logs</TabsTrigger>
          <TabsTrigger value="security">Security Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          {/* Filters */}
          <Card className="card-academic p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} />
                <span className="font-medium">Filters:</span>
              </div>
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users, emails, or IP addresses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Sessions List */}
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Active Sessions ({filteredSessions.length})</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading sessions...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No active sessions found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <div key={session.id} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-lg">{session.userName}</h3>
                          <Badge variant="outline">{session.userRole}</Badge>
                          <Badge className={`${getStatusColor(session.status)} border`}>
                            {session.status}
                          </Badge>
                          {session.isSecure ? (
                            <Lock className="text-green-500" size={16} />
                          ) : (
                            <Unlock className="text-red-500" size={16} />
                          )}
                        </div>
                        <div className="grid md:grid-cols-5 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Globe size={14} />
                            <span>{session.ipAddress}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(session.device)}
                            <span>{session.device} • {session.browser}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} />
                            <span>{session.location || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>Last: {formatDuration(session.lastActivity)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity size={14} />
                            <span>{session.actions} actions</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">Pages visited:</span>
                          <div className="flex flex-wrap gap-1">
                            {session.pages.slice(0, 3).map((page, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {page}
                              </Badge>
                            ))}
                            {session.pages.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{session.pages.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          {/* Activity Logs */}
          <Card className="card-academic p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Activity Logs ({filteredLogs.length})</h2>
              <Select value={severityFilter} onValueChange={(value: any) => setSeverityFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading activity logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <Activity size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No activity logs found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-lg">{log.userName}</h3>
                          <Badge variant="outline">{log.userRole}</Badge>
                          <Badge className={`${getSeverityColor(log.severity)} border`}>
                            {log.severity}
                          </Badge>
                          <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                            {log.status}
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Activity size={14} />
                            <span>{log.action.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe size={14} />
                            <span>{log.resource}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe size={14} />
                            <span>{log.ipAddress}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>{formatDuration(log.timestamp)}</span>
                          </div>
                        </div>
                        {log.details && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {JSON.stringify(log.details, null, 2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="security">
          {/* Security Alerts */}
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Security Alerts ({suspiciousActivities.length})</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading security alerts...</p>
              </div>
            ) : suspiciousActivities.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="text-green-500" size={48} className="mx-auto mb-4" />
                <p className="text-muted-foreground">No security alerts at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {suspiciousActivities.map((alert) => (
                  <div key={alert.id} className={`p-4 border rounded-lg ${alert.resolved ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className="text-red-500" size={20} />
                          <h3 className="font-medium text-lg">{alert.userName}</h3>
                          <Badge className={`${getSeverityColor(alert.severity)} border`}>
                            {alert.severity}
                          </Badge>
                          {alert.resolved ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Resolved
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Type: {alert.type.replace('_', ' ')}</span>
                          <span>Time: {formatDuration(alert.timestamp)}</span>
                        </div>
                        {alert.details && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Details: {JSON.stringify(alert.details, null, 2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
