"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateQuestion } from "@/lib/actions";

const formSchema = z.object({
  question_text: z.string().min(1, "Question is required"),
  question_type: z.enum(["single_choice", "multiple_choice"]),
  answers: z.array(z.object({
    answer_text: z.string().min(1, "Answer text is required"),
    is_correct: z.boolean(),
  })).min(2, "At least 2 answers are required"),
}).refine((data) => {
  const correctCount = data.answers.filter(a => a.is_correct).length;
  if (data.question_type === "single_choice") {
    return correctCount === 1;
  }
  return correctCount >= 1;
}, {
  message: "Single choice must have exactly one correct answer, multiple choice must have at least one.",
  path: ["answers"],
});

interface Question {
  id: string;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice';
  quiz_id: string;
  answers: {
    id: string;
    answer_text: string;
    is_correct: boolean;
  }[];
}

interface EditQuestionDialogProps {
  question: Question;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuestionUpdated?: () => void;
}

export function EditQuestionDialog({ question, open, onOpenChange, onQuestionUpdated }: EditQuestionDialogProps) {
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question_text: question.question_text,
      question_type: question.question_type,
      answers: question.answers.map(a => ({
        answer_text: a.answer_text,
        is_correct: a.is_correct,
      })),
    },
  });

  // Reset form when question changes or dialog opens
  useEffect(() => {
    if (open) {
      reset({
        question_text: question.question_text,
        question_type: question.question_type,
        answers: question.answers.map(a => ({
          answer_text: a.answer_text,
          is_correct: a.is_correct,
        })),
      });
    }
  }, [question, open, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "answers",
  });

  const questionType = watch("question_type");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const result = await updateQuestion(question.id, {
        question_text: values.question_text,
        question_type: values.question_type,
        quiz_id: question.quiz_id,
        answers: values.answers,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Question updated successfully!");
      onOpenChange(false);
      reset();
      if (onQuestionUpdated) {
        onQuestionUpdated();
      }
    } catch (error: any) {
      toast.error(error.message || "Error updating question");
    } finally {
      setLoading(false);
    }
  }

  const handleCorrectAnswerChange = (index: number) => {
    if (questionType === "single_choice") {
      // Reset all other correct answers
      const currentAnswers = watch("answers");
      const newAnswers = currentAnswers.map((ans, i) => ({
        ...ans,
        is_correct: i === index,
      }));
      setValue("answers", newAnswers);
    } else {
        const currentVal = watch(`answers.${index}.is_correct`);
        setValue(`answers.${index}.is_correct`, !currentVal);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
          <DialogDescription>
            Update the question and its answers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question_type">Question Type</Label>
              <Select
                onValueChange={(val) => setValue("question_type", val as "single_choice" | "multiple_choice")}
                value={questionType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_choice">Single Choice</SelectItem>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="question_text">Question</Label>
              <Textarea
                id="question_text"
                placeholder="Enter your question..."
                {...register("question_text")}
              />
              {errors.question_text && (
                <p className="text-sm text-destructive">{errors.question_text.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Answers</Label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => handleCorrectAnswerChange(index)}
                      className={`rounded-full transition-colors ${
                        watch(`answers.${index}.is_correct`)
                          ? "text-green-600"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      {watch(`answers.${index}.is_correct`) ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder={`Answer ${index + 1}`}
                      {...register(`answers.${index}.answer_text`)}
                      className={errors.answers?.[index]?.answer_text ? "border-destructive" : ""}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 2}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ answer_text: "", is_correct: false })}
                className="mt-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Answer
              </Button>
              {errors.answers && (
                <p className="text-sm text-destructive mt-2">
                  {errors.answers.message || errors.answers.root?.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

