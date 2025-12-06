"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { AddTopicDialog } from "@/components/AddTopicDialog";
import { EditTopicDialog } from "@/components/EditTopicDialog";
import { deleteTopic } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Topic {
  id: string;
  name: string;
  image_url: string | null;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [deletingTopic, setDeletingTopic] = useState<Topic | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchTopics = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setTopics(data);
    }
    setTopicsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleDelete = async () => {
    if (!deletingTopic) return;
    
    setDeleteLoading(true);
    try {
      const result = await deleteTopic(deletingTopic.id);
      if (result.error) {
        throw new Error(result.error);
      }
      toast.success("Topic deleted successfully!");
      setDeletingTopic(null);
      fetchTopics();
    } catch (error: any) {
      toast.error(error.message || "Error deleting topic");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-lg">{tCommon("loading")}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userData = {
    name: (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "User",
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center pt-4">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">
              {t("welcome", { name: userData.name })}
            </p>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Add Topic Button */}
          <AddTopicDialog onTopicAdded={fetchTopics} />

          {/* Existing Topics */}
          {topics.map((topic) => (
            <Card 
              key={topic.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow h-[200px] relative group"
            >
              <CardContent 
                className="p-0 h-full relative cursor-pointer"
                onClick={() => router.push(`/dashboard/topic/${topic.id}`)}
              >
                {topic.image_url ? (
                  <img 
                    src={topic.image_url} 
                    alt={topic.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-4xl font-bold text-muted-foreground opacity-20">
                      {topic.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent flex items-end p-4">
                  <h3 className="text-white font-bold text-xl truncate w-full pr-8">
                    {topic.name}
                  </h3>
                </div>
                
                {/* Dropdown Menu */}
                <div 
                  className="absolute top-2 right-2 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingTopic(topic)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingTopic(topic)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {topicsLoading && (
            <div className="h-[200px] bg-muted animate-pulse rounded-lg" />
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      {editingTopic && (
        <EditTopicDialog
          topic={editingTopic}
          open={!!editingTopic}
          onOpenChange={(open) => !open && setEditingTopic(null)}
          onTopicUpdated={() => {
            setEditingTopic(null);
            fetchTopics();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTopic} onOpenChange={(open) => !open && setDeletingTopic(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the topic
              {deletingTopic && ` "${deletingTopic.name}"`} and all associated quizzes and flashcard decks.
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
