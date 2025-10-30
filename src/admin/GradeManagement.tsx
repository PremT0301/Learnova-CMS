import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import { 
  GraduationCap, 
  Search, 
  Filter,
  Edit,
  Save,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Users,
  BookOpen,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Calculator,
  Award,
  FileText
} from 'lucide-react';

type Grade = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  assignmentId: string;
  assignmentTitle: string;
  assignmentType: string;
  instructorId: string;
  instructorName: string;
  score: number;
  maxPoints: number;
  percentage: number;
  letterGrade: string;
  gpaPoints: number;
  feedback?: string;
  gradedBy: string;
  gradedAt: string;
  isOverride: boolean;
  overrideReason?: string;
  status: 'graded' | 'pending' | 'needs_review' | 'disputed';
  semester: string;
  year: number;
};

type Course = {
  id: string;
  title: string;
  code: string;
  instructor: string;
  instructorId: string;
  department: string;
};

type Assignment = {
  id: string;
  title: string;
  type: string;
  maxPoints: number;
  courseId: string;
};

type GradeStats = {
  totalGrades: number;
  averageGrade: number;
  gradeDistribution: { [key: string]: number };
  pendingReviews: number;
  disputedGrades: number;
  overrides: number;
};

type StudentGradeSummary = {
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  totalPoints: number;
  earnedPoints: number;
  averageGrade: number;
  letterGrade: string;
  gpa: number;
  assignments: number;
  completed: number;
};

const gradeScale = {
  'A+': { min: 97, max: 100, gpa: 4.0 },
  'A': { min: 93, max: 96.9, gpa: 4.0 },
  'A-': { min: 90, max: 92.9, gpa: 3.7 },
  'B+': { min: 87, max: 89.9, gpa: 3.3 },
  'B': { min: 83, max: 86.9, gpa: 3.0 },
  'B-': { min: 80, max: 82.9, gpa: 2.7 },
  'C+': { min: 77, max: 79.9, gpa: 2.3 },
  'C': { min: 73, max: 76.9, gpa: 2.0 },
  'C-': { min: 70, max: 72.9, gpa: 1.7 },
  'D+': { min: 67, max: 69.9, gpa: 1.3 },
  'D': { min: 65, max: 66.9, gpa: 1.0 },
  'F': { min: 0, max: 64.9, gpa: 0.0 }
};

