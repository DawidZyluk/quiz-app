"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { Settings, User as UserIcon, LogOut, Database } from "lucide-react";
import { seedData } from "@/lib/seed";
import { toast } from "sonner";

export default function HeaderActions() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const tAuth = useTranslations("Auth");
    const tDashboard = useTranslations("Dashboard");
    
    const [editProfileOpen, setEditProfileOpen] = useState(false);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [showSeedWarning, setShowSeedWarning] = useState(false);
    const [seeding, setSeeding] = useState(false);

    const getInitials = () => {
        if (!user) return "U";
        const name = (user.user_metadata?.full_name as string) || user.email || "U";
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 px-4 flex items-center justify-between z-50 border-b bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <h1 
                    className="text-2xl font-bold cursor-pointer bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent" 
                    onClick={() => router.push('/dashboard')}
                >
                    Quizy
                </h1>
            </div>
            <div className="flex items-center gap-4">
            {user && (
                <>
                    <EditProfileDialog 
                        user={user} 
                        open={editProfileOpen} 
                        onOpenChange={setEditProfileOpen} 
                    />
                    <ChangePasswordDialog 
                        open={changePasswordOpen} 
                        onOpenChange={setChangePasswordOpen} 
                    />
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger className="cursor-pointer focus:outline-none" asChild>
                            <Avatar>
                                <AvatarImage src={user.user_metadata?.avatar_url} />
                                <AvatarFallback>{getInitials()}</AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-56">
                            <DropdownMenuLabel>{tDashboard("userProfile")}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => router.push('/settings')}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>{tDashboard("securitySettings")}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setShowSeedWarning(true)}>
                                <Database className="mr-2 h-4 w-4" />
                                <span>Seed Data (Dev)</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={signOut} className="text-destructive focus:text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>{tAuth("logout")}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            )}
            <LanguageSwitcher />
            <ThemeToggle />
            </div>
            
            <AlertDialog open={showSeedWarning} onOpenChange={setShowSeedWarning}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>⚠️ Warning: Delete All Data</AlertDialogTitle>
                        <AlertDialogDescription className="sr-only">
                            This action will permanently delete all your data including topics, flashcards, quizzes, and progress. This cannot be undone.
                        </AlertDialogDescription>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p className="font-semibold text-destructive">
                                This action will PERMANENTLY DELETE all your data:
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>All topics and their images</li>
                                <li>All flashcard decks and flashcards</li>
                                <li>All quizzes and questions</li>
                                <li>All learning progress and statistics</li>
                            </ul>
                            <p className="pt-2 font-medium">
                                This action cannot be undone. Are you sure you want to continue?
                            </p>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={seeding}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                setShowSeedWarning(false);
                                setSeeding(true);
                                try {
                                    await seedData();
                                    toast.success("Seed data created successfully!");
                                    // Refresh the page to show new data
                                    setTimeout(() => {
                                        window.location.href = "/dashboard";
                                    }, 1000);
                                } catch (error: any) {
                                    toast.error("Error seeding data: " + error.message);
                                    setSeeding(false);
                                }
                            }}
                            disabled={seeding}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {seeding ? "Seeding..." : "Yes, Delete All & Seed"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </header>
    );
}
