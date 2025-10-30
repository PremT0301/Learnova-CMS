import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import { 
  Plug, 
  Search, 
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Globe,
  Lock,
  Unlock,
  Key,
  Database,
  Mail,
  CreditCard,
  Calendar,
  MessageSquare,
  BarChart3,
  Zap,
  Activity,
  Shield,
  ExternalLink
} from 'lucide-react';

type Integration = {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'payment' | 'calendar' | 'messaging' | 'analytics' | 'storage' | 'authentication' | 'other';
  provider: string;
  status: 'active' | 'inactive' | 'error' | 'testing';
  configuration: {
    apiKey?: string;
    secretKey?: string;
    endpoint?: string;
    webhookUrl?: string;
    settings?: { [key: string]: any };
  };
  lastSync?: string;
  lastError?: string;
  errorCount: number;
  successCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isEnabled: boolean;
  webhooks: Webhook[];
  permissions: string[];
};

type Webhook = {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  lastTriggered?: string;
  successCount: number;
  failureCount: number;
};

type IntegrationStats = {
  totalIntegrations: number;
  activeIntegrations: number;
  errorIntegrations: number;
  totalWebhooks: number;
  activeWebhooks: number;
  recentActivity: number;
  integrationTypes: { [key: string]: number };
  providerBreakdown: { [key: string]: number };
};

