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
import { createDeck } from "@/lib/actions";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
});

interface CreateDeckDialogProps {
  topicId: string;
  onDeckCreated?: () => void;
}

export function CreateDeckDialog({ topicId, onDeckCreated }: CreateDeckDialogProps) {
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
      name: "",
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      if (values.description) {
        formData.append("description", values.description);
      }
      formData.append("topic_id", topicId);

      const result = await createDeck(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Deck created successfully!");
      setOpen(false);
      reset();
      if (onDeckCreated) {
        onDeckCreated();
      }
    } catch (error: any) {
      toast.error(error.message || "Error creating deck");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Deck
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Deck</DialogTitle>
          <DialogDescription>
            Create a collection of flashcards for this topic.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Chapter 1 Vocabulary"
                {...register("name")}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="What is this deck about?"
                {...register("description")}
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Deck"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

