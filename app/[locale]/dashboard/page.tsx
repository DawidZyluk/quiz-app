"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";

import { EditProfileDialog } from "@/components/EditProfileDialog";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{tCommon("loading")}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userData = {
    name: (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "User",
    email: user.email || "no-email",
    joinDate: new Date(user.created_at).toISOString().split("T")[0],
    emailVerified: user.email_confirmed_at !== null,
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
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

        {/* Main Layout - 1 column */}
        <div className="grid gap-6 grid-cols-1">
            
            {/* Profile Info */}
            <div className="space-y-6">
                <Card className="h-full">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                        <div className="space-y-1.5">
                            <CardTitle>{t("userProfile")}</CardTitle>
                            <CardDescription>{t("accountInfo")}</CardDescription>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-muted-foreground">{t("verificationStatus")}</p>
                            <p className={`text-lg font-semibold ${userData.emailVerified ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                                {userData.emailVerified ? t("verified") : t("unverified")}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Email - Full width */}
                        

                        {/* Other details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("email")}</p>
                            <p className="text-lg font-semibold break-all">{userData.email}</p>
                        </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t("name")}</p>
                                <p className="text-lg font-semibold">{userData.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t("joinDate")}</p>
                                <p className="text-lg font-semibold">{new Date(userData.joinDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t("accountStatus")}</p>
                                <p className="text-lg font-semibold">{t("active")}</p>
                            </div>
                            
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-col w-full">
                            <EditProfileDialog user={user} />
                            <ChangePasswordDialog />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
