"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Edit, Trash2, MoreVertical, CheckCircle2, Circle } from "lucide-react";
import { AddQuestionDialog } from "@/components/AddQuestionDialog";
import { EditQuestionDialog } from "@/components/EditQuestionDialog";
import { deleteQuestion } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

export default function QuestionsListPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

    // Fetch questions with answers
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deletingQuestion) return;
    
    setDeleteLoading(true);
    try {
      const result = await deleteQuestion(deletingQuestion.id);
      if (result.error) {
        throw new Error(result.error);
      }
      toast.success("Question deleted successfully!");
      setDeletingQuestion(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Error deleting question");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
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
          </div>
          
          <div className="flex justify-between items-center border-b pb-4">
            <p className="text-muted-foreground">
              {questions.length} questions
            </p>
            <AddQuestionDialog quizId={quiz.id} onQuestionAdded={fetchData} />
          </div>
        </div>

        {/* Questions List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.length === 0 ? (
            <Card className="bg-muted/50 border-dashed col-span-full">
              <CardContent className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-4 p-6">
                <p>No questions in this quiz yet.</p>
              </CardContent>
            </Card>
          ) : (
            questions.map((question) => (
              <Card key={question.id} className="flex flex-col h-full relative">
                <div className="absolute top-2 right-2 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingQuestion(question)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingQuestion(question)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col pr-12">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={question.question_type === 'single_choice' ? 'default' : 'secondary'}>
                      {question.question_type === 'single_choice' ? 'Single Choice' : 'Multiple Choice'}
                    </Badge>
                    {question.stats && question.stats.attempts > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {question.stats.attempts} attempts • {question.stats.success_rate}% success
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 mb-4">
                    <p className="font-medium text-sm mb-3">{question.question_text}</p>
                    <div className="space-y-2">
                      {question.answers.map((answer, idx) => (
                        <div key={answer.id} className="flex items-center gap-2 text-sm">
                          {answer.is_correct ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span className={answer.is_correct ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                            {answer.answer_text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        {editingQuestion && (
          <EditQuestionDialog
            question={editingQuestion}
            open={!!editingQuestion}
            onOpenChange={(open) => !open && setEditingQuestion(null)}
            onQuestionUpdated={() => {
              setEditingQuestion(null);
              fetchData();
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingQuestion} onOpenChange={(open) => !open && setDeletingQuestion(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Question?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the question
                {deletingQuestion && ` "${deletingQuestion.question_text.substring(0, 50)}${deletingQuestion.question_text.length > 50 ? '...' : ''}"`} and all associated answers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

