import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { assignmentService, facultyCourseService } from '@/services/facultyService';
import { CalendarIcon, Plus, X, Upload, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface AssignmentFormProps {
  assignment?: any;
  onClose: () => void;
  onSave: () => void;
}

export default function AssignmentForm({ assignment, onClose, onSave }: AssignmentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [newAttachment, setNewAttachment] = useState('');

  const [formData, setFormData] = useState({
    title: assignment?.title || '',
    description: assignment?.description || '',
    courseId: assignment?.courseId || '',
    dueDate: assignment?.dueDate || '',
    points: assignment?.points || 100,
    type: assignment?.type || 'Programming',
    status: assignment?.status || 'draft',
    allowLateSubmission: assignment?.allowLateSubmission || false,
    latePenalty: assignment?.latePenalty || 10,
    maxAttempts: assignment?.maxAttempts || 1,
    rubric: assignment?.rubric || '',
    instructions: assignment?.instructions || '',
    attachments: assignment?.attachments || []
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    if (!user?.id) return;
    
    try {
      const coursesData = await facultyCourseService.getFacultyCourses(user.id);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAttachment = () => {
    if (newAttachment.trim()) {
      setAttachments(prev => [...prev, newAttachment.trim()]);
      setNewAttachment('');
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.courseId || !formData.dueDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const assignmentData = {
        ...formData,
        facultyId: user.id,
        attachments: attachments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (assignment?.id) {
        // Update existing assignment
        await assignmentService.updateAssignment(assignment.id, assignmentData);
        toast({
          title: 'Success',
          description: 'Assignment updated successfully'
        });
      } else {
        // Create new assignment
        await assignmentService.createAssignment(assignmentData);
        toast({
          title: 'Success',
          description: 'Assignment created successfully'
        });
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save assignment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {assignment?.id ? 'Edit Assignment' : 'Create New Assignment'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Assignment Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter assignment title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseId">Course *</Label>
                  <Select value={formData.courseId} onValueChange={(value) => handleInputChange('courseId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code}: {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Assignment Type</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Programming">Programming</SelectItem>
                      <SelectItem value="Project">Project</SelectItem>
                      <SelectItem value="Exam">Exam</SelectItem>
                      <SelectItem value="Portfolio">Portfolio</SelectItem>
                      <SelectItem value="Quiz">Quiz</SelectItem>
                      <SelectItem value="Essay">Essay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    value={formData.points}
                    onChange={(e) => handleInputChange('points', parseInt(e.target.value))}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dueDate ? format(new Date(formData.dueDate), 'PPP') : 'Select due date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.dueDate ? new Date(formData.dueDate) : undefined}
                        onSelect={(date) => handleInputChange('dueDate', date?.toISOString())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAttempts">Max Attempts</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    min="1"
                    value={formData.maxAttempts}
                    onChange={(e) => handleInputChange('maxAttempts', parseInt(e.target.value))}
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            {/* Description and Instructions */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the assignment requirements..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  placeholder="Provide detailed instructions for students..."
                  rows={4}
                />
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-4">
              <Label>Attachments</Label>
              <div className="flex gap-2">
                <Input
                  value={newAttachment}
                  onChange={(e) => setNewAttachment(e.target.value)}
                  placeholder="Add attachment URL"
                />
                <Button type="button" onClick={addAttachment} variant="outline">
                  <Plus size={16} />
                </Button>
              </div>
              
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <FileText size={16} />
                      <span className="flex-1 text-sm truncate">{attachment}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Late Submission Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowLateSubmission"
                  checked={formData.allowLateSubmission}
                  onCheckedChange={(checked) => handleInputChange('allowLateSubmission', checked)}
                />
                <Label htmlFor="allowLateSubmission">Allow late submissions</Label>
              </div>

              {formData.allowLateSubmission && (
                <div className="space-y-2">
                  <Label htmlFor="latePenalty">Late Penalty (%)</Label>
                  <Input
                    id="latePenalty"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.latePenalty}
                    onChange={(e) => handleInputChange('latePenalty', parseInt(e.target.value))}
                    placeholder="10"
                  />
                </div>
              )}
            </div>

            {/* Rubric */}
            <div className="space-y-2">
              <Label htmlFor="rubric">Grading Rubric</Label>
              <Textarea
                id="rubric"
                value={formData.rubric}
                onChange={(e) => handleInputChange('rubric', e.target.value)}
                placeholder="Define grading criteria and point distribution..."
                rows={6}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  assignment?.id ? 'Update Assignment' : 'Create Assignment'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
