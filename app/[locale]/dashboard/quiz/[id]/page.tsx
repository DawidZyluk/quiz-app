"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, GraduationCap, Target, RotateCcw } from "lucide-react";
import { AddQuestionDialog } from "@/components/AddQuestionDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resetQuizProgress } from "@/lib/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { QuizStudy } from "@/components/QuizStudy";
import { QuizExam } from "@/components/QuizExam";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  topic_id: string;
}

interface Topic {
  id: string;
  name: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice';
  created_at: string;
  answers: {
    id: string;
    answer_text: string;
    is_correct: boolean;
  }[];
  stats?: {
    attempts: number;
    success_rate: number;
  };
}

export default function QuizPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'study' | 'exam'>('study');
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetAlert, setShowResetAlert] = useState(false);

  // Check for mode in query params
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'study' || mode === 'exam') {
      setViewMode(mode);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !id) return;

    // Fetch quiz
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", id)
      .single();

    if (quizError) {
      console.error("Error fetching quiz:", quizError);
      router.push("/dashboard");
      return;
    }

    setQuiz(quizData);

    // Fetch topic
    const { data: topicData } = await supabase
      .from("topics")
      .select("id, name")
      .eq("id", quizData.topic_id)
      .single();
    
    if (topicData) setTopic(topicData);

    // Fetch questions, answers and stats
    const { data: questionsData } = await supabase
      .from("questions")
      .select(`
        *,
        answers (*)
      `)
      .eq("quiz_id", id)
      .order("created_at", { ascending: true });

    // Fetch stats
    const { data: statsData } = await supabase
      .from("user_quiz_progress")
      .select("question_id, is_correct")
      .eq("user_id", user.id);
    
    if (questionsData) {
      const questionsWithStats = questionsData.map((q: any) => {
        const qStats = statsData?.filter(s => s.question_id === q.id) || [];
        const attempts = qStats.length;
        const correct = qStats.filter(s => s.is_correct).length;
        
        return {
          ...q,
          stats: {
            attempts,
            success_rate: attempts > 0 ? Math.round((correct / attempts) * 100) : 0
          }
        };
      });
      setQuestions(questionsWithStats as Question[]);
    }
    
    setPageLoading(false);
  }, [user, id, supabase, router]);

  const handleResetStats = async () => {
    setShowResetAlert(false);
    setResetLoading(true);
    const result = await resetQuizProgress(id as string);
    setResetLoading(false);
    
    if (result.error) {
      alert("Failed to reset statistics: " + result.error);
    } else {
      fetchData();
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData, viewMode]); // Refetch when switching back from modes

  if (loading || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!quiz) return null;

  if (viewMode === 'study') {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 flex items-center justify-center">
        <QuizStudy 
          questions={questions} 
          onExit={() => {
            if (quiz?.topic_id) {
              router.push(`/dashboard/topic/${quiz.topic_id}?tab=quizzes`);
            } else {
              router.push("/dashboard");
            }
          }} 
        />
      </div>
    );
  }

  if (viewMode === 'exam') {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 flex items-center justify-center">
        <QuizExam 
          questions={questions} 
          onExit={() => {
            if (quiz?.topic_id) {
              router.push(`/dashboard/topic/${quiz.topic_id}?tab=quizzes`);
            } else {
              router.push("/dashboard");
            }
          }} 
        />
      </div>
    );
  }

  // Redirect to questions list if no mode specified
  useEffect(() => {
    if (!pageLoading && !searchParams.get('mode')) {
      router.replace(`/dashboard/quiz/${id}/questions`);
    }
  }, [pageLoading, id, router, searchParams]);

  return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <AlertDialog open={showResetAlert} onOpenChange={setShowResetAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Quiz Statistics?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all your progress and history for this quiz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetStats} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Reset Statistics
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {topic && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/dashboard/topic/${topic.id}`}>{topic.name}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>{quiz.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/topic/${quiz.topic_id}`)}>
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{quiz.title}</h1>
                {quiz.description && (
                  <p className="text-muted-foreground mt-1">{quiz.description}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowResetAlert(true)}
                disabled={resetLoading || questions.length === 0}
              >
                <RotateCcw className={`mr-2 h-4 w-4 ${resetLoading ? 'animate-spin' : ''}`} />
                Reset Stats
              </Button>
              <Button onClick={() => setViewMode('study')} disabled={questions.length === 0} variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Study Mode
              </Button>
              <Button onClick={() => setViewMode('exam')} disabled={questions.length === 0}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Take Test
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between items-center border-b pb-4">
            <p className="text-muted-foreground">
              {questions.length} questions
            </p>
            <AddQuestionDialog quizId={quiz.id} onQuestionAdded={fetchData} />
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {questions.length === 0 ? (
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-4 p-6">
                <p>No questions in this test yet.</p>
              </CardContent>
            </Card>
          ) : (
            questions.map((question, index) => (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-medium">
                      <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                      {question.question_text}
                    </CardTitle>
                    <div className="flex gap-2 items-center">
                      {question.stats && question.stats.attempts > 0 && (
                        <Badge variant={question.stats.success_rate >= 70 ? "default" : "secondary"} className="flex gap-1">
                          <Target className="w-3 h-3" />
                          {question.stats.success_rate}% ({question.stats.attempts})
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {question.question_type === 'single_choice' ? 'Single Choice' : 'Multiple Choice'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {question.answers.map((answer) => (
                      <div 
                        key={answer.id}
                        className={`p-3 rounded-md border flex items-center justify-between ${
                          answer.is_correct ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900" : ""
                        }`}
                      >
                        <span>{answer.answer_text}</span>
                        {answer.is_correct && (
                          <Badge className="bg-green-600 hover:bg-green-600">Correct</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
