"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CreateFlashcardDialog } from "@/components/CreateFlashcardDialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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

export default function DeckPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !id) return;

    const [deckResult, flashcardsResult] = await Promise.all([
      supabase.from("flashcard_decks").select("*").eq("id", id).single(),
      supabase
        .from("flashcards")
        .select("*")
        .eq("deck_id", id)
        .order("created_at", { ascending: true }),
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

  if (!deck) return null;

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
        <div className="flex flex-col gap-4">
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
      </div>
    </div>
  );
}
