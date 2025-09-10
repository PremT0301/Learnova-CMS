import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Users, Calendar, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Course } from '@/types';

export default function Courses() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const demoCourses: Course[] = [
    {
      id: '1',
      title: 'Data Structures & Algorithms',
      code: 'CS-301',
      instructor: 'Prof. Michael Chen',
      description: 'Learn fundamental data structures and algorithms essential for computer science.',
      department: 'Computer Science',
      credits: 3,
      capacity: 50,
      enrolled: 45,
      startDate: '2024-01-15',
      endDate: '2024-05-15',
      status: 'active' as const,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop'
    },
    {
      id: '2',
      title: 'Database Management Systems',
      code: 'CS-401',
      instructor: 'Dr. Sarah Smith',
      description: 'Comprehensive study of database design, implementation, and management.',
      department: 'Computer Science',
      credits: 4,
      capacity: 40,
      enrolled: 38,
      startDate: '2024-01-15',
      endDate: '2024-05-15',
      status: 'active' as const,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=200&fit=crop'
    },
    {
      id: '3',
      title: 'Web Development Fundamentals',
      code: 'CS-350',
      instructor: 'Prof. Emily Johnson',
      description: 'Modern web development using HTML, CSS, JavaScript, and popular frameworks.',
      department: 'Computer Science',
      credits: 3,
      capacity: 35,
      enrolled: 32,
      startDate: '2024-01-15',
      endDate: '2024-05-15',
      status: 'active' as const,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=400&h=200&fit=crop'
    },
    {
      id: '4',
      title: 'Machine Learning Introduction',
      code: 'CS-450',
      instructor: 'Dr. Robert Wilson',
      description: 'Introduction to machine learning concepts, algorithms, and applications.',
      department: 'Computer Science',
      credits: 4,
      capacity: 30,
      enrolled: 28,
      startDate: '2024-01-15',
      endDate: '2024-05-15',
      status: 'active' as const,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop'
    }
  ];

  const [courses, setCourses] = useState<Course[]>(demoCourses);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const snapshot = await getDocs(collection(db, 'courses'));
        const loaded: Course[] = snapshot.docs.map((doc) => {
          const data = doc.data() as Partial<Course> & { title?: string; code?: string };
          return {
            id: doc.id,
            title: data.title ?? 'Untitled Course',
            code: data.code ?? 'N/A',
            description: data.description ?? '',
            instructor: data.instructor ?? 'TBD',
            instructorId: (data as any).instructorId ?? '',
            department: data.department ?? 'General',
            credits: data.credits ?? 0,
            capacity: data.capacity ?? 0,
            enrolled: data.enrolled ?? 0,
            startDate: (data as any).startDate ?? '',
            endDate: (data as any).endDate ?? '',
            status: (data.status ?? 'active') as Course['status'],
            image: data.image,
          };
        });
        if (loaded.length > 0) {
          setCourses(loaded);
        }
      } catch {
        // keep demo courses on error
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateCourse = user?.role === 'admin' || user?.role === 'faculty';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Courses</h1>
          <p className="text-muted-foreground">Explore and manage course offerings</p>
        </div>
        {canCreateCourse && (
          <Button className="btn-primary">
            <Plus size={20} className="mr-2" />
            Create Course
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="card-academic p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses, instructors, or course codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">All Departments</Button>
            <Button variant="outline">Active Courses</Button>
          </div>
        </div>
      </Card>

      {isLoading && (
        <Card className="card-academic p-12 text-center">
          <p className="text-muted-foreground text-lg">Loading courses...</p>
        </Card>
      )}

      {/* Courses Grid */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="card-academic card-hover overflow-hidden">
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={course.image} 
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-medium">
                {course.code}
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">{course.title}</h3>
                  <p className="text-muted-foreground text-sm">{course.instructor}</p>
                </div>
                <div className="flex items-center gap-1 text-warning">
                  <Star size={16} fill="currentColor" />
                  <span className="text-sm font-medium">{(course as any).rating ?? '4.8'}</span>
                </div>
              </div>

              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                {course.description}
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={16} />
                    <span>{course.enrolled}/{course.capacity} enrolled</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={16} />
                    <span>{course.credits} credits</span>
                  </div>
                </div>

                <div className="progress-academic">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(course.capacity ? (course.enrolled / course.capacity) * 100 : 0)}%` }} 
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {user?.role === 'student' ? (
                    <Button className="flex-1 btn-primary">
                      Enroll Now
                    </Button>
                  ) : (
                    <Button className="flex-1" variant="outline">
                      View Details
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Star size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!isLoading && filteredCourses.length === 0 && (
        <Card className="card-academic p-12 text-center">
          <p className="text-muted-foreground text-lg">No courses found matching your search.</p>
          <p className="text-muted-foreground text-sm mt-2">Try adjusting your search terms or browse all courses.</p>
        </Card>
      )}
    </div>
  );
}