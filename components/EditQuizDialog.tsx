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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateQuiz } from "@/lib/actions";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
});

interface Quiz {
  id: string;
  title: string;
  description: string | null;
}

interface EditQuizDialogProps {
  quiz: Quiz;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuizUpdated?: () => void;
}

export function EditQuizDialog({ quiz, open, onOpenChange, onQuizUpdated }: EditQuizDialogProps) {
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
      title: quiz.title,
      description: quiz.description || "",
    },
  });

  // Reset form when quiz changes or dialog opens
  useEffect(() => {
    if (open) {
      reset({
        title: quiz.title,
        description: quiz.description || "",
      });
    }
  }, [quiz, open, reset]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      if (values.description) {
        formData.append("description", values.description);
      }

      const result = await updateQuiz(quiz.id, formData);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Quiz updated successfully!");
      onOpenChange(false);
      reset();
      if (onQuizUpdated) {
        onQuizUpdated();
      }
    } catch (error: any) {
      toast.error(error.message || "Error updating quiz");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Quiz</DialogTitle>
          <DialogDescription>
            Update the quiz title and description.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title
              </Label>
              <Input
                id="title"
                placeholder="e.g. Basic Grammar Test"
                {...register("title")}
                disabled={loading}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="What is this quiz about?"
                {...register("description")}
                disabled={loading}
              />
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

