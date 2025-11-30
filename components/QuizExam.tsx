"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckSquare, Square, Circle, CircleDot, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { saveQuizProgress } from "@/lib/actions";

interface Question {
  id: string;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice';
  answers: {
    id: string;
    answer_text: string;
    is_correct: boolean;
  }[];
}

interface QuizExamProps {
  questions: Question[];
  onExit: () => void;
}

export function QuizExam({ questions, onExit }: QuizExamProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [showExitAlert, setShowExitAlert] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

  const handleAnswerSelect = (answerId: string) => {
    const currentSelected = selectedAnswers[currentQuestion.id] || [];
    
    if (currentQuestion.question_type === 'single_choice') {
      setSelectedAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: [answerId]
      }));
    } else {
      const newSelected = currentSelected.includes(answerId)
        ? currentSelected.filter(id => id !== answerId)
        : [...currentSelected, answerId];
        
      setSelectedAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: newSelected
      }));
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      await finishExam();
    }
  };

  const finishExam = async () => {
    let correctCount = 0;
    
    for (const q of questions) {
      const selected = selectedAnswers[q.id] || [];
      const correct = q.answers.filter(a => a.is_correct).map(a => a.id);
      
      // Check if arrays have same elements (order doesn't matter)
      const isCorrect = selected.length === correct.length && 
        selected.every(id => correct.includes(id));
        
      if (isCorrect) correctCount++;
      
      // Save progress for each question
      await saveQuizProgress(q.id, isCorrect);
    }
    
    setScore(correctCount);
    setIsCompleted(true);
  };

  const handleExitClick = () => {
    if (isCompleted) {
      onExit();
    } else {
      setShowExitAlert(true);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">No questions to examine.</p>
        <Button onClick={onExit}>Go Back</Button>
      </div>
    );
  }

  if (isCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="flex flex-col items-center justify-center max-w-md mx-auto gap-8 py-12 h-full">
        <h2 className="text-3xl font-bold">Test Completed!</h2>
        
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="16"
              className="text-muted/20"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="16"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - percentage / 100)}
              className="text-primary transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-bold">{percentage}%</span>
            <span className="text-sm text-muted-foreground">{score} / {questions.length}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={onExit} variant="outline">Back to Quiz</Button>
          <Button onClick={() => window.location.reload()}>Restart Test</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full h-[calc(100vh-8rem)]">
      <AlertDialog open={showExitAlert} onOpenChange={setShowExitAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Test?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be lost. Are you sure you want to exit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onExit}>Exit Test</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={handleExitClick} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Exit Test
        </Button>
        <div className="flex-1 max-w-xs">
          <Progress value={progress} className="h-2" />
        </div>
        <div className="text-sm text-muted-foreground font-medium">
          {currentIndex + 1} / {questions.length}
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="text-xl">{currentQuestion.question_text}</CardTitle>
            <Badge variant="outline">
              {currentQuestion.question_type === 'single_choice' ? 'Single Choice' : 'Multiple Choice'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col gap-6">
          <ScrollArea className="flex-1">
            <div className="space-y-3 pr-4">
              {currentQuestion.answers.map((answer) => {
                const isSelected = (selectedAnswers[currentQuestion.id] || []).includes(answer.id);
                const isMultiple = currentQuestion.question_type === 'multiple_choice';
                
                return (
                  <Button
                    key={answer.id}
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full justify-start text-left h-auto min-h-[3rem] whitespace-normal p-4 ${isSelected ? "border-primary" : ""}`}
                    onClick={() => handleAnswerSelect(answer.id)}
                  >
                    {isMultiple ? (
                      isSelected ? (
                        <CheckSquare className="mr-2 h-5 w-5 shrink-0" />
                      ) : (
                        <Square className="mr-2 h-5 w-5 shrink-0" />
                      )
                    ) : (
                      isSelected ? (
                        <CircleDot className="mr-2 h-5 w-5 shrink-0" />
                      ) : (
                        <Circle className="mr-2 h-5 w-5 shrink-0" />
                      )
                    )}
                    <span className="pl-2">{answer.answer_text}</span>
                  </Button>
                ); 
              })}
            </div>
          </ScrollArea>

          <div className="mt-auto pt-4 border-t">
            <Button 
              className="w-full" 
              onClick={handleNext}
              disabled={(selectedAnswers[currentQuestion.id] || []).length === 0}
            >
              {currentIndex === questions.length - 1 ? "Finish Test" : "Next Question"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
