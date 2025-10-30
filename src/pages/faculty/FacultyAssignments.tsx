import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  listenAssignmentsByCourse,
  listenCoursesByInstructor,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  Assignment,
  Course
} from '@/services/firebaseService';
import AssignmentForm from '@/components/faculty/AssignmentForm';
import GradingInterface from '@/components/faculty/GradingInterface';
import { 
  Plus, Search, Calendar, Clock, Users, FileText, 
  Edit, Trash2, Eye, Download, Upload, TrendingUp, BookOpen
} from 'lucide-react';

export default function FacultyAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [showGradingInterface, setShowGradingInterface] = useState(false);
  const [selectedAssignmentForGrading, setSelectedAssignmentForGrading] = useState<Assignment | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Real-time Firebase listeners
  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    let unsubscribeAssignments: (() => void) | undefined;
    let unsubscribeCourses: (() => void) | undefined;

    const initializeRealTimeData = () => {
      // Listen to courses taught by this faculty
      unsubscribeCourses = listenCoursesByInstructor(user.id, (coursesData) => {
        setCourses(coursesData);
        setLoading(false);
      });

      // Listen to assignments for all courses taught by this faculty
      if (selectedCourse !== 'all') {
        unsubscribeAssignments = listenAssignmentsByCourse(selectedCourse, (assignmentsData) => {
          setAssignments(assignmentsData);
        });
      } else {
        // If "all" is selected, we need to listen to assignments for all courses
        // For now, we'll use the first course or show a message
        if (courses.length > 0) {
          unsubscribeAssignments = listenAssignmentsByCourse(courses[0].id, (assignmentsData) => {
            setAssignments(assignmentsData);
          });
        }
      }
    };

    initializeRealTimeData();

    // Cleanup listeners on unmount
    return () => {
      if (unsubscribeAssignments) unsubscribeAssignments();
      if (unsubscribeCourses) unsubscribeCourses();
    };
  }, [user?.id, selectedCourse, courses.length]);

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    
    setDeleting(assignmentId);
    try {
      const result = await deleteAssignment(assignmentId);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Assignment deleted successfully'
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete assignment',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete assignment',
        variant: 'destructive'
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleCreateAssignment = () => {
    setEditingAssignment(null);
    setShowAssignmentForm(true);
  };

  const handleEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment);
    setShowAssignmentForm(true);
  };

  const handleAssignmentSaved = () => {
    loadAssignments();
    setShowAssignmentForm(false);
    setEditingAssignment(null);
  };

  const handleGradeAssignment = (assignment: any) => {
    setSelectedAssignmentForGrading(assignment);
    setShowGradingInterface(true);
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.courseId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || assignment.courseId === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Programming': return 'bg-purple-100 text-purple-800';
      case 'Project': return 'bg-orange-100 text-orange-800';
      case 'Exam': return 'bg-red-100 text-red-800';
      case 'Portfolio': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Assignments</h1>
          <p className="text-muted-foreground">Create and manage course assignments.</p>
        </div>
        <Button className="btn-primary" onClick={handleCreateAssignment}>
          <Plus size={20} className="mr-2" />
          Create Assignment
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="card-academic p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-48">
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
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <FileText className="text-primary" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Assignments</p>
              <p className="text-2xl font-bold">{assignments.length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-success" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Active Assignments</p>
              <p className="text-2xl font-bold">{assignments.filter(a => a.status === 'active').length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="text-warning" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Courses</p>
              <p className="text-2xl font-bold">{courses.length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Users className="text-accent" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Submissions</p>
              <p className="text-2xl font-bold">{assignments.reduce((sum, a) => sum + (a.totalSubmissions || 0), 0)}</p>
            </div>
          </div>
        </Card>
      </div>

      {loading ? (
        <Card className="card-academic p-12 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Loading assignments...</p>
        </Card>
      ) : filteredAssignments.length === 0 ? (
        <Card className="card-academic p-12 text-center">
          <FileText className="text-muted-foreground mx-auto mb-4" size={48} />
          <p className="text-lg font-medium mb-2">No assignments found</p>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms' : 'No assignments have been created yet'}
          </p>
        </Card>
      ) : (
        /* Assignments Grid */
        <div className="grid lg:grid-cols-2 gap-6">
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="card-academic p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{assignment.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{assignment.courseName || 'Course'}</Badge>
                    <Badge className={getTypeColor(assignment.type || 'Assignment')}>
                      {assignment.type || 'Assignment'}
                    </Badge>
                    <Badge className={getStatusColor(assignment.status || 'active')}>
                      {assignment.status || 'active'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditAssignment(assignment)}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleGradeAssignment(assignment)}>
                    <Eye size={16} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteAssignment(assignment.id)}
                    disabled={deleting === assignment.id}
                  >
                    {deleting === assignment.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={16} />
                    <span>Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText size={16} />
                    <span>{assignment.points || 0} points</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={16} />
                    <span>{assignment.gradedSubmissions || 0}/{assignment.totalSubmissions || 0} graded</span>
                  </div>
                  <div className="text-muted-foreground">
                    {assignment.totalSubmissions ? Math.round(((assignment.gradedSubmissions || 0) / assignment.totalSubmissions) * 100) : 0}% graded
                  </div>
                </div>

                <div className="progress-academic">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${assignment.totalSubmissions ? ((assignment.gradedSubmissions || 0) / assignment.totalSubmissions) * 100 : 0}%` }} 
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1">
                    <Eye size={16} className="mr-2" />
                    View
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => handleGradeAssignment(assignment)}>
                    <Download size={16} className="mr-2" />
                    Grade
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <Card className="card-academic p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button variant="outline" className="justify-start" onClick={handleCreateAssignment}>
            <Plus className="mr-2" size={18} />
            Create Assignment
          </Button>
          <Button variant="outline" className="justify-start">
            <Upload className="mr-2" size={18} />
            Bulk Import
          </Button>
          <Button variant="outline" className="justify-start">
            <Download className="mr-2" size={18} />
            Export Grades
          </Button>
          <Button variant="outline" className="justify-start">
            <FileText className="mr-2" size={18} />
            Grade Reports
          </Button>
        </div>
      </Card>

      {/* Assignment Form Modal */}
      {showAssignmentForm && (
        <AssignmentForm
          assignment={editingAssignment}
          onClose={() => {
            setShowAssignmentForm(false);
            setEditingAssignment(null);
          }}
          onSave={handleAssignmentSaved}
        />
      )}

      {/* Grading Interface Modal */}
      {showGradingInterface && selectedAssignmentForGrading && (
        <GradingInterface
          assignmentId={selectedAssignmentForGrading.id}
          onClose={() => {
            setShowGradingInterface(false);
            setSelectedAssignmentForGrading(null);
          }}
        />
      )}
    </div>
  );
}
