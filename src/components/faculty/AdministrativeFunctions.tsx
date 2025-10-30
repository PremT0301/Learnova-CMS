import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { facultyCourseService } from '@/services/facultyService';
import { 
  Plus, Users, BookOpen, Settings, Calendar, 
  Search, Filter, Edit, Trash2, UserPlus, 
  UserMinus, Mail, Download, Upload
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  credits: number;
  capacity: number;
  enrolled: number;
  instructorId: string;
  department: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'archived';
}

interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  courseId: string;
  courseCode: string;
  enrollmentDate: Date;
  status: 'active' | 'dropped' | 'completed';
  grade: string;
  attendance: number;
}

export default function AdministrativeFunctions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Course form state
  const [courseForm, setCourseForm] = useState({
    title: '',
    code: '',
    description: '',
    credits: 3,
    capacity: 30,
    department: '',
    startDate: '',
    endDate: '',
    status: 'active'
  });

  // Student form state
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    studentId: '',
    courseId: '',
    status: 'active'
  });

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load faculty courses
      const coursesData = await facultyCourseService.getFacultyCourses(user.id);
      setCourses(coursesData);

      // Load students from all courses
      const allStudents: Student[] = [];
      for (const course of coursesData) {
        const courseStudents = await facultyCourseService.getCourseStudents(course.id);
        allStudents.push(...courseStudents.map(student => ({
          ...student,
          courseId: course.id,
          courseCode: course.code,
          enrollmentDate: new Date(),
          status: 'active' as const,
          grade: 'N/A',
          attendance: Math.floor(Math.random() * 20) + 80
        })));
      }
      setStudents(allStudents);
    } catch (error) {
      console.error('Error loading administrative data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load administrative data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.courseCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = 
      !selectedCourse || student.courseId === selectedCourse;
    
    return matchesSearch && matchesCourse;
  });

  const handleCreateCourse = async () => {
    if (!courseForm.title || !courseForm.code) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const newCourse: Course = {
        id: Date.now().toString(),
        ...courseForm,
        enrolled: 0,
        instructorId: user.id,
        credits: parseInt(courseForm.credits.toString()),
        capacity: parseInt(courseForm.capacity.toString())
      };

      setCourses(prev => [newCourse, ...prev]);
      setShowCourseForm(false);
      setCourseForm({
        title: '',
        code: '',
        description: '',
        credits: 3,
        capacity: 30,
        department: '',
        startDate: '',
        endDate: '',
        status: 'active'
      });

      toast({
        title: 'Success',
        description: 'Course created successfully'
      });
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to create course',
        variant: 'destructive'
      });
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      code: course.code,
      description: course.description,
      credits: course.credits,
      capacity: course.capacity,
      department: course.department,
      startDate: course.startDate,
      endDate: course.endDate,
      status: course.status
    });
    setShowCourseForm(true);
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;

    try {
      setCourses(prev => prev.map(course => 
        course.id === editingCourse.id 
          ? { ...course, ...courseForm, credits: parseInt(courseForm.credits.toString()), capacity: parseInt(courseForm.capacity.toString()) }
          : course
      ));

      setShowCourseForm(false);
      setEditingCourse(null);
      setCourseForm({
        title: '',
        code: '',
        description: '',
        credits: 3,
        capacity: 30,
        department: '',
        startDate: '',
        endDate: '',
        status: 'active'
      });

      toast({
        title: 'Success',
        description: 'Course updated successfully'
      });
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to update course',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      setCourses(prev => prev.filter(course => course.id !== courseId));
      setStudents(prev => prev.filter(student => student.courseId !== courseId));
      toast({
        title: 'Success',
        description: 'Course deleted successfully'
      });
    }
  };

  const handleAddStudent = async () => {
    if (!studentForm.name || !studentForm.email || !studentForm.studentId || !studentForm.courseId) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const selectedCourseData = courses.find(c => c.id === studentForm.courseId);
      const newStudent: Student = {
        id: Date.now().toString(),
        ...studentForm,
        courseCode: selectedCourseData?.code || '',
        enrollmentDate: new Date(),
        status: studentForm.status as any,
        grade: 'N/A',
        attendance: 100
      };

      setStudents(prev => [newStudent, ...prev]);
      
      // Update course enrollment count
      setCourses(prev => prev.map(course => 
        course.id === studentForm.courseId 
          ? { ...course, enrolled: course.enrolled + 1 }
          : course
      ));

      setShowStudentForm(false);
      setStudentForm({
        name: '',
        email: '',
        studentId: '',
        courseId: '',
        status: 'active'
      });

      toast({
        title: 'Success',
        description: 'Student added successfully'
      });
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: 'Error',
        description: 'Failed to add student',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveStudent = (studentId: string, courseId: string) => {
    if (confirm('Are you sure you want to remove this student from the course?')) {
      setStudents(prev => prev.filter(student => student.id !== studentId));
      
      // Update course enrollment count
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, enrolled: Math.max(0, course.enrolled - 1) }
          : course
      ));

      toast({
        title: 'Success',
        description: 'Student removed successfully'
      });
    }
  };

  const handleBulkEmail = () => {
    const selectedStudents = filteredStudents.filter(student => student.status === 'active');
    if (selectedStudents.length === 0) {
      toast({
        title: 'Error',
        description: 'No active students found to email',
        variant: 'destructive'
      });
      return;
    }

    const emailList = selectedStudents.map(student => student.email).join(';');
    window.open(`mailto:${emailList}?subject=Course Update&body=Hello students,`, '_blank');
  };

  const exportStudentList = () => {
    const csvData = filteredStudents.map(student => ({
      'Student ID': student.studentId,
      'Name': student.name,
      'Email': student.email,
      'Course': student.courseCode,
      'Enrollment Date': student.enrollmentDate.toLocaleDateString(),
      'Status': student.status,
      'Grade': student.grade,
      'Attendance': student.attendance + '%'
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${selectedCourse || 'all'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-yellow-100 text-yellow-800';
      case 'dropped': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading administrative data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Administrative Functions</h1>
          <p className="text-muted-foreground">Manage courses and students</p>
        </div>
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="courses">Course Management</TabsTrigger>
          <TabsTrigger value="students">Student Management</TabsTrigger>
        </TabsList>

        {/* Course Management Tab */}
        <TabsContent value="courses">
          <div className="space-y-6">
            {/* Course Actions */}
            <Card className="card-academic p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Course Management</h2>
                <Button onClick={() => setShowCourseForm(true)} className="btn-primary">
                  <Plus size={20} className="mr-2" />
                  Create Course
                </Button>
              </div>
            </Card>

            {/* Courses List */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <Card key={course.id} className="card-academic p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">{course.code}</h3>
                      <p className="text-sm text-muted-foreground">{course.title}</p>
                    </div>
                    <Badge className={getStatusColor(course.status)}>
                      {course.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Enrolled:</span>
                      <span>{course.enrolled}/{course.capacity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Credits:</span>
                      <span>{course.credits}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Department:</span>
                      <span>{course.department}</span>
                    </div>
                  </div>

                  {course.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditCourse(course)}
                    >
                      <Edit size={16} className="mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteCourse(course.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Student Management Tab */}
        <TabsContent value="students">
          <div className="space-y-6">
            {/* Student Actions */}
            <Card className="card-academic p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h2 className="text-lg font-semibold">Student Management</h2>
                <div className="flex gap-2">
                  <Button onClick={() => setShowStudentForm(true)} variant="outline">
                    <UserPlus size={20} className="mr-2" />
                    Add Student
                  </Button>
                  <Button onClick={handleBulkEmail} variant="outline">
                    <Mail size={20} className="mr-2" />
                    Email All
                  </Button>
                  <Button onClick={exportStudentList} variant="outline">
                    <Download size={20} className="mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </Card>

            {/* Search and Filter */}
            <Card className="card-academic p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Search size={16} />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Students Table */}
            <Card className="card-academic">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Student</th>
                      <th className="p-4 font-medium">Course</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Grade</th>
                      <th className="p-4 font-medium">Attendance</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                            <p className="text-xs text-muted-foreground">ID: {student.studentId}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{student.courseCode}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(student.status)}>
                            {student.status}
                          </Badge>
                        </td>
                        <td className="p-4">{student.grade}</td>
                        <td className="p-4">{student.attendance}%</td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRemoveStudent(student.id, student.courseId)}
                            >
                              <UserMinus size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Course Form Modal */}
      {showCourseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {editingCourse ? 'Edit Course' : 'Create New Course'}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => {
                  setShowCourseForm(false);
                  setEditingCourse(null);
                }}>
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseTitle">Course Title *</Label>
                    <Input
                      id="courseTitle"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Data Structures and Algorithms"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseCode">Course Code *</Label>
                    <Input
                      id="courseCode"
                      value={courseForm.code}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="e.g., CS-301"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseDescription">Description</Label>
                  <Textarea
                    id="courseDescription"
                    value={courseForm.description}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Course description..."
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Input
                      id="credits"
                      type="number"
                      min="1"
                      max="6"
                      value={courseForm.credits}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, credits: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={courseForm.capacity}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={courseForm.department}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Computer Science"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={courseForm.startDate}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={courseForm.endDate}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={courseForm.status} onValueChange={(value) => setCourseForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setShowCourseForm(false);
                    setEditingCourse(null);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={editingCourse ? handleUpdateCourse : handleCreateCourse}>
                    {editingCourse ? 'Update Course' : 'Create Course'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Student Form Modal */}
      {showStudentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Add Student to Course</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowStudentForm(false)}>
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Student Name *</Label>
                  <Input
                    id="studentName"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentEmail">Email *</Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="student@university.edu"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID *</Label>
                  <Input
                    id="studentId"
                    value={studentForm.studentId}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, studentId: e.target.value }))}
                    placeholder="Student ID"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseSelect">Course *</Label>
                  <Select value={studentForm.courseId} onValueChange={(value) => setStudentForm(prev => ({ ...prev, courseId: value }))}>
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
                  <Label htmlFor="status">Status</Label>
                  <Select value={studentForm.status} onValueChange={(value) => setStudentForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="dropped">Dropped</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowStudentForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddStudent}>
                    Add Student
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
