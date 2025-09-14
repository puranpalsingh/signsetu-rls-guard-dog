'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  GraduationCap, 
  LogOut, 
  BookOpen, 
  Users, 
  TrendingUp,
  User,
  School
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Classroom, ProgressRecord, Teacher } from '@/lib/types';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const [progressRes, classroomRes, teachersRes] = await Promise.all([
          supabase.from('progress').select('*, profile(full_name)'),
          supabase.from('classroom').select('*'),
          supabase.from('profile').select('*').eq('role', 'teacher')
        ]);

        if (progressRes.data) setProgress(progressRes.data as ProgressRecord[]);
        if (classroomRes.data) setClassrooms(classroomRes.data as Classroom[]);
        if (teachersRes.data) setTeachers(teachersRes.data as Teacher[]);
      };

      fetchData();
    }
  }, [user]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getStudentRecords = () => {
    return progress.filter(record => record.student_id === user.id);
  };

  const getTeacherClassrooms = () => {
    return classrooms.filter(classroom => classroom.teacher_id === user.id);
  };

  const getClassroomRecords = (classroomId: string) => {
    return progress.filter(record => record.classroom_id === classroomId);
  };

  const getTeacherStudents = (teacherId: string) => {
    const teacherClassrooms = classrooms.filter(classroom => classroom.teacher_id === teacherId);
    const classroomIds = teacherClassrooms.map(classroom => classroom.id);
    return progress.filter(record => classroomIds.includes(record.classroom_id));
  };

  const getRoleIcon = () => {
    switch (user.role) {
      case 'student': return <User className="w-5 h-5" />;
      case 'teacher': return <BookOpen className="w-5 h-5" />;
      case 'head_teacher': return <School className="w-5 h-5" />;
    }
  };

  const getRoleBadge = () => {
    switch (user.role) {
      case 'student': return <Badge variant="secondary">Student</Badge>;
      case 'teacher': return <Badge variant="default">Teacher</Badge>;
      case 'head_teacher': return <Badge variant="destructive">Head Teacher</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold">School Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getRoleIcon()}
                <span className="text-sm font-medium">{user.full_name}</span>
                {getRoleBadge()}
              </div>
              <ThemeToggle />
              {user.role === 'teacher' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/teacher')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Teacher Portal
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {user.full_name}!
          </h2>
          <p className="text-muted-foreground">
            {user.role === 'student' && 'Track your academic progress and achievements.'}
            {user.role === 'teacher' && 'Manage your classrooms and monitor student progress.'}
            {user.role === 'head_teacher' && 'Oversee school operations and monitor all activities.'}
          </p>
        </div>

        {/* Student View */}
        {user.role === 'student' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Your Progress</span>
                </CardTitle>
                <CardDescription>
                  Your current academic performance across all subjects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getStudentRecords().map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.subject}</TableCell>
                        <TableCell>
                          <span className="text-2xl font-bold">{record.score}</span>
                          <span className="text-muted-foreground ml-1">/ 100</span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              record.score >= 90 ? "default" : 
                              record.score >= 75 ? "secondary" : 
                              "destructive"
                            }
                          >
                            {record.score >= 90 ? "Excellent" : 
                             record.score >= 75 ? "Good" : 
                             "Needs Improvement"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Teacher View */}
        {user.role === 'teacher' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Your Classrooms</span>
                </CardTitle>
                <CardDescription>
                  Select a classroom to view student progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getTeacherClassrooms().map((classroom) => (
                    <Card 
                      key={classroom.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedClassroom === classroom.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedClassroom(classroom.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold">{classroom.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{classroom.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getClassroomRecords(classroom.id).length} students
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedClassroom && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Student Progress - {classrooms.find(c => c.id === selectedClassroom)?.name}
                  </CardTitle>
                  <CardDescription>
                    Performance data for students in this classroom
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getClassroomRecords(selectedClassroom).map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.profile.full_name}</TableCell>
                          <TableCell>{record.subject}</TableCell>
                          <TableCell>
                            <span className="text-lg font-semibold">{record.score}</span>
                            <span className="text-muted-foreground ml-1">/ 100</span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                record.score >= 90 ? "default" : 
                                record.score >= 75 ? "secondary" : 
                                "destructive"
                              }
                            >
                              {record.score >= 90 ? "Excellent" : 
                               record.score >= 75 ? "Good" : 
                               "Needs Improvement"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Head Teacher View */}
        {user.role === 'head_teacher' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Teaching Staff</span>
                  </CardTitle>
                  <CardDescription>
                    All teachers in the school
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teachers.map((teacher) => (
                      <div 
                        key={teacher.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          selectedTeacher === teacher.id ? 'ring-2 ring-primary bg-muted/50' : ''
                        }`}
                        onClick={() => setSelectedTeacher(selectedTeacher === teacher.id ? null : teacher.id)}
                      >
                        <div>
                          <h3 className="font-medium">{teacher.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{teacher.subject || 'Teacher'}</p>
                        </div>
                        <Badge variant="outline">
                          {classrooms.filter(c => c.teacher_id === teacher.id).length} classes
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>School Overview</span>
                  </CardTitle>
                  <CardDescription>
                    Key metrics and statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">Total Students</span>
                      <span className="text-2xl font-bold">
                        {new Set(progress.map(r => r.student_id)).size}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">Total Teachers</span>
                      <span className="text-2xl font-bold">{teachers.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">Average Score</span>
                      <span className="text-2xl font-bold">
                        {Math.round(
                          progress.reduce((acc, r) => acc + r.score, 0) / 
                          progress.length
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {selectedTeacher && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Students Taught by {teachers.find(t => t.id === selectedTeacher)?.full_name}</span>
                  </CardTitle>
                  <CardDescription>
                    All students taught by this teacher across their classrooms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Classroom</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getTeacherStudents(selectedTeacher).map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.profile.full_name}</TableCell>
                          <TableCell>{record.subject}</TableCell>
                          <TableCell>
                            {classrooms.find(c => c.id === record.classroom_id)?.name || record.classroom_id}
                          </TableCell>
                          <TableCell>
                            <span className="text-lg font-semibold">{record.score}</span>
                            <span className="text-muted-foreground ml-1">/ 100</span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                record.score >= 90 ? "default" : 
                                record.score >= 75 ? "secondary" : 
                                "destructive"
                              }
                            >
                              {record.score >= 90 ? "Excellent" : 
                               record.score >= 75 ? "Good" : 
                               "Needs Improvement"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <School className="w-5 h-5" />
                  <span>All Student Progress</span>
                </CardTitle>
                <CardDescription>
                  Complete overview of all student performance data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Classroom</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {progress.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.profile.full_name}</TableCell>
                        <TableCell>{record.subject}</TableCell>
                        <TableCell>
                          {classrooms.find(c => c.id === record.classroom_id)?.name || record.classroom_id}
                        </TableCell>
                        <TableCell>
                          <span className="text-lg font-semibold">{record.score}</span>
                          <span className="text-muted-foreground ml-1">/ 100</span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              record.score >= 90 ? "default" : 
                              record.score >= 75 ? "secondary" : 
                              "destructive"
                            }
                          >
                            {record.score >= 90 ? "Excellent" : 
                             record.score >= 75 ? "Good" : 
                             "Needs Improvement"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}