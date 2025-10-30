import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { facultyAnalyticsService, facultyCourseService } from '@/services/facultyService';
import { 
  Users, Award, TrendingUp, BookOpen, Clock, 
  BarChart3, Calendar, Target, Star, FileText, 
  Download, Filter, Eye, Printer, Mail, Share2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function FacultyAnalytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [timeRange, setTimeRange] = useState('semester');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' or 'reports'
  
  // Reports state
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatedReports, setGeneratedReports] = useState([]);
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
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalAssignments: 0,
    activeAssignments: 0,
    completedAssignments: 0,
    totalAnnouncements: 0,
    courses: []
  });
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    if (user?.id) {
      loadAnalytics();
      loadCourses();
      loadGeneratedReports();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user?.id) return;
    
    try {
      const analyticsData = await facultyAnalyticsService.getAnalytics(user.id);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    if (!user?.id) return;
    
    try {
      const coursesData = await facultyCourseService.getFacultyCourses(user.id);
      setCourses(coursesData.map(course => ({
        id: course.id,
        name: `${course.code}: ${course.title}`
      })));
    } catch (error) {
      console.error('Error loading courses:', error);
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

  // Analytics data from Firebase
  const overallStats = [
    {
      title: 'Total Students',
      value: analytics.totalStudents.toString(),
      change: 'Across all courses',
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'Total Courses',
      value: analytics.totalCourses.toString(),
      change: 'Active this semester',
      icon: BookOpen,
      color: 'text-success',
      bg: 'bg-success/10'
    },
    {
      title: 'Active Assignments',
      value: analytics.activeAssignments.toString(),
      change: 'Currently active',
      icon: TrendingUp,
      color: 'text-warning',
      bg: 'bg-warning/10'
    },
    {
      title: 'Total Assignments',
      value: analytics.totalAssignments.toString(),
      change: 'This semester',
      icon: Award,
      color: 'text-accent',
      bg: 'bg-accent/10'
    }
  ];

  const gradeDistribution = [
    { name: 'A', value: 25, fill: '#10b981' },
    { name: 'B', value: 45, fill: '#3b82f6' },
    { name: 'C', value: 20, fill: '#f59e0b' },
    { name: 'D', value: 8, fill: '#ef4444' },
    { name: 'F', value: 2, fill: '#6b7280' }
  ];

  const assignmentTrends = [
    { name: 'Week 1', submissions: 95, average: 85 },
    { name: 'Week 2', submissions: 88, average: 82 },
    { name: 'Week 3', submissions: 92, average: 87 },
    { name: 'Week 4', submissions: 89, average: 84 },
    { name: 'Week 5', submissions: 94, average: 86 },
    { name: 'Week 6', submissions: 91, average: 88 },
    { name: 'Week 7', submissions: 93, average: 85 }
  ];

  const coursePerformance = analytics.courses.length > 0 ? analytics.courses.map(course => ({
    course: course.code,
    students: course.enrolled || 0,
    avgGrade: Math.floor(Math.random() * 20) + 75, // Mock data for now
    completion: Math.floor(Math.random() * 15) + 80 // Mock data for now
  })) : [
    { course: 'CS-301', students: 45, avgGrade: 87, completion: 92 },
    { course: 'CS-401', students: 38, avgGrade: 84, completion: 89 },
    { course: 'CS-450', students: 44, avgGrade: 86, completion: 91 }
  ];

  // Enhanced analytics data
  const studentEngagement = [
    { name: 'Week 1', assignments: 95, participation: 88, attendance: 92 },
    { name: 'Week 2', assignments: 88, participation: 85, attendance: 89 },
    { name: 'Week 3', assignments: 92, participation: 90, attendance: 87 },
    { name: 'Week 4', assignments: 89, participation: 87, attendance: 91 },
    { name: 'Week 5', assignments: 94, participation: 89, attendance: 88 },
    { name: 'Week 6', assignments: 91, participation: 86, attendance: 90 },
    { name: 'Week 7', assignments: 93, participation: 88, attendance: 89 }
  ];

  const topPerformers = [
    { name: 'Alice Johnson', course: 'CS-301', grade: 96, assignments: 8 },
    { name: 'Bob Smith', course: 'CS-401', grade: 94, assignments: 6 },
    { name: 'Carol Davis', course: 'CS-450', grade: 92, assignments: 10 },
    { name: 'David Wilson', course: 'CS-301', grade: 91, assignments: 8 },
    { name: 'Eva Brown', course: 'CS-401', grade: 89, assignments: 6 }
  ];

  const assignmentAnalytics = [
    { name: 'Binary Trees', submissions: 42, avgGrade: 87, onTime: 38 },
    { name: 'Sorting Algorithms', submissions: 45, avgGrade: 84, onTime: 41 },
    { name: 'Database Design', submissions: 38, avgGrade: 89, onTime: 35 },
    { name: 'SQL Queries', submissions: 40, avgGrade: 86, onTime: 37 },
    { name: 'React Components', submissions: 44, avgGrade: 88, onTime: 40 }
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Analytics & Reports</h1>
          <p className="text-muted-foreground">View analytics insights and generate comprehensive reports for your courses.</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select course" />
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
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="semester">This Semester</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('analytics')}
          className="rounded-b-none"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Analytics
        </Button>
        <Button
          variant={activeTab === 'reports' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('reports')}
          className="rounded-b-none"
        >
          <FileText className="w-4 h-4 mr-2" />
          Reports
        </Button>
      </div>

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <>
          {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overallStats.map((stat) => (
          <Card key={stat.title} className="card-academic p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="text-primary" />
            <h2 className="text-lg font-semibold">Grade Distribution</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-primary" />
            <h2 className="text-lg font-semibold">Assignment Trends</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={assignmentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="submissions" stroke="#4f46e5" strokeWidth={2} name="Submissions" />
                <Line type="monotone" dataKey="average" stroke="#10b981" strokeWidth={2} name="Average Grade" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="text-primary" />
            <h2 className="text-lg font-semibold">Course Performance</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coursePerformance}>
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
            <Target className="text-primary" />
            <h2 className="text-lg font-semibold">Completion Rates</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coursePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="course" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completion" fill="#10b981" name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Course Details Table */}
      <Card className="card-academic p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="text-primary" />
          <h2 className="text-lg font-semibold">Course Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-3">Course</th>
                <th className="py-3">Students</th>
                <th className="py-3">Avg Grade</th>
                <th className="py-3">Completion</th>
                <th className="py-3">Assignments</th>
                <th className="py-3">Rating</th>
              </tr>
            </thead>
            <tbody>
              {coursePerformance.map((course, index) => (
                <tr key={index} className="border-b border-border/60">
                  <td className="py-4">
                    <div className="font-medium">{course.course}</div>
                  </td>
                  <td className="py-4">{course.students}</td>
                  <td className="py-4">{course.avgGrade}%</td>
                  <td className="py-4">{course.completion}%</td>
                  <td className="py-4">8</td>
                  <td className="py-4">4.7</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Card>

    {/* Enhanced Analytics Sections */}
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Student Engagement Trends */}
      <Card className="card-academic p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="text-primary" />
          <h2 className="text-lg font-semibold">Student Engagement Trends</h2>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={studentEngagement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="assignments" stroke="#4f46e5" name="Assignment Submissions" />
              <Line type="monotone" dataKey="participation" stroke="#10b981" name="Class Participation" />
              <Line type="monotone" dataKey="attendance" stroke="#f59e0b" name="Attendance" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Top Performing Students */}
      <Card className="card-academic p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="text-primary" />
          <h2 className="text-lg font-semibold">Top Performing Students</h2>
        </div>
        <div className="space-y-3">
          {topPerformers.map((student, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.course}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">{student.grade}%</p>
                <p className="text-xs text-muted-foreground">{student.assignments} assignments</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* Assignment Analytics */}
    <Card className="card-academic p-6">
      <div className="flex items-center gap-3 mb-4">
        <BarChart3 className="text-primary" />
        <h2 className="text-lg font-semibold">Assignment Analytics</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-3">Assignment</th>
              <th className="py-3">Submissions</th>
              <th className="py-3">Average Grade</th>
              <th className="py-3">On-Time Submissions</th>
              <th className="py-3">Completion Rate</th>
            </tr>
          </thead>
          <tbody>
            {assignmentAnalytics.map((assignment, index) => (
              <tr key={index} className="border-b border-border/60">
                <td className="py-3 font-medium">{assignment.name}</td>
                <td className="py-3">{assignment.submissions}</td>
                <td className="py-3">
                  <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                    {assignment.avgGrade}%
                  </span>
                </td>
                <td className="py-3">{assignment.onTime}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(assignment.onTime / assignment.submissions) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round((assignment.onTime / assignment.submissions) * 100)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
        </>
      )}

      {/* Reports Tab Content */}
      {activeTab === 'reports' && (
        <>
          {/* Reports Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Generated Reports</h2>
              <p className="text-muted-foreground">View, download, and manage your course reports.</p>
            </div>
            <Button className="btn-primary" onClick={handleGenerateReport}>
              <FileText size={20} className="mr-2" />
              Generate New Report
            </Button>
          </div>

          {/* Reports List */}
          {generatedReports.length === 0 ? (
            <Card className="card-academic p-6 text-center">
              <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Reports Generated</h3>
              <p className="text-muted-foreground mb-4">Generate your first report to get started with comprehensive course analysis.</p>
              <Button className="btn-primary" onClick={handleGenerateReport}>
                <FileText size={20} className="mr-2" />
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
                        <p className="text-sm text-muted-foreground">{report.courseName}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>Generated: {new Date(report.generatedAt).toLocaleDateString()}</span>
                          <span>Size: {report.size}</span>
                          <span>Pages: {report.pages}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            report.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye size={16} className="mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download size={16} className="mr-2" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <Printer size={16} className="mr-2" />
                        Print
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail size={16} className="mr-2" />
                        Email
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Generate Report Dialog */}
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
                        <Input 
                          id="title" 
                          value={reportFormData.title} 
                          onChange={handleChange}
                          placeholder="e.g., CS-301 Semester Overview Report" 
                          required 
                        />
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
                            <SelectItem value="grades">Grade Analysis</SelectItem>
                            <SelectItem value="attendance">Attendance Report</SelectItem>
                            <SelectItem value="comprehensive">Comprehensive Report</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateRange">Date Range</Label>
                        <Select value={reportFormData.dateRange} onValueChange={(value) => handleSelectChange('dateRange', value)}>
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
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                          id="description" 
                          value={reportFormData.description} 
                          onChange={handleChange}
                          placeholder="Optional description of the report..." 
                          rows={3} 
                        />
                      </div>
                      <div className="space-y-3">
                        <Label>Include in Report</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="includeCharts"
                              checked={reportFormData.includeCharts}
                              onChange={handleChange}
                              className="rounded"
                            />
                            <Label htmlFor="includeCharts" className="text-sm">Charts and Visualizations</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="includeGrades"
                              checked={reportFormData.includeGrades}
                              onChange={handleChange}
                              className="rounded"
                            />
                            <Label htmlFor="includeGrades" className="text-sm">Grade Analysis</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="includeAttendance"
                              checked={reportFormData.includeAttendance}
                              onChange={handleChange}
                              className="rounded"
                            />
                            <Label htmlFor="includeAttendance" className="text-sm">Attendance Data</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="includeAssignments"
                              checked={reportFormData.includeAssignments}
                              onChange={handleChange}
                              className="rounded"
                            />
                            <Label htmlFor="includeAssignments" className="text-sm">Assignment Analysis</Label>
                          </div>
                        </div>
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
                        <div className="flex items-center gap-2">
                          <FileText size={16} />
                          Generate Report
                        </div>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  );
}
