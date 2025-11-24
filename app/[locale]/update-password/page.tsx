"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useRouter, Link } from "@/i18n/routing";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const t = useTranslations("UpdatePassword");
  const tCommon = useTranslations("Common");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  useEffect(() => {
    const initializeSession = async () => {
      // First, check if we already have a valid session
      const { data: { session: existingSession } } = await supabase.auth.getSession();

      if (existingSession) {
        setSessionReady(true);
        return;
      }

      // Check if we have hash parameters in the URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      // If no hash, check if session exists (might have been set by AuthProvider)
      if (!accessToken) {
        // Wait a bit for AuthProvider to process
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              setSessionReady(true);
            } else {
              setError(t("verifyError"));
            }
          });
        }, 100);
        return;
      }

      // Verify it's a recovery type
      if (type !== "recovery") {
        setError(t("invalidLinkType"));
        return;
      }

      // Set session from hash tokens
      try {
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (sessionError) {
          setError(sessionError.message || t("sessionError"));
          return;
        }

        if (data.session) {
          setSessionReady(true);
          // Clear the hash from URL
          window.history.replaceState(null, "", window.location.pathname);
        }
      } catch (err: any) {
        setError(err.message || tCommon("error"));
      }
    };

    initializeSession();

    // Also listen for auth state changes as backup
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY")) {
        setSessionReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, t, tCommon]);

  const onSubmit = async (data: any) => {
    if (!sessionReady) {
      setError(t("waitVerification"));
      return;
    }

    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        setError(updateError.message || t("updateError"));
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || tCommon("error"));
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("successTitle")}</CardTitle>
            <CardDescription>
              {t("successDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("redirecting")}
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href="/login">{t("goToLogin")}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {t("description")}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {!sessionReady && !error && (
              <div className="p-3 text-sm text-muted-foreground bg-muted/50 rounded-md border">
                {t("verifying")}
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">{t("newPassword")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  disabled={loading}
                  {...register("password", {
                    required: true,
                    minLength: {
                      value: 6,
                      message: "Min 6 chars",
                    },
                  })}
                  aria-invalid={errors.password ? "true" : "false"}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide" : "Show"}
                  </span>
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message as string || "Required"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword", { defaultMessage: "Confirm Password" })}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("confirmPasswordPlaceholder")}
                  disabled={loading}
                  {...register("confirmPassword", {
                    required: true,
                    validate: (value) =>
                      value === password || "Passwords do not match",
                  })}
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {showConfirmPassword ? "Hide" : "Show"}
                  </span>
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message as string || "Required"}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading || !sessionReady}>
              {loading ? t("saving") : sessionReady ? t("submit") : t("verifying")}
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/login">{t("backToLogin")}</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
