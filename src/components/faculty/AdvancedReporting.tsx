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
import { advancedReportingService, ReportTemplate, GeneratedReport } from '@/services/advancedReportingService';
import { facultyCourseService } from '@/services/facultyService';
import { 
  FileText, Download, Eye, Trash2, Plus, Settings, 
  BarChart3, PieChart, TrendingUp, Calendar, Clock,
  Users, BookOpen, Award, Filter, Search
} from 'lucide-react';

export default function AdvancedReporting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Template management
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'academic',
    sections: []
  });

  // Report generation
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [reportForm, setReportForm] = useState({
    title: '',
    courseId: '',
    dateRange: 'semester',
    customStartDate: '',
    customEndDate: '',
    includeCharts: true,
    includeTables: true,
    includeSummary: true,
    includeRecommendations: true
  });

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, reportsData, coursesData] = await Promise.all([
        advancedReportingService.getDefaultTemplates(),
        advancedReportingService.getGeneratedReports(user.id),
        facultyCourseService.getFacultyCourses(user.id)
      ]);
      
      setTemplates(templatesData);
      setGeneratedReports(reportsData);
      setCourses(coursesData.map(course => ({
        id: course.id,
        name: `${course.code}: ${course.title}`
      })));
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reporting data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportForm.title || !reportForm.courseId || !selectedTemplate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
      if (!selectedTemplateData) {
        throw new Error('Template not found');
      }

      const reportData = {
        title: reportForm.title,
        template: selectedTemplateData,
        course: courses.find(c => c.id === reportForm.courseId),
        dateRange: reportForm.dateRange,
        customStartDate: reportForm.customStartDate,
        customEndDate: reportForm.customEndDate,
        options: {
          includeCharts: reportForm.includeCharts,
          includeTables: reportForm.includeTables,
          includeSummary: reportForm.includeSummary,
          includeRecommendations: reportForm.includeRecommendations
        }
      };

      const newReport = await advancedReportingService.generateReport(
        selectedTemplate,
        user.id,
        reportForm.courseId,
        reportData
      );

      setGeneratedReports([newReport, ...generatedReports]);
      setShowGenerateDialog(false);
      toast({
        title: 'Success',
        description: 'Report generation started successfully'
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await advancedReportingService.deleteReport(reportId);
      setGeneratedReports(prev => prev.filter(r => r.id !== reportId));
      toast({
        title: 'Success',
        description: 'Report deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete report',
        variant: 'destructive'
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return <BookOpen className="w-4 h-4" />;
      case 'administrative': return <Users className="w-4 h-4" />;
      case 'analytics': return <BarChart3 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'bg-blue-100 text-blue-800';
      case 'administrative': return 'bg-green-100 text-green-800';
      case 'analytics': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading advanced reporting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Advanced Reporting</h1>
          <p className="text-muted-foreground">Create custom reports with PDF generation and advanced analytics.</p>
        </div>
        <Button className="btn-primary" onClick={() => setShowGenerateDialog(true)}>
          <Plus size={20} className="mr-2" />
          Generate Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="generated">Generated Reports</TabsTrigger>
          <TabsTrigger value="analytics">Report Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Report Templates</h2>
            <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
              <Plus size={16} className="mr-2" />
              Create Template
            </Button>
          </div>

          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="card-academic p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      {getCategoryIcon(template.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                        {template.isDefault && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {template.sections.length} sections
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye size={16} />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings size={16} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setShowGenerateDialog(true);
                      }}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="generated" className="space-y-6">
          <h2 className="text-2xl font-bold">Generated Reports</h2>
          
          {generatedReports.length === 0 ? (
            <Card className="card-academic p-6 text-center">
              <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Reports Generated</h3>
              <p className="text-muted-foreground mb-4">Generate your first advanced report to get started.</p>
              <Button className="btn-primary" onClick={() => setShowGenerateDialog(true)}>
                <Plus size={20} className="mr-2" />
                Generate Report
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {generatedReports.map((report) => (
                <Card key={report.id} className="card-academic p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Template: {templates.find(t => t.id === report.templateId)?.name || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>Generated: {new Date(report.generatedAt.toDate()).toLocaleDateString()}</span>
                          {report.fileSize && <span>Size: {report.fileSize}</span>}
                          {report.pages && <span>Pages: {report.pages}</span>}
                          <Badge 
                            className={
                              report.status === 'completed' ? 'bg-success/10 text-success' :
                              report.status === 'generating' ? 'bg-warning/10 text-warning' :
                              'bg-destructive/10 text-destructive'
                            }
                          >
                            {report.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {report.status === 'completed' && (
                        <>
                          <Button variant="outline" size="sm">
                            <Eye size={16} className="mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download size={16} className="mr-2" />
                            Download
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteReport(report.id)}
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

        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-2xl font-bold">Report Analytics</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="card-academic p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-2xl font-bold">{generatedReports.length}</p>
                </div>
              </div>
            </Card>
            
            <Card className="card-academic p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <BarChart3 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">
                    {generatedReports.filter(r => {
                      const reportDate = r.generatedAt.toDate();
                      const now = new Date();
                      return reportDate.getMonth() === now.getMonth() && 
                             reportDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="card-academic p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Generation Time</p>
                  <p className="text-2xl font-bold">2.3s</p>
                </div>
              </div>
            </Card>
            
            <Card className="card-academic p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <BookOpen className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Templates Available</p>
                  <p className="text-2xl font-bold">{templates.length}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="card-academic p-6">
            <h3 className="text-lg font-semibold mb-4">Report Usage by Template</h3>
            <div className="space-y-3">
              {templates.map((template) => {
                const usageCount = generatedReports.filter(r => r.templateId === template.id).length;
                return (
                  <div key={template.id} className="flex items-center justify-between">
                    <span className="font-medium">{template.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(usageCount / Math.max(...templates.map(t => 
                            generatedReports.filter(r => r.templateId === t.id).length
                          ))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">{usageCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Report Dialog */}
      {showGenerateDialog && (
        <Dialog open={true} onOpenChange={() => setShowGenerateDialog(false)}>
          <DialogContent className="sm:max-w-[600px] p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gradient-primary">
                Generate Advanced Report
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Report Title <span className="text-red-500">*</span></Label>
                  <Input 
                    id="title" 
                    value={reportForm.title} 
                    onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., CS-301 Comprehensive Analysis Report" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="template">Report Template <span className="text-red-500">*</span></Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} - {template.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="courseId">Course <span className="text-red-500">*</span></Label>
                  <Select value={reportForm.courseId} onValueChange={(value) => setReportForm(prev => ({ ...prev, courseId: value }))}>
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
                  <Label htmlFor="dateRange">Date Range</Label>
                  <Select value={reportForm.dateRange} onValueChange={(value) => setReportForm(prev => ({ ...prev, dateRange: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="semester">This Semester</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label>Report Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="includeCharts" 
                        checked={reportForm.includeCharts}
                        onCheckedChange={(checked) => setReportForm(prev => ({ ...prev, includeCharts: checked }))}
                      />
                      <Label htmlFor="includeCharts" className="text-sm">Include Charts and Visualizations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="includeTables" 
                        checked={reportForm.includeTables}
                        onCheckedChange={(checked) => setReportForm(prev => ({ ...prev, includeTables: checked }))}
                      />
                      <Label htmlFor="includeTables" className="text-sm">Include Data Tables</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="includeSummary" 
                        checked={reportForm.includeSummary}
                        onCheckedChange={(checked) => setReportForm(prev => ({ ...prev, includeSummary: checked }))}
                      />
                      <Label htmlFor="includeSummary" className="text-sm">Include Executive Summary</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="includeRecommendations" 
                        checked={reportForm.includeRecommendations}
                        onCheckedChange={(checked) => setReportForm(prev => ({ ...prev, includeRecommendations: checked }))}
                      />
                      <Label htmlFor="includeRecommendations" className="text-sm">Include Recommendations</Label>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowGenerateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateReport} className="btn-primary">
                  <FileText size={16} className="mr-2" />
                  Generate Report
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
