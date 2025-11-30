"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Edit, Trash2, Target, X, Check, RotateCcw } from "lucide-react";
import { CreateFlashcardDialog } from "@/components/CreateFlashcardDialog";
import { EditFlashcardDialog } from "@/components/EditFlashcardDialog";
import { deleteFlashcard, resetFlashcardProgress } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { MoreVertical } from "lucide-react";
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
  stats?: {
    status: 'remembered' | 'forgotten' | null;
    last_reviewed_at: string | null;
    remembered_count: number;
    forgotten_count: number;
    total_reviews: number;
  };
}

export default function FlashcardsListPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [deletingFlashcard, setDeletingFlashcard] = useState<Flashcard | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetAlert, setShowResetAlert] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !id) return;

    // Fetch deck
    const { data: deckData, error: deckError } = await supabase
      .from("flashcard_decks")
      .select("*")
      .eq("id", id)
      .single();

    if (deckError) {
      console.error("Error fetching deck:", deckError);
      router.push("/dashboard");
      return;
    }

    setDeck(deckData);

    // Fetch topic
    const { data: topicData } = await supabase
      .from("topics")
      .select("id, name")
      .eq("id", deckData.topic_id)
      .single();
    
    if (topicData) setTopic(topicData);

    // Fetch flashcards
    const { data: flashcardsData } = await supabase
      .from("flashcards")
      .select("*")
      .eq("deck_id", id)
      .order("created_at", { ascending: true });

    if (!flashcardsData || flashcardsData.length === 0) {
      setFlashcards([]);
      setPageLoading(false);
      return;
    }

    // Fetch progress stats with counts for flashcards in this deck
    const flashcardIds = flashcardsData.map((f: any) => f.id);
    
    // Try to fetch with count columns first
    let progressData: any[] | null = null;
    let hasCountColumns = true;
    
    const { data: progressDataWithCounts, error: progressErrorWithCounts } = await supabase
      .from("user_flashcard_progress")
      .select("flashcard_id, status, last_reviewed_at, remembered_count, forgotten_count")
      .eq("user_id", user.id)
      .in("flashcard_id", flashcardIds);

    // If error, try without count columns (migration might not be run)
    if (progressErrorWithCounts) {
      const errorMessage = progressErrorWithCounts.message || JSON.stringify(progressErrorWithCounts);
      const isColumnError = progressErrorWithCounts.code === '42703' || 
                           errorMessage.toLowerCase().includes('column') ||
                           errorMessage.includes('remembered_count') ||
                           errorMessage.includes('forgotten_count');
      
      if (isColumnError) {
        console.warn("Count columns don't exist - migration may not be run. Using fallback mode.");
        hasCountColumns = false;
        
        // Try without count columns
        const { data: progressDataWithoutCounts, error: progressErrorWithoutCounts } = await supabase
          .from("user_flashcard_progress")
          .select("flashcard_id, status, last_reviewed_at")
          .eq("user_id", user.id)
          .in("flashcard_id", flashcardIds);
        
        if (progressErrorWithoutCounts) {
          console.error("Error fetching progress:", progressErrorWithoutCounts);
          progressData = null;
        } else {
          progressData = progressDataWithoutCounts;
        }
      } else {
        console.error("Error fetching progress:", progressErrorWithCounts);
        progressData = null;
      }
    } else {
      progressData = progressDataWithCounts;
    }

    // Create a map of flashcard_id -> progress stats
    const progressMap = new Map(
      (progressData || []).map((p: any) => {
        // Handle null/undefined values - convert to numbers
        // If columns don't exist, calculate from status
        let rememberedCount = 0;
        let forgottenCount = 0;
        
        if (hasCountColumns) {
          rememberedCount = p.remembered_count != null ? Number(p.remembered_count) : 0;
          forgottenCount = p.forgotten_count != null ? Number(p.forgotten_count) : 0;
        } else {
          // Fallback: if no count columns, use status to infer counts
          if (p.status === 'remembered') {
            rememberedCount = 1;
          } else if (p.status === 'forgotten') {
            forgottenCount = 1;
          }
        }
        
        return [p.flashcard_id, { 
          status: p.status, 
          last_reviewed_at: p.last_reviewed_at,
          remembered_count: rememberedCount,
          forgotten_count: forgottenCount,
          total_reviews: rememberedCount + forgottenCount
        }];
      })
    );

    // Combine flashcards with their stats
    const flashcardsWithStats = flashcardsData.map((card: any) => ({
      ...card,
      stats: progressMap.get(card.id) || { 
        status: null, 
        last_reviewed_at: null,
        remembered_count: 0,
        forgotten_count: 0,
        total_reviews: 0
      }
    }));

    setFlashcards(flashcardsWithStats);
    
    setPageLoading(false);
  }, [user, id, supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deletingFlashcard) return;
    
    setDeleteLoading(true);
    try {
      const result = await deleteFlashcard(deletingFlashcard.id);
      if (result.error) {
        throw new Error(result.error);
      }
      toast.success("Flashcard deleted successfully!");
      setDeletingFlashcard(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Error deleting flashcard");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetStats = async () => {
    if (!id) return;
    
    setShowResetAlert(false);
    setResetLoading(true);
    try {
      const result = await resetFlashcardProgress(id as string);
      if (result.error) {
        throw new Error(result.error);
      }
      toast.success("Statistics reset successfully!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Error resetting statistics");
    } finally {
      setResetLoading(false);
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

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <AlertDialog open={showResetAlert} onOpenChange={setShowResetAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Flashcard Statistics?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all your progress and statistics for all flashcards in this deck.
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
              <BreadcrumbPage>{deck.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col gap-4">
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
          </div>
          
          <div className="flex justify-between items-center border-b pb-4">
            <p className="text-muted-foreground">
              {flashcards.length} flashcards
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetAlert(true)}
                disabled={resetLoading}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {resetLoading ? "Resetting..." : "Reset Stats"}
              </Button>
              <CreateFlashcardDialog deckId={deck.id} onFlashcardCreated={fetchData} />
            </div>
          </div>
        </div>

        {/* Flashcards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {flashcards.length === 0 ? (
            <Card className="bg-muted/50 border-dashed col-span-full">
              <CardContent className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-4 p-6">
                <p>No flashcards in this deck yet.</p>
              </CardContent>
            </Card>
          ) : (
            flashcards.map((flashcard) => (
              <Card key={flashcard.id} className="flex flex-col h-full relative aspect-square">
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-sm whitespace-pre-wrap break-words text-center">{flashcard.question}</p>
                    </div>
                    <div className="border-t my-3"></div>
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-sm whitespace-pre-wrap break-words text-center">{flashcard.answer}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {flashcard.stats?.remembered_count ?? 0}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {flashcard.stats?.forgotten_count ?? 0}
                          </span>
                        </span>
                      </div>
                      <span className="text-muted-foreground font-medium">
                        {flashcard.stats?.total_reviews ?? 0} reviews
                      </span>
                    </div>
                  </div>
                </CardContent>
                <div className="absolute top-2 right-2">
                  <div className="flex items-center gap-1">
                    {flashcard.stats?.status && (
                      <Badge 
                        variant={flashcard.stats.status === 'remembered' ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {flashcard.stats.status === 'remembered' ? '✓' : '✗'}
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingFlashcard(flashcard)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingFlashcard(flashcard)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      {editingFlashcard && (
        <EditFlashcardDialog
          flashcard={editingFlashcard}
          open={!!editingFlashcard}
          onOpenChange={(open) => !open && setEditingFlashcard(null)}
          onFlashcardUpdated={() => {
            setEditingFlashcard(null);
            fetchData();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingFlashcard} onOpenChange={(open) => !open && setDeletingFlashcard(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flashcard?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this flashcard.
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
  );
}