export default function IntegrationManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [filteredIntegrations, setFilteredIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | Integration['type']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Integration['status']>('all');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [stats, setStats] = useState<IntegrationStats>({
    totalIntegrations: 0,
    activeIntegrations: 0,
    errorIntegrations: 0,
    totalWebhooks: 0,
    activeWebhooks: 0,
    recentActivity: 0,
    integrationTypes: {},
    providerBreakdown: {}
  });
  
  const [integrationForm, setIntegrationForm] = useState({
    name: '',
    description: '',
    type: 'email' as Integration['type'],
    provider: '',
    apiKey: '',
    secretKey: '',
    endpoint: '',
    webhookUrl: '',
    isEnabled: true,
    settings: {}
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data for demo - in real implementation, this would come from Firestore
      const mockIntegrations: Integration[] = [
        {
          id: '1',
          name: 'SendGrid Email Service',
          description: 'Email delivery service for transactional and marketing emails',
          type: 'email',
          provider: 'SendGrid',
          status: 'active',
          configuration: {
            apiKey: 'SG.xxx',
            endpoint: 'https://api.sendgrid.com/v3'
          },
          lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          errorCount: 2,
          successCount: 1247,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          createdBy: user?.id || '',
          isEnabled: true,
          webhooks: [
            {
              id: 'w1',
              name: 'Email Delivery Events',
              url: 'https://api.learnova.com/webhooks/email-events',
              events: ['delivered', 'bounced', 'opened'],
              isActive: true,
              successCount: 45,
              failureCount: 1
            }
          ],
          permissions: ['admin', 'faculty']
        },
        {
          id: '2',
          name: 'Stripe Payment Gateway',
          description: 'Payment processing for course enrollments and subscriptions',
          type: 'payment',
          provider: 'Stripe',
          status: 'active',
          configuration: {
            apiKey: 'sk_test_xxx',
            secretKey: 'pk_test_xxx',
            endpoint: 'https://api.stripe.com/v1'
          },
          lastSync: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          errorCount: 0,
          successCount: 892,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          createdBy: user?.id || '',
          isEnabled: true,
          webhooks: [
            {
              id: 'w2',
              name: 'Payment Events',
              url: 'https://api.learnova.com/webhooks/payment-events',
              events: ['payment_intent.succeeded', 'payment_intent.payment_failed'],
              isActive: true,
              successCount: 23,
              failureCount: 0
            }
          ],
          permissions: ['admin']
        },
        {
          id: '3',
          name: 'Google Calendar Integration',
          description: 'Sync course schedules and events with Google Calendar',
          type: 'calendar',
          provider: 'Google',
          status: 'error',
          configuration: {
            apiKey: 'AIzaSyxxx',
            endpoint: 'https://www.googleapis.com/calendar/v3'
          },
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          lastError: 'Invalid API key or insufficient permissions',
          errorCount: 15,
          successCount: 234,
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          createdBy: user?.id || '',
          isEnabled: false,
          webhooks: [],
          permissions: ['admin', 'faculty']
        },
        {
          id: '4',
          name: 'Slack Notifications',
          description: 'Send system notifications to Slack channels',
          type: 'messaging',
          provider: 'Slack',
          status: 'testing',
          configuration: {
            webhookUrl: 'https://hooks.slack.com/services/xxx'
          },
          errorCount: 0,
          successCount: 0,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          createdBy: user?.id || '',
          isEnabled: true,
          webhooks: [],
          permissions: ['admin']
        }
      ];

      setIntegrations(mockIntegrations);
      setFilteredIntegrations(mockIntegrations);

      // Calculate stats
      const totalIntegrations = mockIntegrations.length;
      const activeIntegrations = mockIntegrations.filter(i => i.status === 'active').length;
      const errorIntegrations = mockIntegrations.filter(i => i.status === 'error').length;
      const totalWebhooks = mockIntegrations.reduce((sum, i) => sum + i.webhooks.length, 0);
      const activeWebhooks = mockIntegrations.reduce((sum, i) => sum + i.webhooks.filter(w => w.isActive).length, 0);
      const recentActivity = mockIntegrations.filter(i => {
        const lastSync = new Date(i.lastSync || i.updatedAt);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return lastSync > oneHourAgo;
      }).length;

      const integrationTypes = mockIntegrations.reduce((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const providerBreakdown = mockIntegrations.reduce((acc, i) => {
        acc[i.provider] = (acc[i.provider] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      setStats({
        totalIntegrations,
        activeIntegrations,
        errorIntegrations,
        totalWebhooks,
        activeWebhooks,
        recentActivity,
        integrationTypes,
        providerBreakdown
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'Failed to load integration data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = integrations;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(integration =>
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.provider.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(integration => integration.type === typeFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(integration => integration.status === statusFilter);
    }

    setFilteredIntegrations(filtered);
  }, [integrations, searchTerm, typeFilter, statusFilter]);

  const handleInputChange = (field: string, value: any) => {
    setIntegrationForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setIntegrationForm({
      name: '',
      description: '',
      type: 'email',
      provider: '',
      apiKey: '',
      secretKey: '',
      endpoint: '',
      webhookUrl: '',
      isEnabled: true,
      settings: {}
    });
  };

  const handleCreate = async () => {
    if (!integrationForm.name.trim() || !integrationForm.provider.trim()) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const integrationData = {
        ...integrationForm,
        status: integrationForm.isEnabled ? 'testing' : 'inactive',
        configuration: {
          apiKey: integrationForm.apiKey,
          secretKey: integrationForm.secretKey,
          endpoint: integrationForm.endpoint,
          webhookUrl: integrationForm.webhookUrl,
          settings: integrationForm.settings
        },
        errorCount: 0,
        successCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.id || '',
        webhooks: [],
        permissions: ['admin']
      };

      await addDoc(collection(db, 'integrations'), integrationData);
      await logAudit('integration_create', integrationData, user?.id);
      
      toast({ title: 'Success', description: 'Integration created successfully' });
      setShowCreateDialog(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error creating integration:', error);
      toast({ title: 'Error', description: 'Failed to create integration', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedIntegration) return;

    setEditing(true);
    try {
      const integrationData = {
        ...integrationForm,
        status: integrationForm.isEnabled ? 'active' : 'inactive',
        configuration: {
          apiKey: integrationForm.apiKey,
          secretKey: integrationForm.secretKey,
          endpoint: integrationForm.endpoint,
          webhookUrl: integrationForm.webhookUrl,
          settings: integrationForm.settings
        },
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'integrations', selectedIntegration.id), integrationData);
      await logAudit('integration_update', { integrationId: selectedIntegration.id, ...integrationData }, user?.id);
      
      toast({ title: 'Success', description: 'Integration updated successfully' });
      setShowEditDialog(false);
      setSelectedIntegration(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error updating integration:', error);
      toast({ title: 'Error', description: 'Failed to update integration', variant: 'destructive' });
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'integrations', integrationId));
      await logAudit('integration_delete', { integrationId }, user?.id);
      
      toast({ title: 'Success', description: 'Integration deleted successfully' });
      await loadData();
    } catch (error) {
      console.error('Error deleting integration:', error);
      toast({ title: 'Error', description: 'Failed to delete integration', variant: 'destructive' });
    }
  };

  const handleTest = async (integration: Integration) => {
    setTesting(true);
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock test result
      const testResult = Math.random() > 0.3; // 70% success rate for demo
      
      if (testResult) {
        toast({ title: 'Test Successful', description: 'Integration test passed successfully' });
      } else {
        toast({ title: 'Test Failed', description: 'Integration test failed. Check your configuration.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error testing integration:', error);
      toast({ title: 'Error', description: 'Failed to test integration', variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  const openEditDialog = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIntegrationForm({
      name: integration.name,
      description: integration.description,
      type: integration.type,
      provider: integration.provider,
      apiKey: integration.configuration.apiKey || '',
      secretKey: integration.configuration.secretKey || '',
      endpoint: integration.configuration.endpoint || '',
      webhookUrl: integration.configuration.webhookUrl || '',
      isEnabled: integration.isEnabled,
      settings: integration.configuration.settings || {}
    });
    setShowEditDialog(true);
  };

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'testing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: Integration['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="text-blue-500" size={20} />;
      case 'payment':
        return <CreditCard className="text-green-500" size={20} />;
      case 'calendar':
        return <Calendar className="text-purple-500" size={20} />;
      case 'messaging':
        return <MessageSquare className="text-orange-500" size={20} />;
      case 'analytics':
        return <BarChart3 className="text-indigo-500" size={20} />;
      case 'storage':
        return <Database className="text-teal-500" size={20} />;
      case 'authentication':
        return <Shield className="text-red-500" size={20} />;
      default:
        return <Plug className="text-gray-500" size={20} />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Integration Management</h1>
          <p className="text-muted-foreground">Manage external service integrations and API connections.</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus size={16} className="mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Integration</DialogTitle>
            </DialogHeader>
            <IntegrationForm
              formData={integrationForm}
              onInputChange={handleInputChange}
              onSubmit={handleCreate}
              onCancel={() => setShowCreateDialog(false)}
              loading={creating}
              isEdit={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Plug className="text-primary" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Integrations</p>
              <p className="text-2xl font-bold">{stats.totalIntegrations}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{stats.activeIntegrations}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <XCircle className="text-red-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Errors</p>
              <p className="text-2xl font-bold">{stats.errorIntegrations}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Zap className="text-purple-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Webhooks</p>
              <p className="text-2xl font-bold">{stats.activeWebhooks}/{stats.totalWebhooks}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations">
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
                  placeholder="Search integrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="calendar">Calendar</SelectItem>
                  <SelectItem value="messaging">Messaging</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                  <SelectItem value="authentication">Authentication</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="testing">Testing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Integrations List */}
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Integrations ({filteredIntegrations.length})</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading integrations...</p>
              </div>
            ) : filteredIntegrations.length === 0 ? (
              <div className="text-center py-8">
                <Plug size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No integrations found matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIntegrations.map((integration) => (
                  <div key={integration.id} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getTypeIcon(integration.type)}
                          <h3 className="font-medium text-lg">{integration.name}</h3>
                          <Badge className={`${getStatusColor(integration.status)} border`}>
                            {integration.status}
                          </Badge>
                          <Badge variant="outline">{integration.provider}</Badge>
                          {integration.isEnabled ? (
                            <Lock className="text-green-500" size={16} />
                          ) : (
                            <Unlock className="text-gray-400" size={16} />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{integration.description}</p>
                        <div className="grid md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Activity size={14} />
                            <span>Success: {integration.successCount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={14} />
                            <span>Errors: {integration.errorCount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap size={14} />
                            <span>Webhooks: {integration.webhooks.length}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <RefreshCw size={14} />
                            <span>Last sync: {integration.lastSync ? new Date(integration.lastSync).toLocaleDateString() : 'Never'}</span>
                          </div>
                        </div>
                        {integration.lastError && (
                          <p className="text-sm text-red-500 mt-2">
                            <AlertTriangle size={14} className="inline mr-1" />
                            {integration.lastError}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTest(integration)}
                          disabled={testing}
                        >
                          <TestTube size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(integration)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(integration.id)}
                          className="text-red-600 hover:text-red-700"
                        >
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
            <h2 className="text-xl font-semibold mb-4">Webhook Management</h2>
            <div className="space-y-4">
              {integrations.map(integration => 
                integration.webhooks.map(webhook => (
                  <div key={webhook.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{webhook.name}</h3>
                          <Badge variant="outline">{integration.name}</Badge>
                          <Badge variant={webhook.isActive ? "default" : "secondary"}>
                            {webhook.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Globe size={14} />
                            <span>{webhook.url}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap size={14} />
                            <span>Events: {webhook.events.join(', ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity size={14} />
                            <span>Success: {webhook.successCount} | Failed: {webhook.failureCount}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <ExternalLink size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="card-academic p-6">
              <h3 className="text-lg font-semibold mb-4">Integration Types</h3>
              <div className="space-y-3">
                {Object.entries(stats.integrationTypes).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="font-medium capitalize">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(count / stats.totalIntegrations) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="card-academic p-6">
              <h3 className="text-lg font-semibold mb-4">Providers</h3>
              <div className="space-y-3">
                {Object.entries(stats.providerBreakdown).map(([provider, count]) => (
                  <div key={provider} className="flex items-center justify-between">
                    <span className="font-medium">{provider}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(count / stats.totalIntegrations) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Integration</DialogTitle>
          </DialogHeader>
          <IntegrationForm
            formData={integrationForm}
            onInputChange={handleInputChange}
            onSubmit={handleEdit}
            onCancel={() => setShowEditDialog(false)}
            loading={editing}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Integration Form Component
function IntegrationForm({ 
  formData, 
  onInputChange, 
  onSubmit, 
  onCancel, 
  loading, 
  isEdit 
}: {
  formData: any;
  onInputChange: (field: string, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  isEdit: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Integration Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            placeholder="e.g., SendGrid Email Service"
            className="input-academic"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="provider">Provider *</Label>
          <Input
            id="provider"
            value={formData.provider}
            onChange={(e) => onInputChange('provider', e.target.value)}
            placeholder="e.g., SendGrid, Stripe, Google"
            className="input-academic"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="Integration description and purpose..."
          rows={3}
          className="input-academic"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Integration Type</Label>
        <Select value={formData.type} onValueChange={(value) => onInputChange('type', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email Service</SelectItem>
            <SelectItem value="payment">Payment Gateway</SelectItem>
            <SelectItem value="calendar">Calendar Integration</SelectItem>
            <SelectItem value="messaging">Messaging Service</SelectItem>
            <SelectItem value="analytics">Analytics Service</SelectItem>
            <SelectItem value="storage">Storage Service</SelectItem>
            <SelectItem value="authentication">Authentication Service</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={formData.apiKey}
            onChange={(e) => onInputChange('apiKey', e.target.value)}
            placeholder="API key or token"
            className="input-academic"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="secretKey">Secret Key</Label>
          <Input
            id="secretKey"
            type="password"
            value={formData.secretKey}
            onChange={(e) => onInputChange('secretKey', e.target.value)}
            placeholder="Secret key (if required)"
            className="input-academic"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endpoint">API Endpoint</Label>
        <Input
          id="endpoint"
          value={formData.endpoint}
          onChange={(e) => onInputChange('endpoint', e.target.value)}
          placeholder="https://api.example.com/v1"
          className="input-academic"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="webhookUrl">Webhook URL</Label>
        <Input
          id="webhookUrl"
          value={formData.webhookUrl}
          onChange={(e) => onInputChange('webhookUrl', e.target.value)}
          placeholder="https://your-app.com/webhooks/integration"
          className="input-academic"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Enable Integration</Label>
          <p className="text-sm text-muted-foreground">Activate this integration</p>
        </div>
        <Switch
          checked={formData.isEnabled}
          onCheckedChange={(checked) => onInputChange('isEnabled', checked)}
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          onClick={onSubmit}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isEdit ? 'Updating...' : 'Creating...'}
            </div>
          ) : (
            isEdit ? 'Update Integration' : 'Create Integration'
          )}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
