"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FlashcardStudy } from "@/components/FlashcardStudy";
import { FlashcardExam } from "@/components/FlashcardExam";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

export default function DeckPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'study' | 'exam'>('study');

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

    const [deckResult, flashcardsResult] = await Promise.all([
      supabase.from("flashcard_decks").select("topic_id").eq("id", id).single(),
      supabase
        .from("flashcards")
        .select("*")
        .eq("deck_id", id)
        .order("created_at", { ascending: true })
    ]);

    if (deckResult.error) {
      console.error("Error fetching deck:", deckResult.error);
      router.push("/dashboard");
      return;
    }

    if (deckResult.data) {
      setTopicId(deckResult.data.topic_id);
    }

    if (flashcardsResult.error) {
      console.error("Error fetching flashcards:", flashcardsResult.error);
      router.push("/dashboard");
      return;
    }
    
    if (flashcardsResult.data) {
      setFlashcards(flashcardsResult.data);
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

  if (viewMode === 'study') {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 flex items-center justify-center">
        <FlashcardStudy 
          flashcards={flashcards} 
          onExit={() => {
            if (topicId) {
              router.push(`/dashboard/topic/${topicId}`);
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
        <FlashcardExam 
          flashcards={flashcards} 
          onExit={() => {
            if (topicId) {
              router.push(`/dashboard/topic/${topicId}`);
            } else {
              router.push("/dashboard");
            }
          }} 
        />
      </div>
    );
  }

  // Redirect to flashcards list if no mode specified
  useEffect(() => {
    if (!pageLoading && !searchParams.get('mode')) {
      router.replace(`/dashboard/deck/${id}/flashcards`);
    }
  }, [pageLoading, id, router, searchParams]);

  return null;
}
