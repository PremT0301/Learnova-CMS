import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import { 
  Code, 
  Search, 
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Key,
  Globe,
  Lock,
  Unlock,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  Database,
  Shield,
  Settings,
  ExternalLink,
  Terminal,
  FileText,
  BarChart3,
  Users,
  TrendingUp
} from 'lucide-react';

type APIKey = {
  id: string;
  name: string;
  description: string;
  key: string;
  secret?: string;
  permissions: string[];
  status: 'active' | 'inactive' | 'revoked';
  createdBy: string;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
  rateLimit: {
    requests: number;
    period: 'minute' | 'hour' | 'day';
  };
  allowedOrigins: string[];
  expiryDate?: string;
  isPublic: boolean;
};

type Webhook = {
  id: string;
  name: string;
  description: string;
  url: string;
  events: string[];
  secret: string;
  status: 'active' | 'inactive' | 'error';
  createdBy: string;
  createdAt: string;
  lastTriggered?: string;
  successCount: number;
  failureCount: number;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
  };
  headers?: { [key: string]: string };
  timeout: number;
};

type APIEndpoint = {
  id: string;
  name: string;
  description: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  category: 'users' | 'courses' | 'grades' | 'assignments' | 'analytics' | 'system';
  version: string;
  status: 'active' | 'deprecated' | 'beta';
  rateLimit: {
    requests: number;
    period: string;
  };
  authentication: 'api_key' | 'oauth' | 'none';
  documentation: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  responses?: Array<{
    status: number;
    description: string;
    schema?: any;
  }>;
  createdAt: string;
  updatedAt: string;
};

type APIAnalytics = {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  topEndpoints: Array<{
    endpoint: string;
    requests: number;
    avgResponseTime: number;
  }>;
  requestsByMethod: { [key: string]: number };
  requestsByStatus: { [key: string]: number };
  hourlyRequests: Array<{
    hour: string;
    requests: number;
    errors: number;
  }>;
};

