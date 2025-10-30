import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import { 
  Shield, 
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  Mail,
  Phone,
  Activity,
  Clock,
  MapPin,
  Globe,
  User,
  Database,
  Settings,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Ban,
  Check,
  AlertCircle
} from 'lucide-react';

type SecurityPolicy = {
  id: string;
  name: string;
  description: string;
  type: 'password' | 'session' | 'mfa' | 'ip' | 'rate_limit' | 'audit' | 'encryption';
  enabled: boolean;
  settings: { [key: string]: any };
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

type SecurityEvent = {
  id: string;
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'mfa_failure' | 'ip_blocked' | 'rate_limit_exceeded' | 'privilege_escalation' | 'data_breach_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  action: 'allowed' | 'blocked' | 'flagged' | 'investigating';
};

type MFASettings = {
  enabled: boolean;
  methods: ('sms' | 'email' | 'totp' | 'push')[];
  requiredFor: string[];
  backupCodes: boolean;
  rememberDevice: boolean;
  gracePeriod: number; // days
};

type SecurityMetrics = {
  totalThreats: number;
  threatsBlocked: number;
  mfaAdoption: number;
  activeSessions: number;
  suspiciousActivities: number;
  passwordViolations: number;
  ipBlocks: number;
  riskScore: number;
  threatTrend: number;
  securityEvents: Array<{
    date: string;
    threats: number;
    blocked: number;
  }>;
};

type SecurityRule = {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: 'allow' | 'block' | 'flag' | 'require_mfa';
  priority: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export default function AdvancedSecurity() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [rules, setRules] = useState<SecurityRule[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [mfaSettings, setMfaSettings] = useState<MFASettings>({
    enabled: true,
    methods: ['totp', 'sms'],
    requiredFor: ['admin', 'faculty'],
    backupCodes: true,
    rememberDevice: true,
    gracePeriod: 30
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | SecurityEvent['severity']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | SecurityEvent['type']>('all');
  const [showCreateRuleDialog, setShowCreateRuleDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [creating, setCreating] = useState(false);

  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    condition: '',
    action: 'block' as SecurityRule['action'],
    priority: 1
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data for demo - in real implementation, this would come from Firestore
      const mockPolicies: SecurityPolicy[] = [
        {
          id: '1',
          name: 'Password Policy',
          description: 'Enforce strong password requirements',
          type: 'password',
          enabled: true,
          settings: {
            minLength: 12,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSymbols: true,
            maxAge: 90, // days
            preventReuse: 5
          },
          severity: 'high',
          createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: user?.id || ''
        },
        {
          id: '2',
          name: 'Multi-Factor Authentication',
          description: 'Require MFA for sensitive operations',
          type: 'mfa',
          enabled: true,
          settings: {
            requiredMethods: ['totp', 'sms'],
            gracePeriod: 30,
            backupCodes: true,
            rememberDevice: true
          },
          severity: 'critical',
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: user?.id || ''
        },
        {
          id: '3',
          name: 'IP Whitelist',
          description: 'Restrict access to specific IP addresses',
          type: 'ip',
          enabled: true,
          settings: {
            allowedIPs: ['192.168.1.0/24', '10.0.0.0/8'],
            blockUnknownIPs: true
          },
          severity: 'high',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: user?.id || ''
        },
        {
          id: '4',
          name: 'Session Security',
          description: 'Monitor and control user sessions',
          type: 'session',
          enabled: true,
          settings: {
            maxDuration: 480, // minutes
            idleTimeout: 30, // minutes
            concurrentSessions: 3,
            requireReauth: true
          },
          severity: 'medium',
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: user?.id || ''
        }
      ];

      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          type: 'failed_login',
          severity: 'medium',
          userId: 'user123',
          userEmail: 'john.doe@example.com',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: 'New York, NY, USA',
          description: 'Multiple failed login attempts detected',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          resolved: false,
          action: 'flagged'
        },
        {
          id: '2',
          type: 'suspicious_activity',
          severity: 'high',
          userId: 'user456',
          userEmail: 'jane.smith@example.com',
          ipAddress: '203.0.113.42',
          userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
          location: 'Unknown',
          description: 'Unusual login pattern detected from new device and location',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          resolved: false,
          action: 'investigating'
        },
        {
          id: '3',
          type: 'ip_blocked',
          severity: 'high',
          ipAddress: '198.51.100.25',
          userAgent: 'curl/7.68.0',
          location: 'Unknown',
          description: 'IP address blocked due to suspicious activity',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          resolved: true,
          resolvedBy: user?.id || '',
          resolvedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          action: 'blocked'
        },
        {
          id: '4',
          type: 'mfa_failure',
          severity: 'medium',
          userId: 'user789',
          userEmail: 'admin@learnova.com',
          ipAddress: '192.168.1.50',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          location: 'San Francisco, CA, USA',
          description: 'Multiple MFA verification failures',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          resolved: true,
          resolvedBy: user?.id || '',
          resolvedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
          action: 'allowed'
        },
        {
          id: '5',
          type: 'rate_limit_exceeded',
          severity: 'low',
          userId: 'user321',
          userEmail: 'student@learnova.com',
          ipAddress: '192.168.1.75',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: 'Boston, MA, USA',
          description: 'API rate limit exceeded for user',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          resolved: false,
          action: 'flagged'
        }
      ];

      const mockRules: SecurityRule[] = [
        {
          id: '1',
          name: 'Block Suspicious IPs',
          description: 'Automatically block IP addresses with multiple failed login attempts',
          condition: 'failed_logins > 5 AND time_window < 15_minutes',
          action: 'block',
          priority: 1,
          enabled: true,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: user?.id || ''
        },
        {
          id: '2',
          name: 'Require MFA for Admin',
          description: 'Force MFA verification for all admin operations',
          condition: 'user_role == admin AND operation_type == sensitive',
          action: 'require_mfa',
          priority: 2,
          enabled: true,
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: user?.id || ''
        },
        {
          id: '3',
          name: 'Flag Unusual Login Locations',
          description: 'Flag logins from new geographic locations',
          condition: 'login_location != known_locations AND confidence < 0.7',
          action: 'flag',
          priority: 3,
          enabled: true,
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: user?.id || ''
        }
      ];

      const mockMetrics: SecurityMetrics = {
        totalThreats: 47,
        threatsBlocked: 42,
        mfaAdoption: 87.5,
        activeSessions: 1247,
        suspiciousActivities: 12,
        passwordViolations: 8,
        ipBlocks: 23,
        riskScore: 23, // out of 100
        threatTrend: -15.2, // percentage change
        securityEvents: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          threats: Math.floor(Math.random() * 10) + 1,
          blocked: Math.floor(Math.random() * 8) + 1
        }))
      };

      setPolicies(mockPolicies);
      setEvents(mockEvents);
      setRules(mockRules);
      setMetrics(mockMetrics);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'Failed to load security data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRule = async () => {
    if (!ruleForm.name.trim() || !ruleForm.condition.trim()) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const ruleData = {
        ...ruleForm,
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.id || ''
      };

      await addDoc(collection(db, 'security_rules'), ruleData);
      await logAudit('security_rule_create', ruleData, user?.id);
      
      toast({ title: 'Success', description: 'Security rule created successfully' });
      setShowCreateRuleDialog(false);
      setRuleForm({
        name: '',
        description: '',
        condition: '',
        action: 'block',
        priority: 1
      });
      await loadData();
    } catch (error) {
      console.error('Error creating rule:', error);
      toast({ title: 'Error', description: 'Failed to create security rule', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleResolveEvent = async (eventId: string) => {
    try {
      await updateDoc(doc(db, 'security_events', eventId), {
        resolved: true,
        resolvedBy: user?.id,
        resolvedAt: new Date().toISOString()
      });
      
      toast({ title: 'Success', description: 'Security event resolved' });
      await loadData();
    } catch (error) {
      console.error('Error resolving event:', error);
      toast({ title: 'Error', description: 'Failed to resolve event', variant: 'destructive' });
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
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'flagged':
        return 'bg-yellow-100 text-yellow-800';
      case 'investigating':
        return 'bg-orange-100 text-orange-800';
      case 'allowed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'failed_login':
        return <XCircle className="text-red-500" size={20} />;
      case 'suspicious_activity':
        return <AlertTriangle className="text-orange-500" size={20} />;
      case 'mfa_failure':
        return <Shield className="text-yellow-500" size={20} />;
      case 'ip_blocked':
        return <Ban className="text-red-600" size={20} />;
      case 'rate_limit_exceeded':
        return <Clock className="text-blue-500" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.ipAddress.includes(searchTerm);
    const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter;
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    return matchesSearch && matchesSeverity && matchesType;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Advanced Security</h1>
          <p className="text-muted-foreground">Monitor threats, manage security policies, and protect your system.</p>
        </div>
        <Dialog open={showCreateRuleDialog} onOpenChange={setShowCreateRuleDialog}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus size={16} className="mr-2" />
              Add Security Rule
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Security Metrics */}
      {metrics && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="card-academic p-6">
            <div className="flex items-center gap-3">
              <Shield className="text-primary" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold">{metrics.riskScore}/100</p>
              </div>
            </div>
          </Card>
          <Card className="card-academic p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-orange-500" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">Active Threats</p>
                <p className="text-2xl font-bold">{metrics.totalThreats}</p>
              </div>
            </div>
          </Card>
          <Card className="card-academic p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-500" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">Threats Blocked</p>
                <p className="text-2xl font-bold">{metrics.threatsBlocked}</p>
              </div>
            </div>
          </Card>
          <Card className="card-academic p-6">
            <div className="flex items-center gap-3">
              <Key className="text-blue-500" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">MFA Adoption</p>
                <p className="text-2xl font-bold">{metrics.mfaAdoption}%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Tabs defaultValue="threats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="threats">Security Events</TabsTrigger>
          <TabsTrigger value="policies">Security Policies</TabsTrigger>
          <TabsTrigger value="rules">Security Rules</TabsTrigger>
          <TabsTrigger value="mfa">MFA Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="threats">
          {/* Filters */}
          <Card className="card-academic p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} />
                <span className="font-medium">Filters:</span>
              </div>
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search security events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={severityFilter} onValueChange={(value: any) => setSeverityFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="failed_login">Failed Login</SelectItem>
                  <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                  <SelectItem value="mfa_failure">MFA Failure</SelectItem>
                  <SelectItem value="ip_blocked">IP Blocked</SelectItem>
                  <SelectItem value="rate_limit_exceeded">Rate Limit Exceeded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Security Events */}
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Security Events ({filteredEvents.length})</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading security events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8">
                <ShieldCheck size={48} className="mx-auto mb-4 text-green-500" />
                <p className="text-muted-foreground">No security events found. Your system is secure!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getEventIcon(event.type)}
                          <h3 className="font-medium text-lg">{event.description}</h3>
                          <Badge className={`${getSeverityColor(event.severity)} border`}>
                            {event.severity}
                          </Badge>
                          <Badge className={`${getActionColor(event.action)} border`}>
                            {event.action}
                          </Badge>
                          {event.resolved ? (
                            <CheckCircle className="text-green-500" size={16} />
                          ) : (
                            <Clock className="text-yellow-500" size={16} />
                          )}
                        </div>
                        <div className="grid md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          {event.userEmail && (
                            <div className="flex items-center gap-2">
                              <User size={14} />
                              <span>{event.userEmail}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Globe size={14} />
                            <span>{event.ipAddress}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin size={14} />
                              <span>{event.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>{new Date(event.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          User Agent: {event.userAgent}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!event.resolved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResolveEvent(event.id)}
                          >
                            <Check size={14} />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye size={14} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Security Policies ({policies.length})</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading security policies...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {policies.map((policy) => (
                  <div key={policy.id} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Shield className="text-blue-500" size={20} />
                          <h3 className="font-medium text-lg">{policy.name}</h3>
                          <Badge className={`${getSeverityColor(policy.severity)} border`}>
                            {policy.severity}
                          </Badge>
                          {policy.enabled ? (
                            <CheckCircle className="text-green-500" size={16} />
                          ) : (
                            <XCircle className="text-red-500" size={16} />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{policy.description}</p>
                        <div className="text-sm text-muted-foreground">
                          Type: <Badge variant="outline">{policy.type.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Settings size={14} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit size={14} />
                        </Button>
                        <Switch
                          checked={policy.enabled}
                          onCheckedChange={(checked) => {
                            // Handle policy toggle
                            console.log(`Toggle policy ${policy.id} to ${checked}`);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Security Rules ({rules.length})</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading security rules...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="text-purple-500" size={20} />
                          <h3 className="font-medium text-lg">{rule.name}</h3>
                          <Badge variant="outline">Priority: {rule.priority}</Badge>
                          {rule.enabled ? (
                            <CheckCircle className="text-green-500" size={16} />
                          ) : (
                            <XCircle className="text-red-500" size={16} />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                        <div className="text-sm text-muted-foreground">
                          <div className="mb-1">
                            <span className="font-medium">Condition:</span> {rule.condition}
                          </div>
                          <div>
                            <span className="font-medium">Action:</span> 
                            <Badge className="ml-1" variant={rule.action === 'block' ? 'destructive' : 'secondary'}>
                              {rule.action.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Edit size={14} />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          <Trash2 size={14} />
                        </Button>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) => {
                            // Handle rule toggle
                            console.log(`Toggle rule ${rule.id} to ${checked}`);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="mfa">
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Multi-Factor Authentication Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Enable MFA</Label>
                  <p className="text-sm text-muted-foreground">Require multi-factor authentication for enhanced security</p>
                </div>
                <Switch
                  checked={mfaSettings.enabled}
                  onCheckedChange={(checked) => setMfaSettings(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">MFA Methods</Label>
                <p className="text-sm text-muted-foreground">Select which MFA methods users can use</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { key: 'totp', label: 'Authenticator App (TOTP)', icon: Smartphone },
                    { key: 'sms', label: 'SMS Verification', icon: Phone },
                    { key: 'email', label: 'Email Verification', icon: Mail },
                    { key: 'push', label: 'Push Notification', icon: Zap }
                  ].map((method) => (
                    <label key={method.key} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                      <input
                        type="checkbox"
                        checked={mfaSettings.methods.includes(method.key as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMfaSettings(prev => ({ ...prev, methods: [...prev.methods, method.key as any] }));
                          } else {
                            setMfaSettings(prev => ({ ...prev, methods: prev.methods.filter(m => m !== method.key) }));
                          }
                        }}
                      />
                      <method.icon size={20} className="text-primary" />
                      <span>{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Required For</Label>
                <p className="text-sm text-muted-foreground">Select which user roles require MFA</p>
                <div className="flex gap-4">
                  {['admin', 'faculty', 'student'].map((role) => (
                    <label key={role} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={mfaSettings.requiredFor.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMfaSettings(prev => ({ ...prev, requiredFor: [...prev.requiredFor, role] }));
                          } else {
                            setMfaSettings(prev => ({ ...prev, requiredFor: prev.requiredFor.filter(r => r !== role) }));
                          }
                        }}
                      />
                      <span className="capitalize">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Backup Codes</Label>
                    <p className="text-sm text-muted-foreground">Allow users to generate backup codes</p>
                  </div>
                  <Switch
                    checked={mfaSettings.backupCodes}
                    onCheckedChange={(checked) => setMfaSettings(prev => ({ ...prev, backupCodes: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Remember Device</Label>
                    <p className="text-sm text-muted-foreground">Allow users to trust devices for 30 days</p>
                  </div>
                  <Switch
                    checked={mfaSettings.rememberDevice}
                    onCheckedChange={(checked) => setMfaSettings(prev => ({ ...prev, rememberDevice: checked }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gracePeriod">Grace Period (days)</Label>
                <Input
                  id="gracePeriod"
                  type="number"
                  value={mfaSettings.gracePeriod}
                  onChange={(e) => setMfaSettings(prev => ({ ...prev, gracePeriod: parseInt(e.target.value) }))}
                  className="input-academic max-w-xs"
                />
                <p className="text-sm text-muted-foreground">Number of days users have to set up MFA after it's enabled</p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button className="btn-primary">
                  Save Settings
                </Button>
                <Button variant="outline">
                  Reset to Defaults
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Security Rule Dialog */}
      <Dialog open={showCreateRuleDialog} onOpenChange={setShowCreateRuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Security Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ruleName">Rule Name *</Label>
              <Input
                id="ruleName"
                value={ruleForm.name}
                onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Block Suspicious IPs"
                className="input-academic"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ruleDescription">Description</Label>
              <Textarea
                id="ruleDescription"
                value={ruleForm.description}
                onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this rule does..."
                rows={3}
                className="input-academic"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ruleCondition">Condition *</Label>
              <Textarea
                id="ruleCondition"
                value={ruleForm.condition}
                onChange={(e) => setRuleForm(prev => ({ ...prev, condition: e.target.value }))}
                placeholder="e.g., failed_logins > 5 AND time_window < 15_minutes"
                rows={2}
                className="input-academic"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ruleAction">Action</Label>
                <Select value={ruleForm.action} onValueChange={(value: any) => setRuleForm(prev => ({ ...prev, action: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Block</SelectItem>
                    <SelectItem value="allow">Allow</SelectItem>
                    <SelectItem value="flag">Flag</SelectItem>
                    <SelectItem value="require_mfa">Require MFA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rulePriority">Priority</Label>
                <Input
                  id="rulePriority"
                  type="number"
                  value={ruleForm.priority}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  className="input-academic"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleCreateRule}
                disabled={creating}
                className="btn-primary"
              >
                {creating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  'Create Rule'
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateRuleDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
