"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center pt-16 md:pt-0">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">
              {t("welcome", { name: userData.name })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
