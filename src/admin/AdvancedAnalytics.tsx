import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy, where, addDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  ChartPie,
  ChartLine,
  Activity,
  Users,
  BookOpen,
  Award,
  Clock,
  Calendar,
  Download,
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Target,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  Database,
  FileText,
  ChartBar,
  ChartScatter as ScatterIcon,
  ChartArea
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  AreaChart as RechartsAreaChart,
  ScatterChart as RechartsScatterChart,
  Bar,
  Line,
  Pie,
  Area,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine
} from 'recharts';

type CustomReport = {
  id: string;
  name: string;
  description: string;
  type: 'user_analytics' | 'academic_performance' | 'system_usage' | 'engagement_metrics' | 'financial' | 'custom';
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'table';
  dataSource: string[];
  filters: { [key: string]: any };
  metrics: string[];
  dateRange: {
    start: string;
    end: string;
  };
  createdBy: string;
  createdAt: string;
  lastRun: string;
  isPublic: boolean;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    enabled: boolean;
  };
};

type AnalyticsMetric = {
  id: string;
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  trend: number[];
  category: string;
  description: string;
};

type DashboardWidget = {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'kpi';
  data: any;
  position: { x: number; y: number; w: number; h: number };
  refreshInterval: number;
  isVisible: boolean;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export default function AdvancedAnalytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [customReports, setCustomReports] = useState<CustomReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<CustomReport[]>([]);
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CustomReport['type']>('all');
  const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [reportForm, setReportForm] = useState({
    name: '',
    description: '',
    type: 'user_analytics' as CustomReport['type'],
    chartType: 'bar' as CustomReport['chartType'],
    dataSource: [] as string[],
    metrics: [] as string[],
    filters: {},
    isPublic: false
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Load custom reports
      const reportsQuery = query(collection(db, 'custom_reports'), orderBy('createdAt', 'desc'));
      const reportsSnapshot = await getDocs(reportsQuery);
      const reportsList = reportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CustomReport[];
      setCustomReports(reportsList);
      setFilteredReports(reportsList);

      // Generate mock analytics metrics
      const mockMetrics: AnalyticsMetric[] = [
        {
          id: '1',
          name: 'Total Users',
          value: 1247,
          change: 12.5,
          changeType: 'increase',
          trend: [1100, 1120, 1150, 1180, 1200, 1220, 1247],
          category: 'Users',
          description: 'Total number of registered users'
        },
        {
          id: '2',
          name: 'Active Sessions',
          value: 89,
          change: -3.2,
          changeType: 'decrease',
          trend: [95, 92, 88, 91, 89, 87, 89],
          category: 'Engagement',
          description: 'Currently active user sessions'
        },
        {
          id: '3',
          name: 'Course Completion Rate',
          value: 78.5,
          change: 5.1,
          changeType: 'increase',
          trend: [70, 72, 74, 76, 77, 78, 78.5],
          category: 'Academic',
          description: 'Percentage of courses completed'
        },
        {
          id: '4',
          name: 'Average Grade',
          value: 85.2,
          change: 2.3,
          changeType: 'increase',
          trend: [82, 83, 84, 84.5, 85, 85.1, 85.2],
          category: 'Academic',
          description: 'Average grade across all courses'
        },
        {
          id: '5',
          name: 'System Uptime',
          value: 99.8,
          change: 0.1,
          changeType: 'increase',
          trend: [99.5, 99.6, 99.7, 99.7, 99.8, 99.8, 99.8],
          category: 'System',
          description: 'System availability percentage'
        },
        {
          id: '6',
          name: 'Revenue',
          value: 45680,
          change: 15.7,
          changeType: 'increase',
          trend: [38000, 39500, 41000, 42500, 44000, 45000, 45680],
          category: 'Financial',
          description: 'Total revenue for the period'
        }
      ];
      setMetrics(mockMetrics);

      // Generate mock widgets
      const mockWidgets: DashboardWidget[] = [
        {
          id: '1',
          title: 'User Growth',
          type: 'chart',
          data: {
            type: 'line',
            data: [
              { name: 'Jan', users: 400, new: 50 },
              { name: 'Feb', users: 450, new: 45 },
              { name: 'Mar', users: 500, new: 55 },
              { name: 'Apr', users: 580, new: 80 },
              { name: 'May', users: 650, new: 70 },
              { name: 'Jun', users: 720, new: 75 }
            ]
          },
          position: { x: 0, y: 0, w: 6, h: 4 },
          refreshInterval: 300,
          isVisible: true
        },
        {
          id: '2',
          title: 'Course Performance',
          type: 'chart',
          data: {
            type: 'bar',
            data: [
              { name: 'Math', completed: 85, enrolled: 120 },
              { name: 'Science', completed: 78, enrolled: 95 },
              { name: 'English', completed: 92, enrolled: 110 },
              { name: 'History', completed: 67, enrolled: 85 },
              { name: 'Art', completed: 88, enrolled: 75 }
            ]
          },
          position: { x: 6, y: 0, w: 6, h: 4 },
          refreshInterval: 600,
          isVisible: true
        }
      ];
      setWidgets(mockWidgets);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'Failed to load analytics data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = customReports;

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(report => report.type === typeFilter);
    }

    setFilteredReports(filtered);
  }, [customReports, searchTerm, typeFilter]);

  const handleCreateReport = async () => {
    if (!reportForm.name.trim()) {
      toast({ title: 'Validation Error', description: 'Please provide a report name', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const reportData = {
        ...reportForm,
        dateRange,
        createdBy: user?.id || '',
        createdAt: new Date().toISOString(),
        lastRun: new Date().toISOString()
      };

      await addDoc(collection(db, 'custom_reports'), reportData);
      await logAudit('analytics_report_create', reportData, user?.id);
      
      toast({ title: 'Success', description: 'Custom report created successfully' });
      setShowCreateDialog(false);
      setReportForm({
        name: '',
        description: '',
        type: 'user_analytics',
        chartType: 'bar',
        dataSource: [],
        metrics: [],
        filters: {},
        isPublic: false
      });
      await loadData();
    } catch (error) {
      console.error('Error creating report:', error);
      toast({ title: 'Error', description: 'Failed to create report', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const generateReportData = async (report: CustomReport) => {
    try {
      // Mock data generation based on report type
      let mockData = [];
      
      switch (report.type) {
        case 'user_analytics':
          mockData = [
            { name: 'Students', value: 856, color: '#0088FE' },
            { name: 'Faculty', value: 124, color: '#00C49F' },
            { name: 'Admins', value: 12, color: '#FFBB28' },
            { name: 'Guests', value: 255, color: '#FF8042' }
          ];
          break;
        case 'academic_performance':
          mockData = [
            { name: 'Jan', grade: 78, completion: 65 },
            { name: 'Feb', grade: 82, completion: 70 },
            { name: 'Mar', grade: 85, completion: 75 },
            { name: 'Apr', grade: 88, completion: 80 },
            { name: 'May', grade: 90, completion: 85 },
            { name: 'Jun', grade: 92, completion: 88 }
          ];
          break;
        case 'system_usage':
          mockData = [
            { name: 'Mobile', users: 45, sessions: 234 },
            { name: 'Desktop', users: 38, sessions: 189 },
            { name: 'Tablet', users: 17, sessions: 67 }
          ];
          break;
        default:
          mockData = [
            { name: 'Category A', value: 100 },
            { name: 'Category B', value: 150 },
            { name: 'Category C', value: 200 },
            { name: 'Category D', value: 120 }
          ];
      }
      
      setReportData(mockData);
      setSelectedReport(report);
    } catch (error) {
      console.error('Error generating report data:', error);
      toast({ title: 'Error', description: 'Failed to generate report data', variant: 'destructive' });
    }
  };

  const renderChart = (data: any[], type: CustomReport['chartType']) => {
    if (!data || data.length === 0) return null;

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </RechartsBarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsLineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            </RechartsLineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsAreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            </RechartsAreaChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsScatterChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis dataKey="y" />
              <Tooltip />
              <Scatter fill="#8884d8" />
            </RechartsScatterChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <div className="p-4">
            <p className="text-muted-foreground">Unsupported chart type</p>
          </div>
        );
    }
  };

  const getMetricIcon = (category: string) => {
    switch (category) {
      case 'Users':
        return <Users className="text-blue-500" size={20} />;
      case 'Engagement':
        return <Activity className="text-green-500" size={20} />;
      case 'Academic':
        return <Award className="text-purple-500" size={20} />;
      case 'System':
        return <Database className="text-orange-500" size={20} />;
      case 'Financial':
        return <TrendingUp className="text-green-600" size={20} />;
      default:
        return <BarChart3 className="text-gray-500" size={20} />;
    }
  };

  const formatMetricValue = (value: number, category: string) => {
    if (category === 'Financial') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    if (category === 'Academic' && value < 10) {
      return `${value}%`;
    }
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Advanced Analytics</h1>
          <p className="text-muted-foreground">Create custom reports and analyze data with advanced visualizations.</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus size={16} className="mr-2" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Custom Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Report Name *</Label>
                <Input
                  id="name"
                  value={reportForm.name}
                  onChange={(e) => setReportForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., User Engagement Analysis"
                  className="input-academic"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={reportForm.description}
                  onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Report description and purpose..."
                  rows={3}
                  className="input-academic"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Report Type</Label>
                  <Select value={reportForm.type} onValueChange={(value: any) => setReportForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user_analytics">User Analytics</SelectItem>
                      <SelectItem value="academic_performance">Academic Performance</SelectItem>
                      <SelectItem value="system_usage">System Usage</SelectItem>
                      <SelectItem value="engagement_metrics">Engagement Metrics</SelectItem>
                      <SelectItem value="financial">Financial Reports</SelectItem>
                      <SelectItem value="custom">Custom Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chartType">Chart Type</Label>
                  <Select value={reportForm.chartType} onValueChange={(value: any) => setReportForm(prev => ({ ...prev, chartType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                      <SelectItem value="scatter">Scatter Plot</SelectItem>
                      <SelectItem value="table">Data Table</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="input-academic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="input-academic"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleCreateReport}
                  disabled={creating}
                  className="btn-primary"
                >
                  {creating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </div>
                  ) : (
                    'Create Report'
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="reports">Custom Reports</TabsTrigger>
          <TabsTrigger value="widgets">Widgets</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          {/* Key Metrics Grid */}
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {metrics.map((metric) => (
              <Card key={metric.id} className="card-academic p-6">
                <div className="flex items-center gap-3">
                  {getMetricIcon(metric.category)}
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.name}</p>
                    <p className="text-2xl font-bold">{formatMetricValue(metric.value, metric.category)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {metric.changeType === 'increase' ? (
                        <TrendingUp className="text-green-500" size={14} />
                      ) : metric.changeType === 'decrease' ? (
                        <TrendingDown className="text-red-500" size={14} />
                      ) : (
                        <div className="w-3 h-3 bg-gray-400 rounded-full" />
                      )}
                      <span className={`text-xs ${metric.changeType === 'increase' ? 'text-green-500' : metric.changeType === 'decrease' ? 'text-red-500' : 'text-gray-500'}`}>
                        {Math.abs(metric.change)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Dashboard Widgets */}
          <div className="grid md:grid-cols-2 gap-6">
            {widgets.map((widget) => (
              <Card key={widget.id} className="card-academic p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{widget.title}</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw size={14} />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download size={14} />
                    </Button>
                  </div>
                </div>
                {renderChart(widget.data.data, widget.data.type)}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics">
          <div className="grid md:grid-cols-2 gap-6">
            {metrics.map((metric) => (
              <Card key={metric.id} className="card-academic p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getMetricIcon(metric.category)}
                    <div>
                      <h3 className="font-semibold">{metric.name}</h3>
                      <p className="text-sm text-muted-foreground">{metric.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{metric.category}</Badge>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{formatMetricValue(metric.value, metric.category)}</span>
                    <div className="flex items-center gap-1">
                      {metric.changeType === 'increase' ? (
                        <TrendingUp className="text-green-500" size={16} />
                      ) : metric.changeType === 'decrease' ? (
                        <TrendingDown className="text-red-500" size={16} />
                      ) : (
                        <div className="w-4 h-4 bg-gray-400 rounded-full" />
                      )}
                      <span className={`font-medium ${metric.changeType === 'increase' ? 'text-green-500' : metric.changeType === 'decrease' ? 'text-red-500' : 'text-gray-500'}`}>
                        {metric.changeType === 'increase' ? '+' : metric.changeType === 'decrease' ? '-' : ''}{Math.abs(metric.change)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-20">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={metric.trend.map((value, index) => ({ name: `Day ${index + 1}`, value }))}>
                        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={false} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports">
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
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="user_analytics">User Analytics</SelectItem>
                  <SelectItem value="academic_performance">Academic Performance</SelectItem>
                  <SelectItem value="system_usage">System Usage</SelectItem>
                  <SelectItem value="engagement_metrics">Engagement Metrics</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Reports List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading reports...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <BarChart3 size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No reports found. Create your first custom report!</p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <Card key={report.id} className="card-academic p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {report.chartType === 'bar' && <ChartBar className="text-blue-500" size={20} />}
                      {report.chartType === 'line' && <ChartLine className="text-green-500" size={20} />}
                      {report.chartType === 'pie' && <ChartPie className="text-purple-500" size={20} />}
                      {report.chartType === 'area' && <ChartArea className="text-orange-500" size={20} />}
                      {report.chartType === 'scatter' && <ScatterIcon className="text-red-500" size={20} />}
                      {report.chartType === 'table' && <FileText className="text-gray-500" size={20} />}
                      <Badge variant="outline">{report.type.replace('_', ' ')}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => generateReportData(report)}>
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
                  <h3 className="font-semibold text-lg mb-2">{report.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{report.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last run: {new Date(report.lastRun).toLocaleDateString()}</span>
                    <span>{report.isPublic ? 'Public' : 'Private'}</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="widgets">
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Dashboard Widgets</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {widgets.map((widget) => (
                <Card key={widget.id} className="p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{widget.title}</h3>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm">
                        <Edit size={12} />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye size={12} />
                      </Button>
                    </div>
                  </div>
                  <div className="h-32">
                    {renderChart(widget.data.data, widget.data.type)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>Refresh: {widget.refreshInterval}s</span>
                    <span>{widget.isVisible ? 'Visible' : 'Hidden'}</span>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Viewer Dialog */}
      {selectedReport && reportData && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedReport.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
              <div className="h-96">
                {renderChart(reportData, selectedReport.chartType)}
              </div>
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Generated on {new Date().toLocaleString()}
                </div>
                <Button variant="outline">
                  <Download size={16} className="mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
