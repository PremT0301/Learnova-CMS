import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { facultyCourseService } from '@/services/facultyService';
import { Users, Search, Mail, Phone, Award, TrendingUp } from 'lucide-react';

export default function MyStudents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadStudents();
      loadCourses();
    }
  }, [user]);

  const loadCourses = async () => {
    if (!user?.id) return;
    
    try {
      const coursesData = await facultyCourseService.getFacultyCourses(user.id);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadStudents = async () => {
    if (!user?.id || courses.length === 0) return;
    
    try {
      const allStudents = [];
      for (const course of courses) {
        const courseStudents = await facultyCourseService.getCourseStudents(course.id);
        allStudents.push(...courseStudents.map(student => ({
          ...student,
          courseId: course.id,
          courseCode: course.code
        })));
      }
      setStudents(allStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: 'Error',
        description: 'Failed to load students',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fallbackStudents = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@student.edu',
      course: 'CS-301',
      grade: 'A-',
      attendance: 95,
      assignments: 8,
      lastActive: '2 hours ago'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@student.edu',
      course: 'CS-301',
      grade: 'B+',
      attendance: 88,
      assignments: 7,
      lastActive: '1 day ago'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike.johnson@student.edu',
      course: 'CS-301',
      grade: 'A',
      attendance: 100,
      assignments: 8,
      lastActive: '3 hours ago'
    },
    {
      id: '4',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@student.edu',
      course: 'CS-401',
      grade: 'B',
      attendance: 92,
      assignments: 6,
      lastActive: '5 hours ago'
    },
    {
      id: '5',
      name: 'David Brown',
      email: 'david.brown@student.edu',
      course: 'CS-401',
      grade: 'A-',
      attendance: 96,
      assignments: 7,
      lastActive: '1 hour ago'
    }
  ];

  const courseStats = [
    { course: 'CS-301', students: 45, avgGrade: 'B+', completion: 89 },
    { course: 'CS-401', students: 38, avgGrade: 'B', completion: 85 },
    { course: 'CS-450', students: 44, avgGrade: 'A-', completion: 92 }
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">My Students</h1>
        <p className="text-muted-foreground">Manage and track your students' progress across all courses.</p>
      </div>

      {/* Course Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        {courseStats.map((stat, index) => (
          <Card key={index} className="card-academic p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.course}</p>
                <p className="text-2xl font-bold">{stat.students} students</p>
                <p className="text-xs text-muted-foreground">Avg: {stat.avgGrade} • {stat.completion}% completion</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card className="card-academic p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search students by name or email..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">Filter by Course</Button>
          <Button variant="outline">Export List</Button>
        </div>
      </Card>

      {/* Students List */}
      <Card className="card-academic p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-3">Student</th>
                <th className="py-3">Course</th>
                <th className="py-3">Grade</th>
                <th className="py-3">Attendance</th>
                <th className="py-3">Assignments</th>
                <th className="py-3">Last Active</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-border/60">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                      {student.course}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <Award size={14} />
                      <span className="font-medium">{student.grade}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <TrendingUp size={14} />
                      <span>{student.attendance}%</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-muted-foreground">{student.assignments}/8</span>
                  </td>
                  <td className="py-4">
                    <span className="text-muted-foreground">{student.lastActive}</span>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Mail size={14} />
                      </Button>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="card-academic p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button variant="outline" className="justify-start">
            <Mail className="mr-2" size={18} />
            Send Announcement
          </Button>
          <Button variant="outline" className="justify-start">
            <Award className="mr-2" size={18} />
            Grade Assignments
          </Button>
          <Button variant="outline" className="justify-start">
            <TrendingUp className="mr-2" size={18} />
            View Analytics
          </Button>
          <Button variant="outline" className="justify-start">
            <Users className="mr-2" size={18} />
            Export Grades
          </Button>
        </div>
      </Card>
    </div>
  );
}
