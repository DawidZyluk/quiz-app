"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

interface Topic {
  id: string;
  name: string;
  image_url: string | null;
}

export default function TopicPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchTopic() {
      if (!user || !id) return;

      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching topic:", error);
        router.push("/dashboard");
        return;
      }

      setTopic(data);
      setPageLoading(false);
    }

    fetchTopic();
  }, [user, id, supabase, router]);

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
              <h2 className="text-xl font-semibold">Your Flashcards</h2>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Flashcard
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Flashcards list will go here */}
              <Card className="bg-muted/50 border-dashed">
                <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
                  No flashcards yet
                </CardContent>
              </Card>
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
              <Card className="bg-muted/50 border-dashed">
                <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
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