export default function APIManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [analytics, setAnalytics] = useState<APIAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'error' | 'deprecated'>('all');
  const [selectedApiKey, setSelectedApiKey] = useState<APIKey | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [showCreateKeyDialog, setShowCreateKeyDialog] = useState(false);
  const [showCreateWebhookDialog, setShowCreateWebhookDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState(false);

  const [keyForm, setKeyForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    rateLimit: { requests: 1000, period: 'hour' as 'minute' | 'hour' | 'day' },
    allowedOrigins: '',
    isPublic: false
  });

  const [webhookForm, setWebhookForm] = useState({
    name: '',
    description: '',
    url: '',
    events: [] as string[],
    headers: '',
    timeout: 30,
    maxRetries: 3,
    backoffMultiplier: 2
  });

  const availableEvents = [
    'user.created',
    'user.updated',
    'user.deleted',
    'course.created',
    'course.updated',
    'course.deleted',
    'assignment.created',
    'assignment.updated',
    'assignment.submitted',
    'grade.created',
    'grade.updated',
    'announcement.created',
    'system.backup',
    'system.maintenance'
  ];

  const availablePermissions = [
    'users:read',
    'users:write',
    'users:delete',
    'courses:read',
    'courses:write',
    'courses:delete',
    'grades:read',
    'grades:write',
    'assignments:read',
    'assignments:write',
    'analytics:read',
    'system:read',
    'system:write'
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data for demo - in real implementation, this would come from Firestore
      const mockApiKeys: APIKey[] = [
        {
          id: '1',
          name: 'Mobile App API Key',
          description: 'API key for mobile application access',
          key: 'ak_live_1234567890abcdef',
          permissions: ['users:read', 'courses:read', 'grades:read'],
          status: 'active',
          createdBy: user?.id || '',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          usageCount: 15420,
          rateLimit: { requests: 1000, period: 'hour' },
          allowedOrigins: ['https://app.learnova.com', 'https://mobile.learnova.com'],
          isPublic: false
        },
        {
          id: '2',
          name: 'Partner Integration Key',
          description: 'API key for third-party partner integration',
          key: 'ak_live_abcdef1234567890',
          permissions: ['users:read', 'courses:read', 'analytics:read'],
          status: 'active',
          createdBy: user?.id || '',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          usageCount: 8920,
          rateLimit: { requests: 500, period: 'hour' },
          allowedOrigins: ['https://partner.example.com'],
          isPublic: false
        },
        {
          id: '3',
          name: 'Development API Key',
          description: 'API key for development and testing',
          key: 'ak_test_9876543210fedcba',
          permissions: ['users:write', 'courses:write', 'grades:write'],
          status: 'inactive',
          createdBy: user?.id || '',
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          usageCount: 2450,
          rateLimit: { requests: 10000, period: 'day' },
          allowedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
          isPublic: false
        }
      ];

      const mockWebhooks: Webhook[] = [
        {
          id: '1',
          name: 'User Registration Webhook',
          description: 'Notify external system when new users register',
          url: 'https://external-system.com/webhooks/user-registration',
          events: ['user.created', 'user.updated'],
          secret: 'whsec_1234567890abcdef',
          status: 'active',
          createdBy: user?.id || '',
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          lastTriggered: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          successCount: 1247,
          failureCount: 23,
          retryPolicy: { maxRetries: 3, backoffMultiplier: 2 },
          timeout: 30
        },
        {
          id: '2',
          name: 'Grade Notification Webhook',
          description: 'Send grade updates to parent notification system',
          url: 'https://parents.learnova.com/webhooks/grades',
          events: ['grade.created', 'grade.updated'],
          secret: 'whsec_abcdef1234567890',
          status: 'active',
          createdBy: user?.id || '',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          lastTriggered: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          successCount: 892,
          failureCount: 5,
          retryPolicy: { maxRetries: 5, backoffMultiplier: 1.5 },
          timeout: 45
        },
        {
          id: '3',
          name: 'System Monitoring Webhook',
          description: 'Monitor system events and alerts',
          url: 'https://monitoring.internal.com/webhooks/system',
          events: ['system.backup', 'system.maintenance'],
          secret: 'whsec_9876543210fedcba',
          status: 'error',
          createdBy: user?.id || '',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          lastTriggered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          successCount: 45,
          failureCount: 12,
          retryPolicy: { maxRetries: 3, backoffMultiplier: 2 },
          timeout: 30
        }
      ];

      const mockEndpoints: APIEndpoint[] = [
        {
          id: '1',
          name: 'Get Users',
          description: 'Retrieve a list of users with optional filtering',
          path: '/api/v1/users',
          method: 'GET',
          category: 'users',
          version: 'v1',
          status: 'active',
          rateLimit: { requests: 1000, period: 'hour' },
          authentication: 'api_key',
          documentation: 'Returns a paginated list of users. Supports filtering by role, department, and status.',
          parameters: [
            { name: 'page', type: 'number', required: false, description: 'Page number for pagination' },
            { name: 'limit', type: 'number', required: false, description: 'Number of items per page' },
            { name: 'role', type: 'string', required: false, description: 'Filter by user role' }
          ],
          responses: [
            { status: 200, description: 'Success', schema: {} },
            { status: 401, description: 'Unauthorized' },
            { status: 429, description: 'Rate limit exceeded' }
          ],
          createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: 'Create Course',
          description: 'Create a new course in the system',
          path: '/api/v1/courses',
          method: 'POST',
          category: 'courses',
          version: 'v1',
          status: 'active',
          rateLimit: { requests: 100, period: 'hour' },
          authentication: 'api_key',
          documentation: 'Creates a new course with the provided details.',
          parameters: [
            { name: 'title', type: 'string', required: true, description: 'Course title' },
            { name: 'description', type: 'string', required: false, description: 'Course description' },
            { name: 'instructor_id', type: 'string', required: true, description: 'Instructor user ID' }
          ],
          responses: [
            { status: 201, description: 'Course created successfully' },
            { status: 400, description: 'Invalid request data' },
            { status: 401, description: 'Unauthorized' }
          ],
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'Get Analytics',
          description: 'Retrieve analytics data for the specified period',
          path: '/api/v1/analytics',
          method: 'GET',
          category: 'analytics',
          version: 'v1',
          status: 'beta',
          rateLimit: { requests: 500, period: 'hour' },
          authentication: 'api_key',
          documentation: 'Returns analytics data for the specified metrics and time period.',
          parameters: [
            { name: 'metrics', type: 'array', required: true, description: 'List of metrics to retrieve' },
            { name: 'start_date', type: 'string', required: true, description: 'Start date (ISO format)' },
            { name: 'end_date', type: 'string', required: true, description: 'End date (ISO format)' }
          ],
          responses: [
            { status: 200, description: 'Analytics data retrieved successfully' },
            { status: 400, description: 'Invalid date range or metrics' }
          ],
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      const mockAnalytics: APIAnalytics = {
        totalRequests: 45680,
        averageResponseTime: 245,
        errorRate: 2.3,
        topEndpoints: [
          { endpoint: '/api/v1/users', requests: 15420, avgResponseTime: 180 },
          { endpoint: '/api/v1/courses', requests: 12350, avgResponseTime: 220 },
          { endpoint: '/api/v1/grades', requests: 8920, avgResponseTime: 195 },
          { endpoint: '/api/v1/assignments', requests: 6780, avgResponseTime: 210 },
          { endpoint: '/api/v1/analytics', requests: 2210, avgResponseTime: 450 }
        ],
        requestsByMethod: {
          GET: 32150,
          POST: 8920,
          PUT: 3240,
          DELETE: 1370
        },
        requestsByStatus: {
          '200': 42080,
          '201': 3240,
          '400': 890,
          '401': 670,
          '404': 234,
          '500': 566
        },
        hourlyRequests: Array.from({ length: 24 }, (_, i) => ({
          hour: `${i.toString().padStart(2, '0')}:00`,
          requests: Math.floor(Math.random() * 500) + 100,
          errors: Math.floor(Math.random() * 20) + 1
        }))
      };

      setApiKeys(mockApiKeys);
      setWebhooks(mockWebhooks);
      setEndpoints(mockEndpoints);
      setAnalytics(mockAnalytics);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'Failed to load API management data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAPIKey = async () => {
    if (!keyForm.name.trim()) {
      toast({ title: 'Validation Error', description: 'Please provide a key name', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const newKey: Omit<APIKey, 'id'> = {
        ...keyForm,
        key: `ak_live_${Math.random().toString(36).substring(2, 18)}`,
        status: 'active',
        createdBy: user?.id || '',
        createdAt: new Date().toISOString(),
        usageCount: 0,
        allowedOrigins: keyForm.allowedOrigins.split(',').map(origin => origin.trim()).filter(Boolean)
      };

      await addDoc(collection(db, 'api_keys'), newKey);
      await logAudit('api_key_create', newKey, user?.id);
      
      toast({ title: 'Success', description: 'API key created successfully' });
      setShowCreateKeyDialog(false);
      setKeyForm({
        name: '',
        description: '',
        permissions: [],
        rateLimit: { requests: 1000, period: 'hour' },
        allowedOrigins: '',
        isPublic: false
      });
      await loadData();
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({ title: 'Error', description: 'Failed to create API key', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!webhookForm.name.trim() || !webhookForm.url.trim()) {
      toast({ title: 'Validation Error', description: 'Please provide a name and URL', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const newWebhook: Omit<Webhook, 'id'> = {
        ...webhookForm,
        secret: `whsec_${Math.random().toString(36).substring(2, 18)}`,
        status: 'active',
        createdBy: user?.id || '',
        createdAt: new Date().toISOString(),
        successCount: 0,
        failureCount: 0,
        retryPolicy: {
          maxRetries: webhookForm.maxRetries,
          backoffMultiplier: webhookForm.backoffMultiplier
        },
        headers: webhookForm.headers ? JSON.parse(webhookForm.headers) : undefined
      };

      await addDoc(collection(db, 'webhooks'), newWebhook);
      await logAudit('webhook_create', newWebhook, user?.id);
      
      toast({ title: 'Success', description: 'Webhook created successfully' });
      setShowCreateWebhookDialog(false);
      setWebhookForm({
        name: '',
        description: '',
        url: '',
        events: [],
        headers: '',
        timeout: 30,
        maxRetries: 3,
        backoffMultiplier: 2
      });
      await loadData();
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({ title: 'Error', description: 'Failed to create webhook', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleTestWebhook = async (webhook: Webhook) => {
    setTesting(true);
    try {
      // Simulate webhook test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const testResult = Math.random() > 0.2; // 80% success rate for demo
      
      if (testResult) {
        toast({ title: 'Test Successful', description: 'Webhook test completed successfully' });
      } else {
        toast({ title: 'Test Failed', description: 'Webhook test failed. Check the URL and configuration.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({ title: 'Error', description: 'Failed to test webhook', variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Copied to clipboard' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'deprecated':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'beta':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800';
      case 'POST':
        return 'bg-blue-100 text-blue-800';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'PATCH':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">API Management</h1>
          <p className="text-muted-foreground">Manage API keys, webhooks, and endpoints for third-party integrations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showCreateWebhookDialog} onOpenChange={setShowCreateWebhookDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="btn-secondary">
                <Zap size={16} className="mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={showCreateKeyDialog} onOpenChange={setShowCreateKeyDialog}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus size={16} className="mr-2" />
                Add API Key
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      {analytics && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="card-academic p-6">
            <div className="flex items-center gap-3">
              <Activity className="text-primary" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{analytics.totalRequests.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="card-academic p-6">
            <div className="flex items-center gap-3">
              <Clock className="text-blue-500" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{analytics.averageResponseTime}ms</p>
              </div>
            </div>
          </Card>
          <Card className="card-academic p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">{analytics.errorRate}%</p>
              </div>
            </div>
          </Card>
          <Card className="card-academic p-6">
            <div className="flex items-center gap-3">
              <Code className="text-purple-500" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">Active Keys</p>
                <p className="text-2xl font-bold">{apiKeys.filter(k => k.status === 'active').length}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="keys">
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">API Keys ({apiKeys.length})</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading API keys...</p>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No API keys found. Create your first API key!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Key className="text-blue-500" size={20} />
                          <h3 className="font-medium text-lg">{apiKey.name}</h3>
                          <Badge className={`${getStatusColor(apiKey.status)} border`}>
                            {apiKey.status}
                          </Badge>
                          {apiKey.isPublic ? (
                            <Globe className="text-green-500" size={16} />
                          ) : (
                            <Lock className="text-gray-400" size={16} />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{apiKey.description}</p>
                        <div className="grid md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Code size={14} />
                            <span>{apiKey.key}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(apiKey.key)}
                            >
                              <Copy size={12} />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity size={14} />
                            <span>{apiKey.usageCount.toLocaleString()} requests</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>Limit: {apiKey.rateLimit.requests}/{apiKey.rateLimit.period}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <RefreshCw size={14} />
                            <span>Last used: {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : 'Never'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">Permissions:</span>
                          <div className="flex flex-wrap gap-1">
                            {apiKey.permissions.map((permission, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(apiKey.key)}>
                          <Copy size={14} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye size={14} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit size={14} />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Webhooks ({webhooks.length})</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading webhooks...</p>
              </div>
            ) : webhooks.length === 0 ? (
              <div className="text-center py-8">
                <Zap size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No webhooks found. Create your first webhook!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Zap className="text-purple-500" size={20} />
                          <h3 className="font-medium text-lg">{webhook.name}</h3>
                          <Badge className={`${getStatusColor(webhook.status)} border`}>
                            {webhook.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{webhook.description}</p>
                        <div className="grid md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Globe size={14} />
                            <span>{webhook.url}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity size={14} />
                            <span>Success: {webhook.successCount} | Failed: {webhook.failureCount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>Timeout: {webhook.timeout}s</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <RefreshCw size={14} />
                            <span>Last: {webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleDateString() : 'Never'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">Events:</span>
                          <div className="flex flex-wrap gap-1">
                            {webhook.events.map((event, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestWebhook(webhook)}
                          disabled={testing}
                        >
                          <Terminal size={14} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye size={14} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit size={14} />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="endpoints">
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">API Endpoints ({endpoints.length})</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading endpoints...</p>
              </div>
            ) : endpoints.length === 0 ? (
              <div className="text-center py-8">
                <Code size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No endpoints found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {endpoints.map((endpoint) => (
                  <div key={endpoint.id} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Code className="text-blue-500" size={20} />
                          <h3 className="font-medium text-lg">{endpoint.name}</h3>
                          <Badge className={getMethodColor(endpoint.method)}>
                            {endpoint.method}
                          </Badge>
                          <Badge className={`${getStatusColor(endpoint.status)} border`}>
                            {endpoint.status}
                          </Badge>
                          <Badge variant="outline">v{endpoint.version}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{endpoint.description}</p>
                        <div className="grid md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Database size={14} />
                            <span>{endpoint.path}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield size={14} />
                            <span>{endpoint.authentication.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>Limit: {endpoint.rateLimit.requests}/{endpoint.rateLimit.period}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText size={14} />
                            <span>Category: {endpoint.category}</span>
                          </div>
                        </div>
                        {endpoint.parameters && endpoint.parameters.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">Parameters:</span>
                            <div className="flex flex-wrap gap-1">
                              {endpoint.parameters.slice(0, 3).map((param, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {param.name} ({param.type})
                                </Badge>
                              ))}
                              {endpoint.parameters.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{endpoint.parameters.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye size={14} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText size={14} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <ExternalLink size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          {analytics && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="card-academic p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Endpoints</h3>
                  <div className="space-y-3">
                    {analytics.topEndpoints.map((endpoint, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-medium text-sm">{endpoint.endpoint}</span>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{endpoint.requests.toLocaleString()} req</span>
                          <span>{endpoint.avgResponseTime}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="card-academic p-6">
                  <h3 className="text-lg font-semibold mb-4">Requests by Method</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.requestsByMethod).map(([method, count]) => (
                      <div key={method} className="flex items-center justify-between">
                        <span className="font-medium text-sm">{method}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(count / analytics.totalRequests) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-16 text-right">{count.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <Card className="card-academic p-6">
                <h3 className="text-lg font-semibold mb-4">Response Status Codes</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {Object.entries(analytics.requestsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <span className="font-medium">{status}</span>
                      <span className="text-sm text-muted-foreground">{count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateKeyDialog} onOpenChange={setShowCreateKeyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name *</Label>
              <Input
                id="keyName"
                value={keyForm.name}
                onChange={(e) => setKeyForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Mobile App API Key"
                className="input-academic"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyDescription">Description</Label>
              <Textarea
                id="keyDescription"
                value={keyForm.description}
                onChange={(e) => setKeyForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose of this API key..."
                rows={3}
                className="input-academic"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rateLimitRequests">Rate Limit (requests)</Label>
                <Input
                  id="rateLimitRequests"
                  type="number"
                  value={keyForm.rateLimit.requests}
                  onChange={(e) => setKeyForm(prev => ({ 
                    ...prev, 
                    rateLimit: { ...prev.rateLimit, requests: parseInt(e.target.value) }
                  }))}
                  className="input-academic"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rateLimitPeriod">Period</Label>
                <Select value={keyForm.rateLimit.period} onValueChange={(value: any) => setKeyForm(prev => ({ 
                  ...prev, 
                  rateLimit: { ...prev.rateLimit, period: value }
                }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minute">Minute</SelectItem>
                    <SelectItem value="hour">Hour</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowedOrigins">Allowed Origins</Label>
              <Input
                id="allowedOrigins"
                value={keyForm.allowedOrigins}
                onChange={(e) => setKeyForm(prev => ({ ...prev, allowedOrigins: e.target.value }))}
                placeholder="https://example.com, https://app.example.com"
                className="input-academic"
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid md:grid-cols-2 gap-2">
                {availablePermissions.map((permission) => (
                  <label key={permission} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={keyForm.permissions.includes(permission)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setKeyForm(prev => ({ ...prev, permissions: [...prev.permissions, permission] }));
                        } else {
                          setKeyForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== permission) }));
                        }
                      }}
                    />
                    <span className="text-sm">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Public Key</Label>
                <p className="text-sm text-muted-foreground">Allow public access to this key</p>
              </div>
              <Switch
                checked={keyForm.isPublic}
                onCheckedChange={(checked) => setKeyForm(prev => ({ ...prev, isPublic: checked }))}
              />
            </div>
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleCreateAPIKey}
                disabled={creating}
                className="btn-primary"
              >
                {creating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  'Create API Key'
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateKeyDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Webhook Dialog */}
      <Dialog open={showCreateWebhookDialog} onOpenChange={setShowCreateWebhookDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookName">Webhook Name *</Label>
              <Input
                id="webhookName"
                value={webhookForm.name}
                onChange={(e) => setWebhookForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., User Registration Webhook"
                className="input-academic"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhookDescription">Description</Label>
              <Textarea
                id="webhookDescription"
                value={webhookForm.description}
                onChange={(e) => setWebhookForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose of this webhook..."
                rows={3}
                className="input-academic"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL *</Label>
              <Input
                id="webhookUrl"
                value={webhookForm.url}
                onChange={(e) => setWebhookForm(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com/webhook"
                className="input-academic"
              />
            </div>
            <div className="space-y-2">
              <Label>Events to Subscribe To</Label>
              <div className="grid md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {availableEvents.map((event) => (
                  <label key={event} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={webhookForm.events.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWebhookForm(prev => ({ ...prev, events: [...prev.events, event] }));
                        } else {
                          setWebhookForm(prev => ({ ...prev, events: prev.events.filter(ev => ev !== event) }));
                        }
                      }}
                    />
                    <span className="text-sm">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={webhookForm.timeout}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                  className="input-academic"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRetries">Max Retries</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  value={webhookForm.maxRetries}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                  className="input-academic"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleCreateWebhook}
                disabled={creating}
                className="btn-primary"
              >
                {creating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  'Create Webhook'
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateWebhookDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
