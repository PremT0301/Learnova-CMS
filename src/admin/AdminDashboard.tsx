import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Shield, GraduationCap, BarChart3, TrendingUp, Bell, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { 
  getAnalyticsData, 
  listenUsers, 
  listenAnnouncements, 
  listenPendingFacultyRequests,
  AnalyticsData,
  FacultyRequestDoc,
  AnnouncementDoc,
  User
} from '@/services/firebaseService';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all'|'student'|'faculty'|'admin'>('all');
  
  // Real-time data from Firebase
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementDoc[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FacultyRequestDoc[]>([]);

  // Computed stats
  const usersSummary = useMemo(() => {
    const students = users.filter(u => u.role === 'student').length;
    const faculty = users.filter(u => u.role === 'faculty').length;
    const admins = users.filter(u => u.role === 'admin').length;
    return { total: users.length, students, faculty, admins };
  }, [users]);

  const userGrowth = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

    const recentUsers = users.filter(u => u.joinDate && new Date(u.joinDate) >= lastMonth).length;
    const lastMonthUsers = users.filter(u => u.joinDate && new Date(u.joinDate) >= twoMonthsAgo && new Date(u.joinDate) < lastMonth).length;
    const twoMonthsAgoUsers = users.filter(u => u.joinDate && new Date(u.joinDate) >= threeMonthsAgo && new Date(u.joinDate) < twoMonthsAgo).length;

    return [
      { name: '3 Months Ago', value: twoMonthsAgoUsers },
      { name: '2 Months Ago', value: lastMonthUsers },
      { name: 'Last Month', value: recentUsers },
      { name: 'This Month', value: users.filter(u => u.joinDate && new Date(u.joinDate) >= new Date(now.getFullYear(), now.getMonth(), 1)).length },
    ];
  }, [users]);

  // Real-time Firebase listeners
  useEffect(() => {
    let unsubscribeUsers: (() => void) | undefined;
    let unsubscribeAnnouncements: (() => void) | undefined;
    let unsubscribeRequests: (() => void) | undefined;

    const initializeRealTimeData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load initial analytics data
        const analyticsData = await getAnalyticsData();
        setAnalytics(analyticsData);

        // Set up real-time listeners
        unsubscribeUsers = listenUsers((usersData) => {
          setUsers(usersData);
          setLoading(false);
        });

        unsubscribeAnnouncements = listenAnnouncements((announcementsData) => {
          setAnnouncements(announcementsData);
        });

        unsubscribeRequests = listenPendingFacultyRequests((requestsData) => {
          setPendingRequests(requestsData);
        });

      } catch (error) {
        console.error('Error initializing real-time data:', error);
        setError('Failed to load analytics');
        toast({ 
          title: 'Error', 
          description: 'Failed to load analytics data', 
          variant: 'destructive' 
        });
        setLoading(false);
      }
    };

    initializeRealTimeData();

    // Cleanup listeners on unmount
    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeAnnouncements) unsubscribeAnnouncements();
      if (unsubscribeRequests) unsubscribeRequests();
    };
  }, [toast]);

  const roleFilteredGrowth = useMemo(() => {
    // If role filter applied, adjust numbers proportionally based on summary
    if (roleFilter === 'all') return userGrowth;
    const map = { student: usersSummary.students, faculty: usersSummary.faculty, admin: usersSummary.admins } as const;
    const total = usersSummary.total || 1;
    const ratio = map[roleFilter] / total;
    return userGrowth.map((p) => ({ ...p, value: Math.round(p.value * ratio) }));
  }, [roleFilter, userGrowth, usersSummary]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Admin Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights and system overview.</p>
        </div>
        <div className="w-48">
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <Card key={idx} className="card-academic p-6">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse mb-3" />
              <div className="h-4 w-24 bg-muted animate-pulse mb-2" />
              <div className="h-6 w-16 bg-muted animate-pulse" />
            </Card>
          ))
        ) : (
          <>
            <Card className="card-academic p-6">
              <div className="flex items-center gap-3">
                <Users className="text-primary" size={24} />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{usersSummary.total}</p>
                </div>
              </div>
            </Card>
            <Card className="card-academic p-6">
              <div className="flex items-center gap-3">
                <GraduationCap className="text-success" size={24} />
                <div>
                  <p className="text-sm text-muted-foreground">Students</p>
                  <p className="text-2xl font-bold">{usersSummary.students}</p>
                </div>
              </div>
            </Card>
            <Card className="card-academic p-6">
              <div className="flex items-center gap-3">
                <Shield className="text-warning" size={24} />
                <div>
                  <p className="text-sm text-muted-foreground">Faculty</p>
                  <p className="text-2xl font-bold">{usersSummary.faculty}</p>
                </div>
              </div>
            </Card>
            <Card className="card-academic p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-accent" size={24} />
                <div>
                  <p className="text-sm text-muted-foreground">Courses</p>
                  <p className="text-2xl font-bold">{analytics?.totalCourses || 0}</p>
                </div>
              </div>
            </Card>
            <Card className="card-academic p-6">
              <div className="flex items-center gap-3">
                <Bell className="text-primary" size={24} />
                <div>
                  <p className="text-sm text-muted-foreground">Announcements</p>
                  <p className="text-2xl font-bold">{announcements.length}</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Pending Faculty Requests Alert */}
      {pendingRequests.length > 0 && (
        <Card className="card-academic p-4 border-warning/20 bg-warning/5">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-warning" size={24} />
            <div>
              <p className="font-semibold text-warning">Pending Faculty Requests</p>
              <p className="text-sm text-muted-foreground">
                {pendingRequests.length} faculty request{pendingRequests.length !== 1 ? 's' : ''} awaiting approval
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Real-time Activity Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-primary" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
              <p className="text-2xl font-bold">{analytics?.pendingApprovals || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-success" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Active Announcements</p>
              <p className="text-2xl font-bold">{announcements.length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-warning" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Assignments</p>
              <p className="text-2xl font-bold">{analytics?.totalAssignments || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {error && (
        <Card className="card-academic p-4">
          <p className="text-destructive">{error}</p>
        </Card>
      )}

      {/* Real-time Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 />
            <h2 className="text-lg font-semibold">User Growth (Real-time)</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roleFilteredGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="text-primary" />
            <h2 className="text-lg font-semibold">Users by Role (Live)</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Students', value: usersSummary.students, fill: '#10b981' },
                    { name: 'Faculty', value: usersSummary.faculty, fill: '#f59e0b' },
                    { name: 'Admins', value: usersSummary.admins, fill: '#ef4444' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Announcements */}
      <Card className="card-academic p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="text-primary" />
          <h2 className="text-lg font-semibold">Recent Announcements</h2>
        </div>
        <div className="space-y-3">
          {announcements.slice(0, 5).map((announcement) => (
            <div key={announcement.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">{announcement.title}</p>
                <p className="text-sm text-muted-foreground">{announcement.description}</p>
                <p className="text-xs text-muted-foreground">
                  By {announcement.createdByName} • {new Date(announcement.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  announcement.priority === 'high' ? 'bg-red-100 text-red-800' :
                  announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {announcement.priority}
                </span>
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No announcements yet</p>
          )}
        </div>
      </Card>
    </div>
  );
}


