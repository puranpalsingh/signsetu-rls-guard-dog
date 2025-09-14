'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  BookOpen, 
  LogOut, 
  Users, 
  TrendingUp,
  Calculator,
  Save,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Classroom, ProgressRecord } from '@/lib/types';

export default function TeacherPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [newScore, setNewScore] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'teacher') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const [progressRes, classroomRes] = await Promise.all([
          supabase.from('progress').select('*, profile(full_name)'),
          supabase.from('classroom').select('*')
        ]);

        if (progressRes.data) setProgress(progressRes.data as ProgressRecord[]);
        if (classroomRes.data) setClassrooms(classroomRes.data as Classroom[]);
      };

      fetchData();
    }
  }, [user]);

  if (!user || user.role !== 'teacher') return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getTeacherClassrooms = () => {
    return classrooms.filter(classroom => classroom.teacher_id === user.id);
  };

  const getClassroomRecords = (classroomId: string) => {
    return progress.filter(record => record.classroom_id === classroomId);
  };

  const handleEditScore = (recordId: string, currentScore: number) => {
    setEditingRecord(recordId);
    setNewScore(currentScore);
  };

  const handleSaveScore = async (recordId: string) => {
    const { error } = await supabase
      .from('progress')
      .update({ score: newScore })
      .eq('id', recordId);

    if (error) {
      console.error('Error updating score:', error);
      return;
    }

    // Refresh data
    const { data } = await supabase.from('progress').select('*, profile(full_name)');
    if (data) setProgress(data as ProgressRecord[]);

    setEditingRecord(null);
    setNewScore(0);
  };

  const handleCalculateClassAverage = async (classroomId: string) => {
    setIsCalculating(true);
    setCalculationResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      console.log('Calculating average for classroom:', classroomId);
      console.log('Session token:', session.access_token ? 'Present' : 'Missing');

     
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      let response = await fetch(`${baseUrl}/api/calculate-class-average`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ classroom_id: classroomId }),
      });


      // If Edge Function fails with 404, try local API
      if (response.status === 404) {
        console.log('Edge Function not available, trying local API...');
        response = await fetch('/api/calculate-class-average-local', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ classroom_id: classroomId }),
        });
      }

      console.log('API response status:', response.status);
      const result = await response.json();
      console.log('API response data:', result);
      
      if (response.ok) {
        const mongoStatus = result.mongo_saved ? 'saved to MongoDB' : 'MongoDB unavailable';
        if (result.average === 0 && result.debug_info) {
          setCalculationResult(`⚠️ No records found for this classroom. Debug: ${JSON.stringify(result.debug_info)}`);
        } else {
          setCalculationResult(`✅ Class average calculated: ${result.average}% (${mongoStatus})`);
        }
      } else {
        if (result.error?.includes('environment variables')) {
          setCalculationResult(`❌ Configuration Error: Please check your .env.local file. Visit /api/check-env for details.`);
        } else {
          setCalculationResult(`❌ Error: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error calculating class average:', error);
      setCalculationResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCalculating(false);
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
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold">Teacher Portal</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span className="text-sm font-medium">{user.full_name}</span>
                <Badge variant="default">Teacher</Badge>
              </div>
              <ThemeToggle />
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
            Manage your classrooms, edit student progress, and calculate class averages.
          </p>
        </div>

        {/* MongoDB Integration Demo */}
        {calculationResult && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  {calculationResult}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Classrooms Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Your Classrooms</span>
              </CardTitle>
              <CardDescription>
                Select a classroom to view and edit student progress
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
                      <p className="text-sm text-muted-foreground">Classroom</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getClassroomRecords(classroom.id).length} students
                      </p>
                      <div className="mt-3 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCalculateClassAverage(classroom.id);
                          }}
                          disabled={isCalculating}
                        >
                          {isCalculating ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Calculator className="w-4 h-4 mr-2" />
                          )}
                          Calculate Average
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Student Progress Table */}
          {selectedClassroom && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Student Progress - {classrooms.find(c => c.id === selectedClassroom)?.name}
                </CardTitle>
                <CardDescription>
                  Click on scores to edit them. Use &quot;Calculate Average&quot; to save class statistics to MongoDB.
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getClassroomRecords(selectedClassroom).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.profile.full_name}</TableCell>
                        <TableCell>{record.subject}</TableCell>
                        <TableCell>
                          {editingRecord === record.id ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={newScore}
                                onChange={(e) => setNewScore(Number(e.target.value))}
                                className="w-20"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveScore(record.id)}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <span 
                              className="text-lg font-semibold cursor-pointer hover:bg-muted p-1 rounded"
                              onClick={() => handleEditScore(record.id, record.score)}
                            >
                              {record.score}
                            </span>
                          )}
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
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditScore(record.id, record.score)}
                          >
                            Edit Score
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

