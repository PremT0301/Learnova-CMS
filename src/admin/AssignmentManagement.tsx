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
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Filter,
  Calendar,
  Clock,
  Users,
  BookOpen,
  FileText,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Download,
  Upload
} from 'lucide-react';

type Assignment = {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  instructor: string;
  instructorId: string;
  department: string;
  type: 'assignment' | 'quiz' | 'exam' | 'project' | 'homework';
  maxPoints: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'grading' | 'completed';
  totalSubmissions: number;
  gradedSubmissions: number;
  averageScore: number;
  instructions?: string;
  attachments?: string[];
  rubric?: string;
  latePenalty?: number; // percentage
  allowLateSubmission: boolean;
  maxAttempts: number;
};

type Course = {
  id: string;
  title: string;
  code: string;
  instructor: string;
  instructorId: string;
  department: string;
  enrolled: number;
};

type AssignmentStats = {
  totalAssignments: number;
  publishedAssignments: number;
  pendingGrading: number;
  overdueAssignments: number;
  averageCompletion: number;
};

export default function AssignmentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'grading' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'assignment' | 'quiz' | 'exam' | 'project' | 'homework'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [stats, setStats] = useState<AssignmentStats>({
    totalAssignments: 0,
    publishedAssignments: 0,
    pendingGrading: 0,
    overdueAssignments: 0,
    averageCompletion: 0
  });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    type: 'assignment' as Assignment['type'],
    maxPoints: 100,
    dueDate: '',
    instructions: '',
    latePenalty: 0,
    allowLateSubmission: true,
    maxAttempts: 1,
    status: 'draft' as Assignment['status']
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Load assignments
      const assignmentsQuery = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignmentsList = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Assignment[];
      setAssignments(assignmentsList);

      // Load courses
      const coursesQuery = query(collection(db, 'courses'), where('status', '==', 'active'));
      const coursesSnapshot = await getDocs(coursesQuery);
      const coursesList = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
      setCourses(coursesList);

      // Calculate stats
      const totalAssignments = assignmentsList.length;
      const publishedAssignments = assignmentsList.filter(a => a.status === 'published').length;
      const pendingGrading = assignmentsList.filter(a => a.status === 'grading').length;
      const overdueAssignments = assignmentsList.filter(a => 
        a.status === 'published' && new Date(a.dueDate) < new Date()
      ).length;
      const averageCompletion = totalAssignments > 0 
        ? assignmentsList.reduce((sum, a) => sum + (a.gradedSubmissions / Math.max(a.totalSubmissions, 1)), 0) / totalAssignments * 100
        : 0;

      setStats({
        totalAssignments,
        publishedAssignments,
        pendingGrading,
        overdueAssignments,
        averageCompletion
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'Failed to load assignment data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = assignments;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.type === typeFilter);
    }

    // Filter by course
    if (courseFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.courseId === courseFilter);
    }

    setFilteredAssignments(filtered);
  }, [assignments, searchTerm, statusFilter, typeFilter, courseFilter]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      courseId: '',
      type: 'assignment',
      maxPoints: 100,
      dueDate: '',
      instructions: '',
      latePenalty: 0,
      allowLateSubmission: true,
      maxAttempts: 1,
      status: 'draft'
    });
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.courseId) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const selectedCourse = courses.find(c => c.id === formData.courseId);
      const assignmentData = {
        ...formData,
        courseTitle: selectedCourse?.title || '',
        courseCode: selectedCourse?.code || '',
        instructor: selectedCourse?.instructor || '',
        instructorId: selectedCourse?.instructorId || '',
        department: selectedCourse?.department || '',
        totalSubmissions: 0,
        gradedSubmissions: 0,
        averageScore: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'assignments'), assignmentData);
      await logAudit('assignment_create', assignmentData, user?.id);
      
      toast({ title: 'Success', description: 'Assignment created successfully' });
      setShowCreateDialog(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({ title: 'Error', description: 'Failed to create assignment', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAssignment) return;

    if (!formData.title.trim() || !formData.courseId) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setEditing(true);
    try {
      const selectedCourse = courses.find(c => c.id === formData.courseId);
      const assignmentData = {
        ...formData,
        courseTitle: selectedCourse?.title || '',
        courseCode: selectedCourse?.code || '',
        instructor: selectedCourse?.instructor || '',
        instructorId: selectedCourse?.instructorId || '',
        department: selectedCourse?.department || '',
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'assignments', selectedAssignment.id), assignmentData);
      await logAudit('assignment_update', { assignmentId: selectedAssignment.id, ...assignmentData }, user?.id);
      
      toast({ title: 'Success', description: 'Assignment updated successfully' });
      setShowEditDialog(false);
      setSelectedAssignment(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({ title: 'Error', description: 'Failed to update assignment', variant: 'destructive' });
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    setDeleting(assignmentId);
    try {
      await deleteDoc(doc(db, 'assignments', assignmentId));
      await logAudit('assignment_delete', { assignmentId }, user?.id);
      
      toast({ title: 'Success', description: 'Assignment deleted successfully' });
      await loadData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({ title: 'Error', description: 'Failed to delete assignment', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const openEditDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      courseId: assignment.courseId,
      type: assignment.type,
      maxPoints: assignment.maxPoints,
      dueDate: assignment.dueDate,
      instructions: assignment.instructions || '',
      latePenalty: assignment.latePenalty || 0,
      allowLateSubmission: assignment.allowLateSubmission,
      maxAttempts: assignment.maxAttempts,
      status: assignment.status
    });
    setShowEditDialog(true);
  };

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'grading':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: Assignment['type']) => {
    switch (type) {
      case 'exam':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'quiz':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'project':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'homework':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Assignment Management</h1>
          <p className="text-muted-foreground">Create, manage, and oversee assignments across all courses.</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus size={16} className="mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <AssignmentForm
              formData={formData}
              onInputChange={handleInputChange}
              onSubmit={handleCreate}
              onCancel={() => setShowCreateDialog(false)}
              loading={creating}
              courses={courses}
              isEdit={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-primary" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Assignments</p>
              <p className="text-2xl font-bold">{stats.totalAssignments}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold">{stats.publishedAssignments}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Clock className="text-yellow-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Pending Grading</p>
              <p className="text-2xl font-bold">{stats.pendingGrading}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold">{stats.overdueAssignments}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-blue-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Avg Completion</p>
              <p className="text-2xl font-bold">{stats.averageCompletion.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

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
              placeholder="Search assignments, courses, or instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="grading">Grading</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="assignment">Assignment</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
              <SelectItem value="exam">Exam</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="homework">Homework</SelectItem>
            </SelectContent>
          </Select>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Assignment List */}
      <Card className="card-academic p-6">
        <h2 className="text-xl font-semibold mb-4">Assignments ({filteredAssignments.length})</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading assignments...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No assignments found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-lg">{assignment.title}</h3>
                      <Badge className={`${getTypeColor(assignment.type)} border`}>
                        {assignment.type}
                      </Badge>
                      <Badge className={`${getStatusColor(assignment.status)} border`}>
                        {assignment.status}
                      </Badge>
                      {isOverdue(assignment.dueDate) && assignment.status === 'published' && (
                        <Badge variant="destructive">Overdue</Badge>
                      )}
                    </div>
                    <div className="grid md:grid-cols-5 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} />
                        <span>{assignment.courseTitle}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} />
                        <span>{assignment.instructor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText size={14} />
                        <span>{assignment.maxPoints} points</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 size={14} />
                        <span>{assignment.gradedSubmissions}/{assignment.totalSubmissions} graded</span>
                      </div>
                    </div>
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {assignment.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowViewDialog(true);
                      }}
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(assignment)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(assignment.id)}
                      disabled={deleting === assignment.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      {deleting === assignment.id ? (
                        <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          <AssignmentForm
            formData={formData}
            onInputChange={handleInputChange}
            onSubmit={handleEdit}
            onCancel={() => setShowEditDialog(false)}
            loading={editing}
            courses={courses}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm">{selectedAssignment.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Course</Label>
                  <p className="text-sm">{selectedAssignment.courseTitle} ({selectedAssignment.courseCode})</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Instructor</Label>
                  <p className="text-sm">{selectedAssignment.instructor}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm">{selectedAssignment.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Max Points</Label>
                  <p className="text-sm">{selectedAssignment.maxPoints}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Due Date</Label>
                  <p className="text-sm">{new Date(selectedAssignment.dueDate).toLocaleString()}</p>
                </div>
              </div>
              {selectedAssignment.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm">{selectedAssignment.description}</p>
                </div>
              )}
              {selectedAssignment.instructions && (
                <div>
                  <Label className="text-sm font-medium">Instructions</Label>
                  <p className="text-sm">{selectedAssignment.instructions}</p>
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Submissions</Label>
                  <p className="text-sm">{selectedAssignment.totalSubmissions}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Graded</Label>
                  <p className="text-sm">{selectedAssignment.gradedSubmissions}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Average Score</Label>
                  <p className="text-sm">{selectedAssignment.averageScore.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Assignment Form Component
function AssignmentForm({ 
  formData, 
  onInputChange, 
  onSubmit, 
  onCancel, 
  loading, 
  courses, 
  isEdit 
}: {
  formData: any;
  onInputChange: (field: string, value: string | number | boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  courses: Course[];
  isEdit: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Assignment Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            placeholder="e.g., Midterm Exam"
            className="input-academic"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="courseId">Course *</Label>
          <Select value={formData.courseId} onValueChange={(value) => onInputChange('courseId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title} ({course.code}) - {course.instructor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="Assignment description and objectives..."
          rows={3}
          className="input-academic"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Assignment Type</Label>
          <Select value={formData.type} onValueChange={(value) => onInputChange('type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="assignment">Assignment</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
              <SelectItem value="exam">Exam</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="homework">Homework</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxPoints">Max Points</Label>
          <Input
            id="maxPoints"
            type="number"
            min="1"
            value={formData.maxPoints}
            onChange={(e) => onInputChange('maxPoints', parseInt(e.target.value))}
            className="input-academic"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => onInputChange('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="grading">Grading</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            id="dueDate"
            type="datetime-local"
            value={formData.dueDate}
            onChange={(e) => onInputChange('dueDate', e.target.value)}
            className="input-academic"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxAttempts">Max Attempts</Label>
          <Input
            id="maxAttempts"
            type="number"
            min="1"
            max="10"
            value={formData.maxAttempts}
            onChange={(e) => onInputChange('maxAttempts', parseInt(e.target.value))}
            className="input-academic"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          value={formData.instructions}
          onChange={(e) => onInputChange('instructions', e.target.value)}
          placeholder="Detailed instructions for students..."
          rows={4}
          className="input-academic"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latePenalty">Late Penalty (%)</Label>
          <Input
            id="latePenalty"
            type="number"
            min="0"
            max="100"
            value={formData.latePenalty}
            onChange={(e) => onInputChange('latePenalty', parseInt(e.target.value))}
            className="input-academic"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Allow Late Submission</Label>
            <p className="text-sm text-muted-foreground">Allow submissions after due date</p>
          </div>
          <Switch
            checked={formData.allowLateSubmission}
            onCheckedChange={(checked) => onInputChange('allowLateSubmission', checked)}
          />
        </div>
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
            isEdit ? 'Update Assignment' : 'Create Assignment'
          )}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
