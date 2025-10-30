import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { db } from '@/firebase';
import { collection, getDocs, query, where, orderBy, addDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Search, 
  Eye, 
  LogOut, 
  AlertTriangle, 
  Shield, 
  Clock, 
  Mail,
  GraduationCap,
  UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type UserData = {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'faculty' | 'admin';
  department?: string;
  avatar?: string;
  joinDate?: string;
  lastLogin?: string;
  active: boolean;
};

type ImpersonationSession = {
  originalUserId: string;
  originalUserRole: string;
  impersonatedUserId: string;
  impersonatedUserName: string;
  startTime: string;
  endTime?: string;
  reason?: string;
};

export default function UserImpersonation() {
  const { user: currentUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'faculty' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [impersonationReason, setImpersonationReason] = useState('');
  const [impersonating, setImpersonating] = useState(false);
  const [currentSession, setCurrentSession] = useState<ImpersonationSession | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersQuery = query(collection(db, 'users'), orderBy('name', 'asc'));
      const snapshot = await getDocs(usersQuery);
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      
      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  const startImpersonation = async () => {
    if (!selectedUser) return;

    if (!impersonationReason.trim()) {
      toast({ title: 'Validation Error', description: 'Please provide a reason for impersonation', variant: 'destructive' });
      return;
    }

    setImpersonating(true);
    try {
      // Create impersonation session record
      const session: ImpersonationSession = {
        originalUserId: currentUser?.id || '',
        originalUserRole: currentUser?.role || '',
        impersonatedUserId: selectedUser.id,
        impersonatedUserName: selectedUser.name,
        startTime: new Date().toISOString(),
        reason: impersonationReason
      };

      // Store session in localStorage for the impersonation
      localStorage.setItem('impersonation_session', JSON.stringify(session));

      // Log the impersonation start
      await addDoc(collection(db, 'audit_logs'), {
        action: 'impersonation_start',
        userId: currentUser?.id,
        details: {
          impersonatedUserId: selectedUser.id,
          impersonatedUserName: selectedUser.name,
          reason: impersonationReason
        },
        timestamp: new Date().toISOString()
      });

      toast({ 
        title: 'Impersonation Started', 
        description: `Now viewing as ${selectedUser.name} (${selectedUser.role})` 
      });

      // Redirect to the impersonated user's dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error('Error starting impersonation:', error);
      toast({ title: 'Error', description: 'Failed to start impersonation', variant: 'destructive' });
    } finally {
      setImpersonating(false);
    }
  };

  const endImpersonation = async () => {
    try {
      const sessionData = localStorage.getItem('impersonation_session');
      if (sessionData) {
        const session: ImpersonationSession = JSON.parse(sessionData);
        
        // Log the impersonation end
        await addDoc(collection(db, 'audit_logs'), {
          action: 'impersonation_end',
          userId: currentUser?.id,
          details: {
            impersonatedUserId: session.impersonatedUserId,
            impersonatedUserName: session.impersonatedUserName,
            duration: Date.now() - new Date(session.startTime).getTime()
          },
          timestamp: new Date().toISOString()
        });

        // Clear the impersonation session
        localStorage.removeItem('impersonation_session');
        
        toast({ 
          title: 'Impersonation Ended', 
          description: 'Returned to admin view' 
        });

        // Refresh the page to ensure clean state
        window.location.reload();
      }
    } catch (error) {
      console.error('Error ending impersonation:', error);
      toast({ title: 'Error', description: 'Failed to end impersonation', variant: 'destructive' });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="text-red-500" size={16} />;
      case 'faculty':
        return <GraduationCap className="text-blue-500" size={16} />;
      case 'student':
        return <User className="text-green-500" size={16} />;
      default:
        return <User className="text-gray-500" size={16} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'faculty':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'student':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Check if currently impersonating
  useEffect(() => {
    const sessionData = localStorage.getItem('impersonation_session');
    if (sessionData) {
      setCurrentSession(JSON.parse(sessionData));
    }
  }, []);

  if (currentSession) {
    return (
      <div className="space-y-6 p-6">
        <Card className="card-academic p-6 border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-orange-600" size={24} />
              <div>
                <h2 className="text-lg font-semibold text-orange-800">Active Impersonation Session</h2>
                <p className="text-sm text-orange-700">
                  You are currently impersonating: <strong>{currentSession.impersonatedUserName}</strong>
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Started: {new Date(currentSession.startTime).toLocaleString()}
                </p>
              </div>
            </div>
            <Button 
              onClick={endImpersonation}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <LogOut size={16} className="mr-2" />
              End Impersonation
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">User Impersonation</h1>
        <p className="text-muted-foreground">
          Impersonate users to debug issues and test user experience. All impersonation activities are logged.
        </p>
      </div>

      <Card className="card-academic p-6 border-yellow-200 bg-yellow-50">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium text-yellow-800">Important Security Notice</h3>
            <p className="text-sm text-yellow-700 mt-1">
              User impersonation is a powerful administrative tool. Use responsibly and only for legitimate purposes such as:
            </p>
            <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
              <li>Debugging user-reported issues</li>
              <li>Testing user experience and functionality</li>
              <li>Investigating security concerns</li>
              <li>Training and demonstration purposes</li>
            </ul>
            <p className="text-sm text-yellow-700 mt-2 font-medium">
              All impersonation activities are logged and auditable.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="card-academic p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Select User to Impersonate</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total: {filteredUsers.length}</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
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

            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <User size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No users found matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedUser?.id === user.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/20'
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(user.role)}
                        <div>
                          <h3 className="font-medium">{user.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail size={14} />
                              {user.email}
                            </span>
                            {user.department && (
                              <span>{user.department}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getRoleColor(user.role)} border`}>
                          {user.role}
                        </Badge>
                        {user.lastLogin && (
                          <span className="text-xs text-muted-foreground">
                            <Clock size={12} className="inline mr-1" />
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="card-academic p-6">
            <h3 className="font-semibold mb-4">Impersonation Details</h3>
            
            {selectedUser ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    {getRoleIcon(selectedUser.role)}
                    <div>
                      <h4 className="font-medium">{selectedUser.name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <Badge className={`${getRoleColor(selectedUser.role)} border`}>
                        {selectedUser.role}
                      </Badge>
                    </div>
                    {selectedUser.department && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Department:</span>
                        <span>{selectedUser.department}</span>
                      </div>
                    )}
                    {selectedUser.joinDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Joined:</span>
                        <span>{new Date(selectedUser.joinDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={selectedUser.active ? "default" : "secondary"}>
                        {selectedUser.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="reason">Reason for Impersonation *</Label>
                    <Input
                      id="reason"
                      placeholder="e.g., Debugging login issue..."
                      value={impersonationReason}
                      onChange={(e) => setImpersonationReason(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <Button
                    onClick={startImpersonation}
                    disabled={impersonating || !impersonationReason.trim()}
                    className="w-full btn-primary"
                  >
                    {impersonating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Starting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserCheck size={16} />
                        Start Impersonation
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Eye size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Select a user to view details and start impersonation.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
