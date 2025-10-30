import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Calendar, 
  Clock,
  GraduationCap,
  Building2,
  Filter,
  Eye
} from 'lucide-react';

type Course = {
  id: string;
  title: string;
  code: string;
  description: string;
  department: string;
  instructor: string;
  instructorId: string;
  credits: number;
  capacity: number;
  enrolled: number;
  schedule: string;
  semester: string;
  year: number;
  prerequisites: string[];
  status: 'active' | 'inactive' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
};

type Faculty = {
  id: string;
  name: string;
  email: string;
  department: string;
};

export default function CourseManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'completed' | 'cancelled'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    department: '',
    instructorId: '',
    credits: 3,
    capacity: 30,
    schedule: '',
    semester: 'Fall',
    year: new Date().getFullYear(),
    prerequisites: '',
    status: 'active' as Course['status']
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Load courses
      const coursesQuery = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
      const coursesSnapshot = await getDocs(coursesQuery);
      const coursesList = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
      setCourses(coursesList);

      // Load faculty
      const facultyQuery = query(collection(db, 'users'), where('role', '==', 'faculty'));
      const facultySnapshot = await getDocs(facultyQuery);
      const facultyList = facultySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Faculty[];
      setFaculty(facultyList);

      // Load departments
      const deptSnapshot = await getDocs(collection(db, 'departments'));
      const deptList = deptSnapshot.docs.map(doc => doc.data().name).filter(Boolean);
      setDepartments(deptList);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'Failed to load course data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = courses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter);
    }

    // Filter by department
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(course => course.department === departmentFilter);
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, statusFilter, departmentFilter]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      code: '',
      description: '',
      department: '',
      instructorId: '',
      credits: 3,
      capacity: 30,
      schedule: '',
      semester: 'Fall',
      year: new Date().getFullYear(),
      prerequisites: '',
      status: 'active'
    });
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.code.trim() || !formData.instructorId) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const selectedFaculty = faculty.find(f => f.id === formData.instructorId);
      const courseData = {
        ...formData,
        instructor: selectedFaculty?.name || '',
        enrolled: 0,
        prerequisites: formData.prerequisites ? formData.prerequisites.split(',').map(p => p.trim()) : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'courses'), courseData);
      await logAudit('course_create', courseData, user?.id);
      
      toast({ title: 'Success', description: 'Course created successfully' });
      setShowCreateDialog(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error creating course:', error);
      toast({ title: 'Error', description: 'Failed to create course', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCourse) return;

    if (!formData.title.trim() || !formData.code.trim() || !formData.instructorId) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setEditing(true);
    try {
      const selectedFaculty = faculty.find(f => f.id === formData.instructorId);
      const courseData = {
        ...formData,
        instructor: selectedFaculty?.name || '',
        prerequisites: formData.prerequisites ? formData.prerequisites.split(',').map(p => p.trim()) : [],
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'courses', selectedCourse.id), courseData);
      await logAudit('course_update', { courseId: selectedCourse.id, ...courseData }, user?.id);
      
      toast({ title: 'Success', description: 'Course updated successfully' });
      setShowEditDialog(false);
      setSelectedCourse(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error updating course:', error);
      toast({ title: 'Error', description: 'Failed to update course', variant: 'destructive' });
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    setDeleting(courseId);
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      await logAudit('course_delete', { courseId }, user?.id);
      
      toast({ title: 'Success', description: 'Course deleted successfully' });
      await loadData();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({ title: 'Error', description: 'Failed to delete course', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      code: course.code,
      description: course.description,
      department: course.department,
      instructorId: course.instructorId,
      credits: course.credits,
      capacity: course.capacity,
      schedule: course.schedule,
      semester: course.semester,
      year: course.year,
      prerequisites: course.prerequisites.join(', '),
      status: course.status
    });
    setShowEditDialog(true);
  };

  const getStatusColor = (status: Course['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEnrollmentColor = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Course Management</h1>
          <p className="text-muted-foreground">Create, manage, and oversee all courses in the system.</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus size={16} className="mr-2" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <CourseForm
              formData={formData}
              onInputChange={handleInputChange}
              onSubmit={handleCreate}
              onCancel={() => setShowCreateDialog(false)}
              loading={creating}
              faculty={faculty}
              departments={departments}
              isEdit={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="text-primary" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Courses</p>
              <p className="text-2xl font-bold">{courses.length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Users className="text-green-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Active Courses</p>
              <p className="text-2xl font-bold">{courses.filter(c => c.status === 'active').length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-blue-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Enrollments</p>
              <p className="text-2xl font-bold">{courses.reduce((sum, c) => sum + c.enrolled, 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Building2 className="text-orange-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Departments</p>
              <p className="text-2xl font-bold">{departments.length}</p>
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
              placeholder="Search courses, codes, or instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Course List */}
      <Card className="card-academic p-6">
        <h2 className="text-xl font-semibold mb-4">Courses ({filteredCourses.length})</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No courses found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <div key={course.id} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-lg">{course.title}</h3>
                      <Badge variant="outline">{course.code}</Badge>
                      <Badge className={`${getStatusColor(course.status)} border`}>
                        {course.status}
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={14} />
                        <span>{course.instructor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 size={14} />
                        <span>{course.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{course.semester} {course.year}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} />
                        <span className={getEnrollmentColor(course.enrolled, course.capacity)}>
                          {course.enrolled}/{course.capacity} students
                        </span>
                      </div>
                    </div>
                    {course.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCourse(course);
                        setShowViewDialog(true);
                      }}
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(course)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(course.id)}
                      disabled={deleting === course.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      {deleting === course.id ? (
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
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <CourseForm
            formData={formData}
            onInputChange={handleInputChange}
            onSubmit={handleEdit}
            onCancel={() => setShowEditDialog(false)}
            loading={editing}
            faculty={faculty}
            departments={departments}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm">{selectedCourse.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Code</Label>
                  <p className="text-sm">{selectedCourse.code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Instructor</Label>
                  <p className="text-sm">{selectedCourse.instructor}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Department</Label>
                  <p className="text-sm">{selectedCourse.department}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Credits</Label>
                  <p className="text-sm">{selectedCourse.credits}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Enrollment</Label>
                  <p className="text-sm">{selectedCourse.enrolled}/{selectedCourse.capacity}</p>
                </div>
              </div>
              {selectedCourse.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm">{selectedCourse.description}</p>
                </div>
              )}
              {selectedCourse.prerequisites.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Prerequisites</Label>
                  <p className="text-sm">{selectedCourse.prerequisites.join(', ')}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Course Form Component
function CourseForm({ 
  formData, 
  onInputChange, 
  onSubmit, 
  onCancel, 
  loading, 
  faculty, 
  departments, 
  isEdit 
}: {
  formData: any;
  onInputChange: (field: string, value: string | number) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  faculty: Faculty[];
  departments: string[];
  isEdit: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Course Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            placeholder="e.g., Introduction to Computer Science"
            className="input-academic"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Course Code *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => onInputChange('code', e.target.value)}
            placeholder="e.g., CS-101"
            className="input-academic"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="Course description and objectives..."
          rows={3}
          className="input-academic"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Select value={formData.department} onValueChange={(value) => onInputChange('department', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="instructor">Instructor *</Label>
          <Select value={formData.instructorId} onValueChange={(value) => onInputChange('instructorId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select instructor" />
            </SelectTrigger>
            <SelectContent>
              {faculty.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.name} ({f.department})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="credits">Credits</Label>
          <Input
            id="credits"
            type="number"
            min="1"
            max="6"
            value={formData.credits}
            onChange={(e) => onInputChange('credits', parseInt(e.target.value))}
            className="input-academic"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            value={formData.capacity}
            onChange={(e) => onInputChange('capacity', parseInt(e.target.value))}
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="semester">Semester</Label>
          <Select value={formData.semester} onValueChange={(value) => onInputChange('semester', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Fall">Fall</SelectItem>
              <SelectItem value="Spring">Spring</SelectItem>
              <SelectItem value="Summer">Summer</SelectItem>
              <SelectItem value="Winter">Winter</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            min="2020"
            max="2030"
            value={formData.year}
            onChange={(e) => onInputChange('year', parseInt(e.target.value))}
            className="input-academic"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="schedule">Schedule</Label>
        <Input
          id="schedule"
          value={formData.schedule}
          onChange={(e) => onInputChange('schedule', e.target.value)}
          placeholder="e.g., MWF 10:00-10:50 AM"
          className="input-academic"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prerequisites">Prerequisites</Label>
        <Input
          id="prerequisites"
          value={formData.prerequisites}
          onChange={(e) => onInputChange('prerequisites', e.target.value)}
          placeholder="e.g., CS-100, MATH-101 (comma-separated)"
          className="input-academic"
        />
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
            isEdit ? 'Update Course' : 'Create Course'
          )}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
