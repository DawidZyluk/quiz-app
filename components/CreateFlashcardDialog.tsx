"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createFlashcard } from "@/lib/actions";

const formSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});

interface CreateFlashcardDialogProps {
  deckId: string;
  onFlashcardCreated?: () => void;
}

export function CreateFlashcardDialog({ deckId, onFlashcardCreated }: CreateFlashcardDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      answer: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("question", values.question);
      formData.append("answer", values.answer);
      formData.append("deck_id", deckId);

      const result = await createFlashcard(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Flashcard created successfully!");
      setOpen(false);
      reset();
      if (onFlashcardCreated) {
        onFlashcardCreated();
      }
    } catch (error: any) {
      toast.error(error.message || "Error creating flashcard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Flashcard
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Flashcard</DialogTitle>
          <DialogDescription>
            Create a new flashcard for this deck.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question">
                Question (Front)
              </Label>
              <Textarea
                id="question"
                placeholder="Enter the question..."
                {...register("question")}
                disabled={loading}
              />
              {errors.question && (
                <p className="text-sm text-destructive">
                  {errors.question.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="answer">
                Answer (Back)
              </Label>
              <Textarea
                id="answer"
                placeholder="Enter the answer..."
                {...register("answer")}
                disabled={loading}
              />
              {errors.answer && (
                <p className="text-sm text-destructive">
                  {errors.answer.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Flashcard"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

