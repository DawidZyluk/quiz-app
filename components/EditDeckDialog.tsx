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
import { updateDeck } from "@/lib/actions";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
});

interface Deck {
  id: string;
  name: string;
  description: string | null;
}

interface EditDeckDialogProps {
  deck: Deck;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeckUpdated?: () => void;
}

export function EditDeckDialog({ deck, open, onOpenChange, onDeckUpdated }: EditDeckDialogProps) {
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
      name: deck.name,
      description: deck.description || "",
    },
  });

  // Reset form when deck changes or dialog opens
  useEffect(() => {
    if (open) {
      reset({
        name: deck.name,
        description: deck.description || "",
      });
    }
  }, [deck, open, reset]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      if (values.description) {
        formData.append("description", values.description);
      }

      const result = await updateDeck(deck.id, formData);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Deck updated successfully!");
      onOpenChange(false);
      reset();
      if (onDeckUpdated) {
        onDeckUpdated();
      }
    } catch (error: any) {
      toast.error(error.message || "Error updating deck");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Deck</DialogTitle>
          <DialogDescription>
            Update the deck name and description.
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

