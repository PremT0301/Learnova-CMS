import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { facultyCourseService, facultyAnalyticsService } from '@/services/facultyService';
import { 
  FileText, Download, Filter, Calendar, Users, BookOpen, 
  BarChart3, TrendingUp, Award, Clock, Target, Star,
  Eye, Printer, Mail, Share2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function FacultyReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [reportType, setReportType] = useState('overview');
  const [timeRange, setTimeRange] = useState('semester');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatedReports, setGeneratedReports] = useState([]);

  // Report generation form state
  const [reportFormData, setReportFormData] = useState({
    title: '',
    description: '',
    type: 'overview',
    courseId: '',
    dateRange: 'semester',
    customStartDate: '',
    customEndDate: '',
    includeCharts: true,
    includeGrades: true,
    includeAttendance: true,
    includeAssignments: true
  });

  useEffect(() => {
    if (user?.id) {
      loadCourses();
      loadGeneratedReports();
    }
  }, [user]);

  const loadCourses = async () => {
    if (!user?.id) return;
    try {
      const coursesData = await facultyCourseService.getFacultyCourses(user.id);
      setCourses(coursesData.map(course => ({
        id: course.id,
        name: `${course.code}: ${course.title}`
      })));
      if (coursesData.length > 0 && !reportFormData.courseId) {
        setReportFormData(prev => ({ ...prev, courseId: coursesData[0].id }));
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGeneratedReports = async () => {
    if (!user?.id) return;
    try {
      // Mock data for generated reports - replace with actual Firebase call
      const mockReports = [
        {
          id: '1',
          title: 'CS-301 Semester Overview Report',
          type: 'overview',
          courseId: '1',
          courseName: 'CS-301: Data Structures & Algorithms',
          generatedAt: new Date('2024-01-15').toISOString(),
          status: 'completed',
          downloadUrl: '#',
          size: '2.3 MB',
          pages: 15
        },
        {
          id: '2',
          title: 'Assignment Performance Analysis',
          type: 'assignments',
          courseId: '2',
          courseName: 'CS-401: Database Management Systems',
          generatedAt: new Date('2024-01-10').toISOString(),
          status: 'completed',
          downloadUrl: '#',
          size: '1.8 MB',
          pages: 12
        },
        {
          id: '3',
          title: 'Student Progress Report',
          type: 'students',
          courseId: '1',
          courseName: 'CS-301: Data Structures & Algorithms',
          generatedAt: new Date('2024-01-08').toISOString(),
          status: 'completed',
          downloadUrl: '#',
          size: '3.1 MB',
          pages: 22
        }
      ];
      setGeneratedReports(mockReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const handleGenerateReport = () => {
    setReportFormData({
      title: '',
      description: '',
      type: 'overview',
      courseId: courses.length > 0 ? courses[0].id : '',
      dateRange: 'semester',
      customStartDate: '',
      customEndDate: '',
      includeCharts: true,
      includeGrades: true,
      includeAttendance: true,
      includeAssignments: true
    });
    setShowGenerateDialog(true);
  };

  const handleSaveReport = async (e) => {
    e.preventDefault();
    if (!user?.id || !reportFormData.title || !reportFormData.courseId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    setGeneratingReport(true);
    try {
      // Mock report generation - replace with actual report generation logic
      const newReport = {
        id: Date.now().toString(),
        title: reportFormData.title,
        type: reportFormData.type,
        courseId: reportFormData.courseId,
        courseName: courses.find(c => c.id === reportFormData.courseId)?.name || 'Unknown Course',
        generatedAt: new Date().toISOString(),
        status: 'completed',
        downloadUrl: '#',
        size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
        pages: Math.floor(Math.random() * 20 + 10)
      };
      
      setGeneratedReports([newReport, ...generatedReports]);
      setShowGenerateDialog(false);
      toast({
        title: 'Success',
        description: 'Report generated successfully.'
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive'
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setReportFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (id, value) => {
    setReportFormData(prev => ({ ...prev, [id]: value }));
  };

  // Mock analytics data for report previews
  const reportAnalytics = {
    coursePerformance: [
      { course: 'CS-301', students: 45, avgGrade: 87, completion: 92 },
      { course: 'CS-401', students: 38, avgGrade: 84, completion: 89 },
      { course: 'CS-450', students: 44, avgGrade: 86, completion: 91 }
    ],
    gradeDistribution: [
      { name: 'A', value: 25, fill: '#10b981' },
      { name: 'B', value: 45, fill: '#3b82f6' },
      { name: 'C', value: 20, fill: '#f59e0b' },
      { name: 'D', value: 8, fill: '#ef4444' },
      { name: 'F', value: 2, fill: '#6b7280' }
    ],
    assignmentTrends: [
      { name: 'Week 1', submissions: 95, average: 85 },
      { name: 'Week 2', submissions: 88, average: 82 },
      { name: 'Week 3', submissions: 92, average: 87 },
      { name: 'Week 4', submissions: 89, average: 84 },
      { name: 'Week 5', submissions: 94, average: 86 },
      { name: 'Week 6', submissions: 91, average: 88 },
      { name: 'Week 7', submissions: 93, average: 85 }
    ]
  };

  const filteredReports = generatedReports.filter(report => {
    const matchesCourse = selectedCourse === 'all' || report.courseId === selectedCourse;
    const matchesType = reportType === 'all' || report.type === reportType;
    return matchesCourse && matchesType;
  });

  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'overview': return <BarChart3 size={16} />;
      case 'assignments': return <FileText size={16} />;
      case 'students': return <Users size={16} />;
      case 'grades': return <Award size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getReportTypeColor = (type) => {
    switch (type) {
      case 'overview': return 'bg-primary/10 text-primary';
      case 'assignments': return 'bg-success/10 text-success';
      case 'students': return 'bg-warning/10 text-warning';
      case 'grades': return 'bg-accent/10 text-accent';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate comprehensive reports on your courses and student performance.</p>
        </div>
        <Button className="btn-primary" onClick={handleGenerateReport}>
          <FileText size={20} className="mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Filters */}
      <Card className="card-academic p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="selectedCourse" className="text-sm font-medium">Course</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="reportType" className="text-sm font-medium">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="overview">Course Overview</SelectItem>
                <SelectItem value="assignments">Assignment Analysis</SelectItem>
                <SelectItem value="students">Student Progress</SelectItem>
                <SelectItem value="grades">Grade Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="timeRange" className="text-sm font-medium">Time Range</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select time range" />
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
        </div>
      </Card>

      {/* Quick Stats */}
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
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">{generatedReports.filter(r => new Date(r.generatedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <Users className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Courses Covered</p>
              <p className="text-2xl font-bold">{new Set(generatedReports.map(r => r.courseId)).size}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <BarChart3 className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Report Size</p>
              <p className="text-2xl font-bold">2.1 MB</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Report Preview Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="text-primary" />
            <h2 className="text-lg font-semibold">Course Performance Overview</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportAnalytics.coursePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="course" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgGrade" fill="#4f46e5" name="Average Grade" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="text-primary" />
            <h2 className="text-lg font-semibold">Grade Distribution</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportAnalytics.gradeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {reportAnalytics.gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Generated Reports */}
      <Card className="card-academic p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Generated Reports</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              Export All
            </Button>
            <Button variant="outline" size="sm">
              <Mail size={16} className="mr-2" />
              Email Reports
            </Button>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedCourse !== 'all' || reportType !== 'all'
                ? "No reports match your current filters."
                : "Generate your first report to get started."}
            </p>
            <Button className="btn-primary" onClick={handleGenerateReport}>
              <FileText size={20} className="mr-2" />
              Generate Report
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${getReportTypeColor(report.type)}`}>
                    {getReportTypeIcon(report.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{report.title}</h3>
                    <p className="text-sm text-muted-foreground">{report.courseName}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Generated: {new Date(report.generatedAt).toLocaleDateString()}</span>
                      <span>{report.size}</span>
                      <span>{report.pages} pages</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye size={16} />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download size={16} />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Printer size={16} />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Report Generation Dialog */}
      {showGenerateDialog && (
        <Dialog open={true} onOpenChange={() => setShowGenerateDialog(false)}>
          <DialogContent className="sm:max-w-[600px] p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gradient-primary">
                Generate New Report
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveReport} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Report Title <span className="text-red-500">*</span></Label>
                    <Input id="title" value={reportFormData.title} onChange={handleChange} placeholder="e.g., CS-301 Semester Report" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseId">Course <span className="text-red-500">*</span></Label>
                    <Select value={reportFormData.courseId} onValueChange={(value) => handleSelectChange('courseId', value)}>
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
                    <Label htmlFor="type">Report Type</Label>
                    <Select value={reportFormData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overview">Course Overview</SelectItem>
                        <SelectItem value="assignments">Assignment Analysis</SelectItem>
                        <SelectItem value="students">Student Progress</SelectItem>
                        <SelectItem value="grades">Grade Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateRange">Date Range</Label>
                    <Select value={reportFormData.dateRange} onValueChange={(value) => handleSelectChange('dateRange', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
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
                </div>
                <div className="space-y-4">
                  {reportFormData.dateRange === 'custom' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="customStartDate">Start Date</Label>
                        <Input id="customStartDate" type="date" value={reportFormData.customStartDate} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customEndDate">End Date</Label>
                        <Input id="customEndDate" type="date" value={reportFormData.customEndDate} onChange={handleChange} />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={reportFormData.description} onChange={handleChange} placeholder="Report description..." rows={4} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium">Include in Report:</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      id="includeCharts"
                      type="checkbox"
                      checked={reportFormData.includeCharts}
                      onChange={handleChange}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="includeCharts">Charts & Graphs</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="includeGrades"
                      type="checkbox"
                      checked={reportFormData.includeGrades}
                      onChange={handleChange}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="includeGrades">Grade Analysis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="includeAttendance"
                      type="checkbox"
                      checked={reportFormData.includeAttendance}
                      onChange={handleChange}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="includeAttendance">Attendance Data</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="includeAssignments"
                      type="checkbox"
                      checked={reportFormData.includeAssignments}
                      onChange={handleChange}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="includeAssignments">Assignment Details</Label>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowGenerateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary" disabled={generatingReport}>
                  {generatingReport ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    'Generate Report'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
