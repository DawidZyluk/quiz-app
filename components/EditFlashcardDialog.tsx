"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateFlashcard } from "@/lib/actions";

const formSchema = z.object({
  question: z.string().min(1, {
    message: "Question is required.",
  }),
  answer: z.string().min(1, {
    message: "Answer is required.",
  }),
});

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface EditFlashcardDialogProps {
  flashcard: Flashcard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFlashcardUpdated?: () => void;
}

export function EditFlashcardDialog({ flashcard, open, onOpenChange, onFlashcardUpdated }: EditFlashcardDialogProps) {
  const [loading, setLoading] = useState(false);
  const tCommon = useTranslations("Common");
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: flashcard.question,
      answer: flashcard.answer,
    },
  });

  // Reset form when flashcard changes or dialog opens
  useEffect(() => {
    if (open) {
      reset({
        question: flashcard.question,
        answer: flashcard.answer,
      });
    }
  }, [flashcard, open, reset]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("question", values.question);
      formData.append("answer", values.answer);

      const result = await updateFlashcard(flashcard.id, formData);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Flashcard updated successfully!");
      onOpenChange(false);
      reset();
      if (onFlashcardUpdated) {
        onFlashcardUpdated();
      }
    } catch (error: any) {
      toast.error(error.message || "Error updating flashcard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
          <DialogDescription>
            Update the question and answer for this flashcard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question">
                Question
              </Label>
              <Textarea
                id="question"
                placeholder="Enter the question..."
                {...register("question")}
                disabled={loading}
                className="min-h-[100px]"
              />
              {errors.question && (
                <p className="text-sm text-destructive">
                  {errors.question.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="answer">
                Answer
              </Label>
              <Textarea
                id="answer"
                placeholder="Enter the answer..."
                {...register("answer")}
                disabled={loading}
                className="min-h-[100px]"
              />
              {errors.answer && (
                <p className="text-sm text-destructive">
                  {errors.answer.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? tCommon("loading") : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

