"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface FlashcardStudyProps {
  flashcards: Flashcard[];
  onExit: () => void;
}

export function FlashcardStudy({ flashcards, onExit }: FlashcardStudyProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Reset state when flashcards change or component mounts
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  const handleRestart = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(0), 150);
  };

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">No flashcards to study.</p>
        <Button onClick={onExit}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onExit}>Exit Study</Button>
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
          <Card className="absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-8 text-center border-2">
            <CardContent className="p-0">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Question</h3>
              <p className="text-2xl font-medium">{currentCard.question}</p>
              <p className="text-xs text-muted-foreground mt-8 opacity-50">Click to flip</p>
            </CardContent>
          </Card>

          {/* Back (Answer) */}
          <Card 
            className="absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-8 text-center border-2 bg-muted/10"
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

      <div className="flex items-center justify-center gap-4 mt-4">
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={(e) => { e.stopPropagation(); handleRestart(); }}
          title="Restart"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          disabled={currentIndex === flashcards.length - 1}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

