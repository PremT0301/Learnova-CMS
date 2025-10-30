import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Upload,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  Send
} from 'lucide-react';
import { Assignment, Submission } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  deleteDoc, 
  doc,
  query,
  where,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface AssignmentsTabProps {
  courseId: string;
  assignments: Assignment[];
  onRefresh: () => void;
  isInstructor: boolean;
}

export default function AssignmentsTab({ 
  courseId, 
  assignments, 
  onRefresh,
  isInstructor 
}: AssignmentsTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxPoints: 100,
    type: 'homework' as 'homework' | 'quiz' | 'exam' | 'project',
    status: 'published' as 'draft' | 'published' | 'completed'
  });

  const [submissionData, setSubmissionData] = useState({
    content: '',
    linkUrl: ''
  });
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isInstructor && user?.id) {
      loadUserSubmissions();
    }
  }, [assignments, user?.id, isInstructor]);

  const loadUserSubmissions = async () => {
    if (!user?.id) return;
    
    try {
      const submissionsRef = collection(db, 'submissions');
      const q = query(submissionsRef, where('studentId', '==', user.id));
      const snapshot = await getDocs(q);
      
      const submissionsMap: Record<string, Submission> = {};
      snapshot.docs.forEach(doc => {
        const submission = { id: doc.id, ...doc.data() } as Submission;
        submissionsMap[submission.assignmentId] = submission;
      });
      
      setSubmissions(submissionsMap);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const handleCreateAssignment = async () => {
    if (!formData.title || !formData.description || !formData.dueDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, 'assignments'), {
        courseId,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        maxPoints: formData.maxPoints,
        type: formData.type,
        status: formData.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Success',
        description: 'Assignment created successfully',
      });

      setShowCreateDialog(false);
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        maxPoints: 100,
        type: 'homework',
        status: 'published'
      });
      onRefresh();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create assignment',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !user?.id) return;

    if (!submissionData.content && !submissionFile && !submissionData.linkUrl) {
      toast({
        title: 'Error',
        description: 'Please provide submission content, file, or link',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      let fileUrl = '';
      const attachments: string[] = [];

      // Upload file if provided
      if (submissionFile) {
        const storageRef = ref(
          storage, 
          `submissions/${selectedAssignment.id}/${user.id}/${Date.now()}_${submissionFile.name}`
        );
        const uploadTask = uploadBytesResumable(storageRef, submissionFile);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => reject(error),
            () => resolve()
          );
        });

        fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
        attachments.push(fileUrl);
      }

      // Add link if provided
      if (submissionData.linkUrl) {
        attachments.push(submissionData.linkUrl);
      }

      // Check if already submitted
      const existingSubmission = submissions[selectedAssignment.id];
      
      if (existingSubmission) {
        // Update existing submission
        await updateDoc(doc(db, 'submissions', existingSubmission.id), {
          content: submissionData.content,
          attachments,
          submittedAt: serverTimestamp(),
          status: 'submitted'
        });
      } else {
        // Create new submission
        await addDoc(collection(db, 'submissions'), {
          assignmentId: selectedAssignment.id,
          studentId: user.id,
          content: submissionData.content,
          attachments,
          submittedAt: serverTimestamp(),
          status: 'submitted'
        });
      }

      toast({
        title: 'Success',
        description: 'Assignment submitted successfully',
      });

      setShowSubmitDialog(false);
      setSubmissionData({ content: '', linkUrl: '' });
      setSubmissionFile(null);
      setUploadProgress(0);
      loadUserSubmissions();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit assignment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await deleteDoc(doc(db, 'assignments', assignmentId));
      toast({
        title: 'Success',
        description: 'Assignment deleted successfully',
      });
      onRefresh();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete assignment',
        variant: 'destructive',
      });
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getStatusBadge = (assignment: Assignment) => {
    const submission = submissions[assignment.id];
    
    if (submission) {
      if (submission.grade !== undefined) {
        return <Badge className="bg-green-500">Graded: {submission.grade}/{assignment.maxPoints}</Badge>;
      }
      return <Badge className="bg-blue-500">Submitted</Badge>;
    }
    
    if (isOverdue(assignment.dueDate)) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    
    return <Badge variant="outline">Not Submitted</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Assignments</h2>
          <p className="text-muted-foreground">
            {isInstructor ? 'Manage course assignments and submissions' : 'View and submit your assignments'}
          </p>
        </div>
        {isInstructor && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="mr-2" size={16} />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title *</label>
                  <Input
                    placeholder="Enter assignment title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description *</label>
                  <Textarea
                    placeholder="Enter assignment description and instructions"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homework">Homework</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Points</label>
                    <Input
                      type="number"
                      value={formData.maxPoints}
                      onChange={(e) => setFormData({ ...formData, maxPoints: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Due Date *</label>
                  <Input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAssignment} disabled={creating}>
                    {creating ? 'Creating...' : 'Create Assignment'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Assignments List */}
      <div className="grid gap-4">
        {assignments.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
              <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
              <p className="text-muted-foreground">
                {isInstructor
                  ? 'Create your first assignment to assess student learning'
                  : 'Check back later for new assignments'}
              </p>
            </div>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{assignment.title}</h3>
                    <Badge variant="outline">{assignment.type}</Badge>
                    {!isInstructor && getStatusBadge(assignment)}
                  </div>
                  <p className="text-muted-foreground mb-3">{assignment.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>Due: {new Date(assignment.dueDate).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText size={14} />
                      <span>{assignment.maxPoints} points</span>
                    </div>
                    {isOverdue(assignment.dueDate) && !submissions[assignment.id] && (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertCircle size={14} />
                        <span>Overdue</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isInstructor && !submissions[assignment.id] && !isOverdue(assignment.dueDate) && (
                    <Button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowSubmitDialog(true);
                      }}
                      className="btn-primary"
                    >
                      <Send size={16} className="mr-1" />
                      Submit
                    </Button>
                  )}
                  {!isInstructor && submissions[assignment.id] && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowSubmitDialog(true);
                      }}
                    >
                      <Eye size={16} className="mr-1" />
                      View Submission
                    </Button>
                  )}
                  {isInstructor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Submit Assignment Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {submissions[selectedAssignment?.id || ''] ? 'View/Update Submission' : 'Submit Assignment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedAssignment && (
              <>
                <div className="p-4 bg-accent/50 rounded-lg">
                  <h4 className="font-semibold mb-1">{selectedAssignment.title}</h4>
                  <p className="text-sm text-muted-foreground">{selectedAssignment.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span>Due: {new Date(selectedAssignment.dueDate).toLocaleString()}</span>
                    <span>Max Points: {selectedAssignment.maxPoints}</span>
                  </div>
                </div>

                {submissions[selectedAssignment.id]?.grade !== undefined ? (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="text-green-600" size={20} />
                      Graded
                    </h4>
                    <p className="text-lg font-bold">
                      Score: {submissions[selectedAssignment.id].grade} / {selectedAssignment.maxPoints}
                    </p>
                    {submissions[selectedAssignment.id].feedback && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Feedback:</p>
                        <p className="text-sm">{submissions[selectedAssignment.id].feedback}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Text Response</label>
                      <Textarea
                        placeholder="Enter your response here..."
                        value={submissionData.content}
                        onChange={(e) => setSubmissionData({ ...submissionData, content: e.target.value })}
                        rows={6}
                        disabled={submissions[selectedAssignment.id]?.grade !== undefined}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Upload File (Optional)</label>
                      <Input
                        type="file"
                        onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                        disabled={submissions[selectedAssignment.id]?.grade !== undefined}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Link (Optional)</label>
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        value={submissionData.linkUrl}
                        onChange={(e) => setSubmissionData({ ...submissionData, linkUrl: e.target.value })}
                        disabled={submissions[selectedAssignment.id]?.grade !== undefined}
                      />
                    </div>
                    {submitting && (
                      <div>
                        <Progress value={uploadProgress} className="w-full" />
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          Submitting... {Math.round(uploadProgress)}%
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2 justify-end pt-4">
                      <Button variant="outline" onClick={() => setShowSubmitDialog(false)} disabled={submitting}>
                        Cancel
                      </Button>
                      {submissions[selectedAssignment.id]?.grade === undefined && (
                        <Button onClick={handleSubmitAssignment} disabled={submitting}>
                          {submitting ? 'Submitting...' : submissions[selectedAssignment.id] ? 'Update Submission' : 'Submit Assignment'}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

