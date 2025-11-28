"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { AddTopicDialog } from "@/components/AddTopicDialog";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

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
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-[200px]"
              onClick={() => router.push(`/dashboard/topic/${topic.id}`)}
            >
              <CardContent className="p-0 h-full relative group">
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
                  <h3 className="text-white font-bold text-xl truncate w-full">
                    {topic.name}
                  </h3>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {topicsLoading && (
            <div className="h-[200px] bg-muted animate-pulse rounded-lg" />
          )}
        </div>
      </div>
    </div>
  );
}
