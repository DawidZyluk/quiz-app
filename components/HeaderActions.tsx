"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function HeaderActions() {
    const { user, signOut } = useAuth();
    const t = useTranslations("Auth");

    return (
        <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
            {user && (
                <Button variant="outline" onClick={signOut}>
                    {t("logout")}
                </Button>
            )}
            <LanguageSwitcher />
            <ThemeToggle />
        </div>
    );
}

