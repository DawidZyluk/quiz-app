"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, GraduationCap, RotateCcw } from "lucide-react";
import { CreateFlashcardDialog } from "@/components/CreateFlashcardDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FlashcardStudy } from "@/components/FlashcardStudy";
import { FlashcardExam } from "@/components/FlashcardExam";
import { resetDeckProgress } from "@/lib/actions";
import { toast } from "sonner";

interface Deck {
  id: string;
  name: string;
  description: string | null;
  topic_id: string;
}

interface Topic {
  id: string;
  name: string;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

interface ProgressStats {
  total: number;
  remembered: number;
  forgotten: number;
  neutral: number;
}

export default function DeckPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<ProgressStats>({ total: 0, remembered: 0, forgotten: 0, neutral: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'study' | 'exam'>('list');

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !id) return;

    const [deckResult, flashcardsResult, progressResult] = await Promise.all([
      supabase.from("flashcard_decks").select("*").eq("id", id).single(),
      supabase
        .from("flashcards")
        .select("*")
        .eq("deck_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("user_flashcard_progress")
        .select("flashcard_id, status")
        .eq("user_id", user.id)
    ]);

    if (deckResult.error) {
      console.error("Error fetching deck:", deckResult.error);
      router.push("/dashboard");
      return;
    }

    setDeck(deckResult.data);

    // Fetch topic details for breadcrumbs
    const { data: topicData } = await supabase
      .from("topics")
      .select("id, name")
      .eq("id", deckResult.data.topic_id)
      .single();
    
    if (topicData) {
      setTopic(topicData);
    }
    
    if (flashcardsResult.data) {
      setFlashcards(flashcardsResult.data);
      
      // Calculate stats
      const progressMap = new Map(progressResult.data?.map(p => [p.flashcard_id, p.status]));
      const newStats = {
        total: flashcardsResult.data.length,
        remembered: 0,
        forgotten: 0,
        neutral: 0
      };

      flashcardsResult.data.forEach(card => {
        const status = progressMap.get(card.id);
        if (status === 'remembered') newStats.remembered++;
        else if (status === 'forgotten') newStats.forgotten++;
        else newStats.neutral++;
      });
      
      setStats(newStats);
    }
    
    setPageLoading(false);
  }, [user, id, supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResetProgress = async () => {
    if (!id) return;
    const result = await resetDeckProgress(id as string);
    if (result.error) {
      toast.error("Failed to reset progress");
    } else {
      toast.success("Progress reset successfully");
      fetchData();
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!deck) return null;

  if (viewMode === 'study') {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 flex items-center justify-center">
        <FlashcardStudy 
          flashcards={flashcards} 
          onExit={() => setViewMode('list')} 
        />
      </div>
    );
  }

  if (viewMode === 'exam') {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 flex items-center justify-center">
        <FlashcardExam 
          flashcards={flashcards} 
          onExit={() => {
            setViewMode('list');
            fetchData(); // Refresh stats after exam
          }} 
        />
      </div>
    );
  }

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
              <BreadcrumbPage>{deck.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/topic/${deck.topic_id}`)}>
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{deck.name}</h1>
                {deck.description && (
                  <p className="text-muted-foreground mt-1">{deck.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setViewMode('study')} disabled={flashcards.length === 0} variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Study Mode
              </Button>
              <Button onClick={() => setViewMode('exam')} disabled={flashcards.length === 0}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Exam Mode
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between items-center border-b pb-4">
            <p className="text-muted-foreground">
              {flashcards.length} flashcards
            </p>
            <CreateFlashcardDialog deckId={deck.id} onFlashcardCreated={fetchData} />
          </div>
        </div>

        {/* Flashcards List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {flashcards.length === 0 ? (
            <Card className="bg-muted/50 border-dashed col-span-full">
              <CardContent className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-4 p-6">
                <p>No flashcards in this deck yet.</p>
              </CardContent>
            </Card>
          ) : (
            flashcards.map((card) => (
              <Card key={card.id} className="flex flex-col">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Question</h3>
                    <p className="text-lg">{card.question}</p>
                  </div>
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Answer</h3>
                    <p className="text-lg">{card.answer}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Statistics Section */}
        {flashcards.length > 0 && (
          <Card className="mt-8 border-t-4 border-t-primary">
            <CardHeader className="pb-2">
              <CardTitle>Learning Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center mb-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Cards</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400">
                  <p className="text-3xl font-bold">{stats.remembered}</p>
                  <p className="text-sm">Remembered</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400">
                  <p className="text-3xl font-bold">{stats.forgotten}</p>
                  <p className="text-sm">Forgotten</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-3xl font-bold">{stats.neutral}</p>
                  <p className="text-sm text-muted-foreground">Not Reviewed</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleResetProgress}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
