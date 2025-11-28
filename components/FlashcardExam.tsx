"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RotateCcw, X, Check, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { updateFlashcardStatus } from "@/lib/actions";
import { toast } from "sonner";

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
  const [stats, setStats] = useState({ remembered: 0, forgotten: 0 });

  // Reset state when flashcards change or component mounts
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setStats({ remembered: 0, forgotten: 0 });
  }, [flashcards]);

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex) / flashcards.length) * 100;

  const handleRate = async (status: 'remembered' | 'forgotten') => {
    // Optimistic update
    setStats(prev => ({
      ...prev,
      [status]: prev[status] + 1
    }));

    // Update backend
    const result = await updateFlashcardStatus(currentCard.id, status);
    if (result.error) {
      toast.error("Failed to save progress");
    }

    // Move to next card
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    } else {
      setIsCompleted(true);
    }
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
    return (
      <div className="flex flex-col items-center justify-center max-w-md mx-auto gap-8 py-12">
        <h2 className="text-3xl font-bold">Exam Completed!</h2>
        
        <div className="grid grid-cols-2 gap-4 w-full">
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
        </div>

        <div className="flex gap-4">
          <Button onClick={onExit} variant="outline">Back to Deck</Button>
          <Button onClick={() => window.location.reload()}>Restart Exam</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onExit} size="sm">
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
          className="w-full h-full absolute transition-all duration-500 preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
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

