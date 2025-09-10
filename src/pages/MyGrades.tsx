import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Award, TrendingUp, BookOpen, Calendar } from 'lucide-react';

export default function MyGrades() {
  const { user } = useAuth();

  const courseGrades = [
    {
      course: 'Data Structures & Algorithms',
      code: 'CS-301',
      instructor: 'Prof. Chen',
      assignments: [
        { name: 'Binary Tree Implementation', grade: 92, maxPoints: 100, date: '2024-01-15' },
        { name: 'Sorting Algorithms', grade: 88, maxPoints: 100, date: '2024-01-10' },
        { name: 'Linked Lists', grade: 95, maxPoints: 100, date: '2024-01-05' }
      ],
      currentGrade: 'A-',
      gpa: 3.7
    },
    {
      course: 'Database Management Systems',
      code: 'CS-401',
      instructor: 'Dr. Smith',
      assignments: [
        { name: 'Database Design Project', grade: 85, maxPoints: 100, date: '2024-01-12' },
        { name: 'SQL Queries', grade: 90, maxPoints: 100, date: '2024-01-08' },
        { name: 'Normalization', grade: 87, maxPoints: 100, date: '2024-01-03' }
      ],
      currentGrade: 'B+',
      gpa: 3.3
    },
    {
      course: 'Web Development',
      code: 'CS-350',
      instructor: 'Prof. Johnson',
      assignments: [
        { name: 'React Portfolio', grade: 96, maxPoints: 100, date: '2024-01-14' },
        { name: 'JavaScript Fundamentals', grade: 94, maxPoints: 100, date: '2024-01-09' },
        { name: 'HTML/CSS Project', grade: 98, maxPoints: 100, date: '2024-01-04' }
      ],
      currentGrade: 'A',
      gpa: 4.0
    }
  ];

  const overallStats = {
    totalGPA: 3.7,
    totalCredits: 9,
    completedAssignments: 9,
    averageGrade: 92
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">My Grades</h1>
        <p className="text-muted-foreground">Track your academic progress and performance.</p>
      </div>

      {/* Overall Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall GPA</p>
              <p className="text-2xl font-bold">{overallStats.totalGPA}</p>
            </div>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <BookOpen className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Credits</p>
              <p className="text-2xl font-bold">{overallStats.totalCredits}</p>
            </div>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <TrendingUp className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Grade</p>
              <p className="text-2xl font-bold">{overallStats.averageGrade}%</p>
            </div>
          </div>
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <Calendar className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assignments</p>
              <p className="text-2xl font-bold">{overallStats.completedAssignments}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Course Grades */}
      <div className="space-y-6">
        {courseGrades.map((course, index) => (
          <Card key={index} className="card-academic p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{course.course}</h2>
                <p className="text-muted-foreground">{course.code} • {course.instructor}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{course.currentGrade}</p>
                <p className="text-sm text-muted-foreground">GPA: {course.gpa}</p>
              </div>
            </div>

            <div className="space-y-3">
              {course.assignments.map((assignment, assignmentIndex) => (
                <div key={assignmentIndex} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <h3 className="font-medium">{assignment.name}</h3>
                    <p className="text-sm text-muted-foreground">Submitted: {assignment.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{assignment.grade}/{assignment.maxPoints}</p>
                    <p className="text-sm text-muted-foreground">
                      {((assignment.grade / assignment.maxPoints) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Grade Distribution */}
      <Card className="card-academic p-6">
        <h2 className="text-xl font-semibold mb-4">Grade Distribution</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-success/10 rounded-lg">
            <p className="text-2xl font-bold text-success">A</p>
            <p className="text-sm text-muted-foreground">4 assignments</p>
          </div>
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <p className="text-2xl font-bold text-primary">B</p>
            <p className="text-sm text-muted-foreground">3 assignments</p>
          </div>
          <div className="text-center p-4 bg-warning/10 rounded-lg">
            <p className="text-2xl font-bold text-warning">C</p>
            <p className="text-sm text-muted-foreground">2 assignments</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
