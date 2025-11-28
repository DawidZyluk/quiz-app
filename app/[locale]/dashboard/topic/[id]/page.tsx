"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Layers } from "lucide-react";
import { CreateDeckDialog } from "@/components/CreateDeckDialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Topic {
  id: string;
  name: string;
  image_url: string | null;
}

interface Deck {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  flashcards: { count: number }[];
}

export default function TopicPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !id) return;

    const [topicResult, decksResult] = await Promise.all([
      supabase.from("topics").select("*").eq("id", id).single(),
      supabase
        .from("flashcard_decks")
        .select("*, flashcards(count)")
        .eq("topic_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (topicResult.error) {
      console.error("Error fetching topic:", topicResult.error);
      router.push("/dashboard");
      return;
    }

    setTopic(topicResult.data);
    
    if (decksResult.data) {
        // @ts-ignore
        setDecks(decksResult.data);
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

  if (!topic) return null;

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
            <BreadcrumbItem>
              <BreadcrumbPage>{topic.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{topic.name}</h1>
          </div>
        </div>

        <Tabs defaultValue="flashcards" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
            <TabsTrigger value="quizzes">Tests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="flashcards" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Decks</h2>
              <CreateDeckDialog topicId={topic.id} onDeckCreated={fetchData} />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {decks.length === 0 ? (
                <Card className="bg-muted/50 border-dashed col-span-full">
                  <CardContent className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-4 p-6">
                    <Layers className="h-12 w-12 opacity-20" />
                    <p>No flashcard decks yet. Create one to start adding flashcards.</p>
                  </CardContent>
                </Card>
              ) : (
                decks.map((deck) => (
                  <Card 
                    key={deck.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow p-6"
                    onClick={() => router.push(`/dashboard/deck/${deck.id}`)}
                  >
                    <CardHeader className="p-0 mb-4">
                      <CardTitle>{deck.name}</CardTitle>
                      {deck.description && <CardDescription>{deck.description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="p-0">
                      <p className="text-sm text-muted-foreground">
                        {deck.flashcards?.[0]?.count || 0} cards
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="quizzes" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Tests</h2>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Test
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Quizzes list will go here */}
              <Card className="bg-muted/50 border-dashed col-span-full">
                <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground p-6">
                  No tests yet
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
