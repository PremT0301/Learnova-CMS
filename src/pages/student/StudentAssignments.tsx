import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  listenAssignmentsByStudent,
  listenSubmissionsByStudent,
  submitAssignment,
  Assignment,
  Submission
} from '@/services/firebaseService';
import { 
  Calendar, Clock, Upload, FileText, Eye, Download, 
  AlertCircle, CheckCircle, XCircle, Filter, Search,
  BookOpen, Award, TrendingUp
} from 'lucide-react';

export default function StudentAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Real-time Firebase listeners
  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    let unsubscribeAssignments: (() => void) | undefined;
    let unsubscribeSubmissions: (() => void) | undefined;

    const initializeRealTimeData = () => {
      // Listen to assignments for this student
      unsubscribeAssignments = listenAssignmentsByStudent(user.id, (assignmentsData) => {
        setAssignments(assignmentsData);
        setLoading(false);
      });

      // Listen to submissions by this student
      unsubscribeSubmissions = listenSubmissionsByStudent(user.id, (submissionsData) => {
        setSubmissions(submissionsData);
      });
    };

    initializeRealTimeData();

    // Cleanup listeners on unmount
    return () => {
      if (unsubscribeAssignments) unsubscribeAssignments();
      if (unsubscribeSubmissions) unsubscribeSubmissions();
    };
  }, [user?.id]);

  const handleSubmitAssignment = async (assignmentId: string) => {
    if (!user?.id) return;

    setSubmitting(assignmentId);
    try {
      const result = await submitAssignment(assignmentId, user.id, {
        content: 'Assignment submitted',
        attachments: []
      });
      
      if (result.success) {
        toast({
          title: 'Assignment Submitted',
          description: 'Your assignment has been submitted successfully',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Submission Failed',
          description: result.error || 'Failed to submit assignment',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: 'Submission Failed',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(null);
    }
  };

  // Get unique courses from assignments
  const courses = Array.from(new Set(assignments.map(a => a.courseName || 'Unknown Course')));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'submitted':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'graded':
        return <Award className="w-4 h-4 text-primary" />;
      case 'draft':
        return <FileText className="w-4 h-4 text-muted-foreground" />;
      default:
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'destructive',
      submitted: 'secondary',
      graded: 'default',
      draft: 'outline'
    };
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
  };

  // Helper function to get assignment status based on submissions
  const getAssignmentStatus = (assignment: Assignment) => {
    const submission = submissions.find(s => s.assignmentId === assignment.id);
    if (submission) {
      if (submission.grade !== null && submission.grade !== undefined) {
        return 'graded';
      } else {
        return 'submitted';
      }
    }
    return 'pending';
  };

  const filteredAssignments = assignments.filter(assignment => {
    const status = getAssignmentStatus(assignment);
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (assignment.courseName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    const matchesCourse = filterCourse === 'all' || (assignment.courseName || '') === filterCourse;
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => getAssignmentStatus(a) === 'pending').length,
    submitted: assignments.filter(a => getAssignmentStatus(a) === 'submitted').length,
    graded: assignments.filter(a => getAssignmentStatus(a) === 'graded').length
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">My Assignments</h1>
        <p className="text-muted-foreground">Track and submit your course assignments</p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Assignments</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <AlertCircle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-secondary/10">
              <CheckCircle className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="text-2xl font-bold">{stats.submitted}</p>
            </div>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <Award className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Graded</p>
              <p className="text-2xl font-bold">{stats.graded}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-academic p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course} value={course}>{course}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loading ? (
        <Card className="card-academic p-12 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Loading assignments...</p>
        </Card>
      ) : filteredAssignments.length === 0 ? (
        <Card className="card-academic p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search criteria' : 'No assignments have been assigned yet'}
          </p>
        </Card>
      ) : (
        /* Assignments List */
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const status = getAssignmentStatus(assignment);
            const submission = submissions.find(s => s.assignmentId === assignment.id);
            
            return (
              <Card key={assignment.id} className="card-academic p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(status)}
                      <h3 className="text-xl font-semibold">{assignment.title}</h3>
                      {getStatusBadge(status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{assignment.courseName || 'Course'}</span>
                      </div>
                      <span>•</span>
                      <span>{assignment.instructor || 'Instructor'}</span>
                      <span>•</span>
                      <span>{assignment.points || 0} points</span>
                    </div>
                    <p className="text-muted-foreground mb-4">{assignment.description || 'No description available'}</p>
                  </div>

                  <div className="text-right ml-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}</span>
                    </div>
                    
                    {submission?.grade !== null && submission?.grade !== undefined && (
                      <div className="text-right mb-4">
                        <p className="text-2xl font-bold text-success">{submission.grade}/{assignment.points || 0}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.points ? ((submission.grade / assignment.points) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    {status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleSubmitAssignment(assignment.id)}
                        disabled={submitting === assignment.id}
                      >
                        {submitting === assignment.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Submit Assignment
                      </Button>
                    )}
                    {status === 'submitted' && (
                      <Button size="sm" variant="outline">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Submitted
                      </Button>
                    )}
                  </div>

                  {submission?.submittedAt && (
                    <div className="text-sm text-muted-foreground">
                      Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {submission?.feedback && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Feedback:</h4>
                    <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
