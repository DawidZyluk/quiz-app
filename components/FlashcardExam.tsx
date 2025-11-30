"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw, X, Check, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { updateFlashcardStatus } from "@/lib/actions";
import { toast } from "sonner";
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

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface FlashcardExamProps {
  flashcards: Flashcard[];
  onExit: () => void;
}

export function FlashcardExam({ flashcards, onExit }: FlashcardExamProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stats, setStats] = useState({ remembered: 0, forgotten: 0, skipped: 0 });
  const [flashcardStatuses, setFlashcardStatuses] = useState<Map<string, 'remembered' | 'forgotten' | 'skipped'>>(new Map());
  const [showExitAlert, setShowExitAlert] = useState(false);

  // Reset state when flashcards change or component mounts
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setStats({ remembered: 0, forgotten: 0, skipped: 0 });
    setFlashcardStatuses(new Map());
  }, [flashcards]);

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex) / flashcards.length) * 100;

  const handleRate = async (status: 'remembered' | 'forgotten') => {
    // Track status for this flashcard
    setFlashcardStatuses(prev => {
      const newMap = new Map(prev);
      newMap.set(currentCard.id, status);
      return newMap;
    });

    // Optimistic update
    setStats(prev => ({
      ...prev,
      [status]: prev[status] + 1
    }));

    // Update backend
    try {
      const result = await updateFlashcardStatus(currentCard.id, status);
      if (result.error) {
        console.error("Error saving progress:", result.error);
        toast.error("Failed to save progress: " + result.error);
        // Revert optimistic update on error
        setStats(prev => ({
          ...prev,
          [status]: prev[status] - 1
        }));
        setFlashcardStatuses(prev => {
          const newMap = new Map(prev);
          newMap.delete(currentCard.id);
          return newMap;
        });
        return;
      }
    } catch (error: any) {
      console.error("Exception saving progress:", error);
      toast.error("Failed to save progress: " + (error.message || "Unknown error"));
      // Revert optimistic update on error
      setStats(prev => ({
        ...prev,
        [status]: prev[status] - 1
      }));
      setFlashcardStatuses(prev => {
        const newMap = new Map(prev);
        newMap.delete(currentCard.id);
        return newMap;
      });
      return;
    }

    // Move to next card or complete exam
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    } else {
      // This is the last card - mark exam as completed
      // Mark any remaining cards as skipped (shouldn't be any, but just in case)
      const remaining = flashcards.filter((_, idx) => idx > currentIndex);
      if (remaining.length > 0) {
        setFlashcardStatuses(prev => {
          const newMap = new Map(prev);
          remaining.forEach(card => {
            if (!newMap.has(card.id)) {
              newMap.set(card.id, 'skipped');
            }
          });
          return newMap;
        });
        setStats(prev => ({
          ...prev,
          skipped: prev.skipped + remaining.length
        }));
      }
      // Mark exam as completed
      setIsCompleted(true);
    }
  };

  const handleExitClick = () => {
    if (isCompleted) {
      onExit();
    } else {
      setShowExitAlert(true);
    }
  };

  const confirmExit = () => {
    setShowExitAlert(false);
    onExit();
  };

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">No flashcards to examine.</p>
        <Button onClick={onExit}>Go Back</Button>
      </div>
    );
  }

  if (isCompleted) {
    const rememberedCards = flashcards.filter(card => flashcardStatuses.get(card.id) === 'remembered');
    const forgottenCards = flashcards.filter(card => flashcardStatuses.get(card.id) === 'forgotten');
    const skippedCards = flashcards.filter(card => flashcardStatuses.get(card.id) === 'skipped' || !flashcardStatuses.has(card.id));

    return (
      <div className="flex flex-col items-center max-w-4xl mx-auto gap-8 py-12 px-4">
        <h2 className="text-3xl font-bold">Exam Completed!</h2>
        
        <div className="grid grid-cols-3 gap-4 w-full">
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <span className="text-4xl font-bold text-green-600 dark:text-green-400">{stats.remembered}</span>
              <span className="text-sm text-muted-foreground">Remembered</span>
            </CardContent>
          </Card>
          
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <span className="text-4xl font-bold text-red-600 dark:text-red-400">{stats.forgotten}</span>
              <span className="text-sm text-muted-foreground">Forgotten</span>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <span className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">{stats.skipped}</span>
              <span className="text-sm text-muted-foreground">Skipped</span>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Summary */}
        <div className="w-full">
            <div className="space-y-4 pr-4">
              {rememberedCards.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-green-600 dark:text-green-400">
                    ✓ Remembered ({rememberedCards.length})
                  </h3>
                  <div className="space-y-2">
                    {rememberedCards.map((card) => (
                      <Card key={card.id} className="bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-sm mb-1">Q: {card.question}</p>
                              <p className="text-sm text-muted-foreground">A: {card.answer}</p>
                            </div>
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {forgottenCards.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">
                    ✗ Forgotten ({forgottenCards.length})
                  </h3>
                  <div className="space-y-2">
                    {forgottenCards.map((card) => (
                      <Card key={card.id} className="bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-sm mb-1">Q: {card.question}</p>
                              <p className="text-sm text-muted-foreground">A: {card.answer}</p>
                            </div>
                            <X className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {skippedCards.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-yellow-600 dark:text-yellow-400">
                    ⊘ Skipped ({skippedCards.length})
                  </h3>
                  <div className="space-y-2">
                    {skippedCards.map((card) => (
                      <Card key={card.id} className="bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-sm mb-1">Q: {card.question}</p>
                              <p className="text-sm text-muted-foreground">A: {card.answer}</p>
                            </div>
                            <span className="text-yellow-600 dark:text-yellow-400 shrink-0">⊘</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
        </div>

        <div className="flex gap-4 w-full justify-center">
          <Button onClick={onExit} variant="outline">Back to Topic</Button>
          <Button onClick={() => window.location.reload()}>Restart Exam</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <AlertDialog open={showExitAlert} onOpenChange={setShowExitAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress for the current session will be saved, but the exam is not completed. Are you sure you want to exit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>Exit Exam</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={handleExitClick} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Exit Exam
        </Button>
        <div className="flex-1 max-w-xs">
          <Progress value={progress} className="h-2" />
        </div>
        <div className="text-sm text-muted-foreground font-medium">
          {currentIndex + 1} / {flashcards.length}
        </div>
      </div>

      <div className="perspective-1000 h-[400px] w-full relative cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div
          className="w-full h-full absolute preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Front (Question) */}
          <Card className="absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-8 text-center border-2 shadow-lg">
            <CardContent className="p-0">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Question</h3>
              <p className="text-2xl font-medium">{currentCard.question}</p>
              <p className="text-xs text-muted-foreground mt-8 opacity-50">Click to reveal answer</p>
            </CardContent>
          </Card>

          {/* Back (Answer) */}
          <Card 
            className="absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-8 text-center border-2 bg-muted/10 shadow-lg"
            style={{ transform: "rotateY(180deg)" }}
          >
            <div className="rotate-180">
              <CardContent className="p-0">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Answer</h3>
                <p className="text-2xl font-medium">{currentCard.answer}</p>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 h-16">
        {isFlipped ? (
          <div className="flex gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Button
              variant="destructive"
              size="lg"
              className="w-32 gap-2"
              onClick={(e) => { e.stopPropagation(); handleRate('forgotten'); }}
            >
              <X className="h-5 w-5" />
              Forgot
            </Button>

            <Button
              variant="default"
              size="lg"
              className="w-32 gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={(e) => { e.stopPropagation(); handleRate('remembered'); }}
            >
              <Check className="h-5 w-5" />
              Remembered
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Tap card to see answer</p>
        )}
      </div>
    </div>
  );
}
