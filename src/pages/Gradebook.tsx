import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { facultyCourseService, assignmentService } from '@/services/facultyService';
import { BookOpen, Users, Award, TrendingUp, Download, Upload } from 'lucide-react';

export default function Gradebook() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courses, setCourses] = useState([]);
  const [gradebookData, setGradebookData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadCourses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      loadGradebookData();
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    if (!user?.id) return;
    
    try {
      const coursesData = await facultyCourseService.getFacultyCourses(user.id);
      setCourses(coursesData);
      if (coursesData.length > 0) {
        setSelectedCourse(coursesData[0].id);
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

  const loadGradebookData = async () => {
    if (!selectedCourse) return;
    
    try {
      // Load assignments for the selected course
      const assignments = await assignmentService.getCourseAssignments(selectedCourse);
      
      // Load students for the selected course
      const students = await facultyCourseService.getCourseStudents(selectedCourse);
      
      // For now, use mock data - in a real implementation, you'd fetch actual grades
      const mockGradebookData = students.map(student => ({
        student: student.name,
        email: student.email,
        assignments: assignments.map(assignment => ({
          name: assignment.title,
          grade: Math.floor(Math.random() * 20) + 80, // Mock grade
          maxPoints: assignment.points
        })),
        total: assignments.reduce((sum, assignment) => sum + assignment.points, 0),
        maxTotal: assignments.reduce((sum, assignment) => sum + assignment.points, 0),
        percentage: Math.floor(Math.random() * 20) + 80,
        letterGrade: 'A-' // Mock letter grade
      }));
      
      setGradebookData(mockGradebookData);
    } catch (error) {
      console.error('Error loading gradebook data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load gradebook data',
        variant: 'destructive'
      });
    }
  };

  const fallbackCourses = [
    {
      id: '1',
      title: 'Data Structures & Algorithms',
      code: 'CS-301',
      students: 45,
      assignments: 8
    },
    {
      id: '2',
      title: 'Database Management Systems',
      code: 'CS-401',
      students: 38,
      assignments: 6
    }
  ];


  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Gradebook</h1>
          <p className="text-muted-foreground">Manage grades and track student performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download size={18} className="mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload size={18} className="mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Course Selection */}
      <Card className="card-academic p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Select Course</label>
            <Select defaultValue="cs-301">
              <SelectTrigger>
                <SelectValue placeholder="Choose a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title} ({course.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Assignment</label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="All assignments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignments</SelectItem>
                <SelectItem value="binary-tree">Binary Tree Implementation</SelectItem>
                <SelectItem value="sorting">Sorting Algorithms</SelectItem>
                <SelectItem value="linked-lists">Linked Lists</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Gradebook Table */}
      <Card className="card-academic p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-3 pr-4">Student</th>
                <th className="py-3 px-2 text-center">Binary Tree</th>
                <th className="py-3 px-2 text-center">Sorting</th>
                <th className="py-3 px-2 text-center">Linked Lists</th>
                <th className="py-3 px-2 text-center">Stacks/Queues</th>
                <th className="py-3 px-2 text-center">Total</th>
                <th className="py-3 px-2 text-center">Grade</th>
                <th className="py-3 pl-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gradebookData.map((student, index) => (
                <tr key={index} className="border-b border-border/60">
                  <td className="py-4 pr-4">
                    <div>
                      <p className="font-medium">{student.student}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                  </td>
                  {student.assignments.map((assignment, assignmentIndex) => (
                    <td key={assignmentIndex} className="py-4 px-2 text-center">
                      <div className="flex flex-col">
                        <span className="font-medium">{assignment.grade}</span>
                        <span className="text-xs text-muted-foreground">/{assignment.maxPoints}</span>
                      </div>
                    </td>
                  ))}
                  <td className="py-4 px-2 text-center">
                    <div className="flex flex-col">
                      <span className="font-medium">{student.total}</span>
                      <span className="text-xs text-muted-foreground">/{student.maxTotal}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-primary">{student.letterGrade}</span>
                      <span className="text-xs text-muted-foreground">{student.percentage.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="py-4 pl-4">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Grade Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">45</p>
            </div>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <Award className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Grade</p>
              <p className="text-2xl font-bold">B+</p>
            </div>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <TrendingUp className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold">89%</p>
            </div>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <BookOpen className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assignments</p>
              <p className="text-2xl font-bold">8</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
