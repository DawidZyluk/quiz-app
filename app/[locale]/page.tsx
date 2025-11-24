import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("HomePage");
  const tAuth = useTranslations("Auth");
  const tDashboard = useTranslations("Dashboard");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4 relative">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold">{t("title")}</h1>
        <p className="text-xl text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/login">{tAuth("login")}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/register">{tAuth("register")}</Link>
        </Button>
      </div>
    </div>
  );
}
