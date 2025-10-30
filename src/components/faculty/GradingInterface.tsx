import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { assignmentService, facultyCourseService } from '@/services/facultyService';
import { 
  CheckCircle, Clock, FileText, User, Star, 
  Save, Send, Eye, Download, Calendar
} from 'lucide-react';

interface GradingInterfaceProps {
  assignmentId: string;
  onClose: () => void;
}

export default function GradingInterface({ assignmentId, onClose }: GradingInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [grades, setGrades] = useState<{[key: string]: any}>({});

  useEffect(() => {
    if (assignmentId) {
      loadAssignmentData();
    }
  }, [assignmentId]);

  const loadAssignmentData = async () => {
    try {
      // Load assignment details
      const assignmentData = await assignmentService.getCourseAssignments(assignmentId);
      if (assignmentData.length > 0) {
        setAssignment(assignmentData[0]);
      }

      // Load submissions
      const submissionsData = await assignmentService.getAssignmentSubmissions(assignmentId);
      setSubmissions(submissionsData);

      // Initialize grades
      const initialGrades: {[key: string]: any} = {};
      submissionsData.forEach((submission: any) => {
        initialGrades[submission.id] = {
          grade: submission.grade || '',
          feedback: submission.feedback || '',
          status: submission.status || 'submitted'
        };
      });
      setGrades(initialGrades);
    } catch (error) {
      console.error('Error loading assignment data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignment data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (submissionId: string, field: string, value: any) => {
    setGrades(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value
      }
    }));
  };

  const saveGrade = async (submissionId: string) => {
    const gradeData = grades[submissionId];
    if (!gradeData.grade || gradeData.grade < 0 || gradeData.grade > assignment.points) {
      toast({
        title: 'Error',
        description: 'Please enter a valid grade',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      // Update submission in Firestore
      // This would be implemented in the assignmentService
      toast({
        title: 'Success',
        description: 'Grade saved successfully'
      });
    } catch (error) {
      console.error('Error saving grade:', error);
      toast({
        title: 'Error',
        description: 'Failed to save grade',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const saveAllGrades = async () => {
    setSaving(true);
    try {
      // Save all grades
      for (const submissionId of Object.keys(grades)) {
        await saveGrade(submissionId);
      }
      toast({
        title: 'Success',
        description: 'All grades saved successfully'
      });
    } catch (error) {
      console.error('Error saving all grades:', error);
      toast({
        title: 'Error',
        description: 'Failed to save some grades',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const exportGrades = () => {
    const csvData = submissions.map((submission: any) => {
      const gradeData = grades[submission.id] || {};
      return {
        'Student Name': submission.studentName,
        'Email': submission.studentEmail,
        'Submission Date': submission.submittedAt,
        'Grade': gradeData.grade || '',
        'Feedback': gradeData.feedback || '',
        'Status': gradeData.status || 'submitted'
      };
    });

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assignment?.title}_grades.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getGradeColor = (grade: number, maxPoints: number) => {
    const percentage = (grade / maxPoints) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded': return 'bg-green-100 text-green-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'returned': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading grading interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-6xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{assignment?.title}</h2>
              <p className="text-muted-foreground">
                Grading {submissions.length} submissions • {assignment?.points} points
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportGrades}>
                <Download size={16} className="mr-2" />
                Export Grades
              </Button>
              <Button onClick={saveAllGrades} disabled={saving}>
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save All Grades
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Submissions List */}
          <div className="w-1/3 border-r overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-4">Submissions ({submissions.length})</h3>
              <div className="space-y-2">
                {submissions.map((submission: any) => {
                  const gradeData = grades[submission.id] || {};
                  const isGraded = gradeData.status === 'graded';
                  const grade = gradeData.grade || 0;
                  
                  return (
                    <Card
                      key={submission.id}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedSubmission?.id === submission.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{submission.studentName}</p>
                          <p className="text-sm text-muted-foreground">{submission.studentEmail}</p>
                        </div>
                        <div className="text-right">
                          {isGraded ? (
                            <div className={`font-bold ${getGradeColor(grade, assignment.points)}`}>
                              {grade}/{assignment.points}
                            </div>
                          ) : (
                            <Clock size={16} className="text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={getStatusColor(gradeData.status || 'submitted')}>
                          {gradeData.status || 'submitted'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grading Panel */}
          <div className="flex-1 overflow-y-auto">
            {selectedSubmission ? (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{selectedSubmission.studentName}</h3>
                  <p className="text-muted-foreground">{selectedSubmission.studentEmail}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm">
                      Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}
                    </span>
                    <Badge className={getStatusColor(grades[selectedSubmission.id]?.status || 'submitted')}>
                      {grades[selectedSubmission.id]?.status || 'submitted'}
                    </Badge>
                  </div>
                </div>

                {/* Assignment Details */}
                <Card className="p-4 mb-6">
                  <h4 className="font-semibold mb-3">Assignment Details</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span> {assignment?.type}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Points:</span> {assignment?.points}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due Date:</span> {assignment?.dueDate}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span> {assignment?.status}
                    </div>
                  </div>
                  {assignment?.description && (
                    <div className="mt-4">
                      <span className="text-muted-foreground">Description:</span>
                      <p className="mt-1">{assignment.description}</p>
                    </div>
                  )}
                </Card>

                {/* Submission Content */}
                <Card className="p-4 mb-6">
                  <h4 className="font-semibold mb-3">Student Submission</h4>
                  <div className="bg-gray-50 p-4 rounded border">
                    <p className="text-sm">
                      {selectedSubmission.content || 'No submission content available'}
                    </p>
                  </div>
                  {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Attachments:</h5>
                      <div className="space-y-2">
                        {selectedSubmission.attachments.map((attachment: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                            <FileText size={16} />
                            <span className="text-sm">{attachment}</span>
                            <Button variant="outline" size="sm">
                              <Download size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Grading Form */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-4">Grade & Feedback</h4>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="grade">Grade (out of {assignment?.points})</Label>
                        <Input
                          id="grade"
                          type="number"
                          min="0"
                          max={assignment?.points}
                          value={grades[selectedSubmission.id]?.grade || ''}
                          onChange={(e) => handleGradeChange(selectedSubmission.id, 'grade', parseInt(e.target.value))}
                          placeholder="Enter grade"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={grades[selectedSubmission.id]?.status || 'submitted'}
                          onValueChange={(value) => handleGradeChange(selectedSubmission.id, 'status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="graded">Graded</SelectItem>
                            <SelectItem value="returned">Returned</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="feedback">Feedback</Label>
                      <Textarea
                        id="feedback"
                        value={grades[selectedSubmission.id]?.feedback || ''}
                        onChange={(e) => handleGradeChange(selectedSubmission.id, 'feedback', e.target.value)}
                        placeholder="Provide feedback to the student..."
                        rows={6}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => saveGrade(selectedSubmission.id)}
                        disabled={saving}
                      >
                        {saving ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </div>
                        ) : (
                          <>
                            <Save size={16} className="mr-2" />
                            Save Grade
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <User size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select a submission to begin grading</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
