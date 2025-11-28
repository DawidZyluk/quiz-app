"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AddQuestionDialog } from "@/components/AddQuestionDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";

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
}

export default function QuizPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

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

    // Fetch questions and answers
    const { data: questionsData } = await supabase
      .from("questions")
      .select(`
        *,
        answers (*)
      `)
      .eq("quiz_id", id)
      .order("created_at", { ascending: true });
    
    if (questionsData) {
      setQuestions(questionsData as Question[]);
    }
    
    setPageLoading(false);
  }, [user, id, supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
                    <Badge variant="outline">
                      {question.question_type === 'single_choice' ? 'Single Choice' : 'Multiple Choice'}
                    </Badge>
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