export default function GradeManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [grades, setGrades] = useState<Grade[]>([]);
  const [filteredGrades, setFilteredGrades] = useState<Grade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentSummaries, setStudentSummaries] = useState<StudentGradeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'graded' | 'pending' | 'needs_review' | 'disputed'>('all');
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState<GradeStats>({
    totalGrades: 0,
    averageGrade: 0,
    gradeDistribution: {},
    pendingReviews: 0,
    disputedGrades: 0,
    overrides: 0
  });
  
  const [editForm, setEditForm] = useState({
    score: 0,
    feedback: '',
    overrideReason: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Load grades
      const gradesQuery = query(collection(db, 'grades'), orderBy('gradedAt', 'desc'));
      const gradesSnapshot = await getDocs(gradesQuery);
      const gradesList = gradesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Grade[];
      setGrades(gradesList);

      // Load courses
      const coursesQuery = query(collection(db, 'courses'), where('status', '==', 'active'));
      const coursesSnapshot = await getDocs(coursesQuery);
      const coursesList = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
      setCourses(coursesList);

      // Load assignments
      const assignmentsQuery = query(collection(db, 'assignments'));
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignmentsList = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Assignment[];
      setAssignments(assignmentsList);

      // Calculate student summaries
      const summaries = calculateStudentSummaries(gradesList);
      setStudentSummaries(summaries);

      // Calculate stats
      const totalGrades = gradesList.length;
      const averageGrade = totalGrades > 0 ? gradesList.reduce((sum, g) => sum + g.percentage, 0) / totalGrades : 0;
      const gradeDistribution = calculateGradeDistribution(gradesList);
      const pendingReviews = gradesList.filter(g => g.status === 'needs_review').length;
      const disputedGrades = gradesList.filter(g => g.status === 'disputed').length;
      const overrides = gradesList.filter(g => g.isOverride).length;

      setStats({
        totalGrades,
        averageGrade,
        gradeDistribution,
        pendingReviews,
        disputedGrades,
        overrides
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'Failed to load grade data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const calculateStudentSummaries = (gradesList: Grade[]): StudentGradeSummary[] => {
    const studentMap = new Map<string, StudentGradeSummary>();

    gradesList.forEach(grade => {
      const key = `${grade.studentId}-${grade.courseId}`;
      
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          studentId: grade.studentId,
          studentName: grade.studentName,
          courseId: grade.courseId,
          courseTitle: grade.courseTitle,
          totalPoints: 0,
          earnedPoints: 0,
          averageGrade: 0,
          letterGrade: '',
          gpa: 0,
          assignments: 0,
          completed: 0
        });
      }

      const summary = studentMap.get(key)!;
      summary.totalPoints += grade.maxPoints;
      summary.earnedPoints += grade.score;
      summary.assignments += 1;
      if (grade.status === 'graded') {
        summary.completed += 1;
      }
    });

    // Calculate averages and letter grades
    studentMap.forEach(summary => {
      summary.averageGrade = summary.totalPoints > 0 ? (summary.earnedPoints / summary.totalPoints) * 100 : 0;
      summary.letterGrade = calculateLetterGrade(summary.averageGrade);
      summary.gpa = gradeScale[summary.letterGrade as keyof typeof gradeScale]?.gpa || 0;
    });

    return Array.from(studentMap.values());
  };

  const calculateGradeDistribution = (gradesList: Grade[]): { [key: string]: number } => {
    const distribution: { [key: string]: number } = {};
    
    gradesList.forEach(grade => {
      const letter = grade.letterGrade;
      distribution[letter] = (distribution[letter] || 0) + 1;
    });

    return distribution;
  };

  const calculateLetterGrade = (percentage: number): string => {
    for (const [letter, range] of Object.entries(gradeScale)) {
      if (percentage >= range.min && percentage <= range.max) {
        return letter;
      }
    }
    return 'F';
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = grades;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(grade =>
        grade.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grade.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grade.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by course
    if (courseFilter !== 'all') {
      filtered = filtered.filter(grade => grade.courseId === courseFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(grade => grade.status === statusFilter);
    }

    setFilteredGrades(filtered);
  }, [grades, searchTerm, courseFilter, statusFilter]);

  const handleEditGrade = async () => {
    if (!selectedGrade) return;

    setEditing(true);
    try {
      const updatedGrade = {
        ...selectedGrade,
        score: editForm.score,
        percentage: (editForm.score / selectedGrade.maxPoints) * 100,
        letterGrade: calculateLetterGrade((editForm.score / selectedGrade.maxPoints) * 100),
        gpaPoints: gradeScale[calculateLetterGrade((editForm.score / selectedGrade.maxPoints) * 100) as keyof typeof gradeScale]?.gpa || 0,
        feedback: editForm.feedback,
        isOverride: true,
        overrideReason: editForm.overrideReason,
        gradedBy: user?.name || 'Admin',
        gradedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'grades', selectedGrade.id), updatedGrade);
      await logAudit('grade_override', { 
        gradeId: selectedGrade.id, 
        studentId: selectedGrade.studentId,
        courseId: selectedGrade.courseId,
        oldScore: selectedGrade.score,
        newScore: editForm.score,
        reason: editForm.overrideReason
      }, user?.id);
      
      toast({ title: 'Success', description: 'Grade updated successfully' });
      setShowEditDialog(false);
      setSelectedGrade(null);
      await loadData();
    } catch (error) {
      console.error('Error updating grade:', error);
      toast({ title: 'Error', description: 'Failed to update grade', variant: 'destructive' });
    } finally {
      setEditing(false);
    }
  };

  const openEditDialog = (grade: Grade) => {
    setSelectedGrade(grade);
    setEditForm({
      score: grade.score,
      feedback: grade.feedback || '',
      overrideReason: ''
    });
    setShowEditDialog(true);
  };

  const getStatusColor = (status: Grade['status']) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'needs_review':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'disputed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGradeColor = (letterGrade: string) => {
    if (['A+', 'A', 'A-'].includes(letterGrade)) return 'text-green-600';
    if (['B+', 'B', 'B-'].includes(letterGrade)) return 'text-blue-600';
    if (['C+', 'C', 'C-'].includes(letterGrade)) return 'text-yellow-600';
    if (['D+', 'D'].includes(letterGrade)) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Grade Management</h1>
          <p className="text-muted-foreground">Oversee, review, and override grades across all courses.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowBulkEditDialog(true)}
            variant="outline"
            className="btn-secondary"
          >
            <Upload size={16} className="mr-2" />
            Bulk Import
          </Button>
          <Button
            onClick={loadData}
            variant="outline"
            className="btn-secondary"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-6 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-primary" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Grades</p>
              <p className="text-2xl font-bold">{stats.totalGrades}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Calculator className="text-blue-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Average Grade</p>
              <p className="text-2xl font-bold">{stats.averageGrade.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Needs Review</p>
              <p className="text-2xl font-bold">{stats.pendingReviews}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <FileText className="text-red-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Disputed</p>
              <p className="text-2xl font-bold">{stats.disputedGrades}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Award className="text-purple-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Overrides</p>
              <p className="text-2xl font-bold">{stats.overrides}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Users className="text-green-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Students</p>
              <p className="text-2xl font-bold">{studentSummaries.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="grades" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="grades">Individual Grades</TabsTrigger>
          <TabsTrigger value="students">Student Summaries</TabsTrigger>
          <TabsTrigger value="analytics">Grade Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="grades">
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
                  placeholder="Search students, courses, or assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="graded">Graded</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="needs_review">Needs Review</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Grades List */}
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Grades ({filteredGrades.length})</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading grades...</p>
              </div>
            ) : filteredGrades.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No grades found matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGrades.map((grade) => (
                  <div key={grade.id} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-lg">{grade.studentName}</h3>
                          <Badge className={`${getStatusColor(grade.status)} border`}>
                            {grade.status.replace('_', ' ')}
                          </Badge>
                          {grade.isOverride && (
                            <Badge variant="outline" className="border-orange-300 text-orange-700">
                              Override
                            </Badge>
                          )}
                        </div>
                        <div className="grid md:grid-cols-5 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <BookOpen size={14} />
                            <span>{grade.courseTitle}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClipboardList size={14} />
                            <span>{grade.assignmentTitle}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={14} />
                            <span>{grade.instructorName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calculator size={14} />
                            <span>{grade.score}/{grade.maxPoints} ({grade.percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award size={14} />
                            <span className={getGradeColor(grade.letterGrade)}>{grade.letterGrade} ({grade.gpaPoints})</span>
                          </div>
                        </div>
                        {grade.feedback && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {grade.feedback}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(grade)}
                        >
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

        <TabsContent value="students">
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Student Grade Summaries ({studentSummaries.length})</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading student summaries...</p>
              </div>
            ) : studentSummaries.length === 0 ? (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No student summaries found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {studentSummaries.map((summary) => (
                  <div key={`${summary.studentId}-${summary.courseId}`} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-lg">{summary.studentName}</h3>
                          <Badge variant="outline">{summary.courseTitle}</Badge>
                          <Badge className={`${getGradeColor(summary.letterGrade)} bg-transparent border-current`}>
                            {summary.letterGrade} (GPA: {summary.gpa.toFixed(2)})
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calculator size={14} />
                            <span>Average: {summary.averageGrade.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BarChart3 size={14} />
                            <span>Points: {summary.earnedPoints}/{summary.totalPoints}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClipboardList size={14} />
                            <span>Assignments: {summary.completed}/{summary.assignments}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp size={14} />
                            <span>Progress: {((summary.completed / summary.assignments) * 100).toFixed(1)}%</span>
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

        <TabsContent value="analytics">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="card-academic p-6">
              <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
              <div className="space-y-3">
                {Object.entries(stats.gradeDistribution)
                  .sort(([,a], [,b]) => b - a)
                  .map(([letter, count]) => (
                    <div key={letter} className="flex items-center justify-between">
                      <span className="font-medium">{letter}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(count / stats.totalGrades) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="card-academic p-6">
              <h3 className="text-lg font-semibold mb-4">Course Performance</h3>
              <div className="space-y-3">
                {courses.map(course => {
                  const courseGrades = grades.filter(g => g.courseId === course.id);
                  const avgGrade = courseGrades.length > 0 
                    ? courseGrades.reduce((sum, g) => sum + g.percentage, 0) / courseGrades.length 
                    : 0;
                  
                  return (
                    <div key={course.id} className="flex items-center justify-between">
                      <span className="font-medium text-sm">{course.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{avgGrade.toFixed(1)}%</span>
                        <span className="text-xs text-muted-foreground">({courseGrades.length} grades)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Grade Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Grade - {selectedGrade?.studentName}</DialogTitle>
          </DialogHeader>
          {selectedGrade && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Assignment</Label>
                  <p className="text-sm">{selectedGrade.assignmentTitle}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Course</Label>
                  <p className="text-sm">{selectedGrade.courseTitle}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="score">Score *</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max={selectedGrade.maxPoints}
                  value={editForm.score}
                  onChange={(e) => setEditForm(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))}
                  className="input-academic"
                />
                <p className="text-xs text-muted-foreground">
                  Out of {selectedGrade.maxPoints} points ({(editForm.score / selectedGrade.maxPoints * 100).toFixed(1)}%)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={editForm.feedback}
                  onChange={(e) => setEditForm(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="Grade feedback for student..."
                  rows={3}
                  className="input-academic"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="overrideReason">Override Reason *</Label>
                <Input
                  id="overrideReason"
                  value={editForm.overrideReason}
                  onChange={(e) => setEditForm(prev => ({ ...prev, overrideReason: e.target.value }))}
                  placeholder="Reason for grade override..."
                  className="input-academic"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleEditGrade}
                  disabled={editing || !editForm.overrideReason.trim()}
                  className="btn-primary"
                >
                  {editing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save size={16} />
                      Update Grade
                    </div>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
