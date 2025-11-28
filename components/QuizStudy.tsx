"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Check, ChevronRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface QuizStudyProps {
  questions: Question[];
  onExit: () => void;
}

export function QuizStudy({ questions, onExit }: QuizStudyProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (answerId: string) => {
    if (showResult) return;

    if (currentQuestion.question_type === 'single_choice') {
      setSelectedAnswers([answerId]);
    } else {
      setSelectedAnswers(prev => 
        prev.includes(answerId) 
          ? prev.filter(id => id !== answerId)
          : [...prev, answerId]
      );
    }
  };

  const handleCheck = () => {
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswers([]);
      setShowResult(false);
    } else {
      onExit();
    }
  };

  const isAnswerCorrect = (answerId: string) => {
    const answer = currentQuestion.answers.find(a => a.id === answerId);
    return answer?.is_correct;
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">No questions to study.</p>
        <Button onClick={onExit}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onExit} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Exit Study
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
                const isSelected = selectedAnswers.includes(answer.id);
                let variant = "outline";
                let className = "w-full justify-between text-left h-auto min-h-[3rem] whitespace-normal p-4";
                
                if (showResult) {
                  if (answer.is_correct) {
                    variant = "default"; // Highlight correct answer
                    className += " bg-green-600 hover:bg-green-700 text-white border-green-600";
                  } else if (isSelected && !answer.is_correct) {
                    variant = "destructive"; // Highlight wrong selection
                    className += "";
                  } else {
                    className += " opacity-50";
                  }
                } else if (isSelected) {
                  variant = "default";
                  className += " border-primary";
                }

                return (
                  <Button
                    key={answer.id}
                    variant={variant as any}
                    className={className}
                    onClick={() => handleAnswerSelect(answer.id)}
                    disabled={showResult}
                  >
                    <span className="flex-1">{answer.answer_text}</span>
                    {showResult && (
                      <span className="ml-2">
                        {answer.is_correct ? (
                          <Check className="h-5 w-5" />
                        ) : isSelected ? (
                          <X className="h-5 w-5" />
                        ) : null}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>

          <div className="mt-auto pt-4 border-t">
            {!showResult ? (
              <Button 
                className="w-full" 
                onClick={handleCheck}
                disabled={selectedAnswers.length === 0}
              >
                Check Answer
              </Button>
            ) : (
              <Button className="w-full" onClick={handleNext}>
                {currentIndex === questions.length - 1 ? "Finish Study" : "Next Question"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

