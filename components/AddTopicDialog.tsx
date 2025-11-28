"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Plus, Upload, X } from "lucide-react";

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
import { createTopic } from "@/lib/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  image_url: z.string().url({
    message: "Please enter a valid URL.",
  }).optional().or(z.literal("")),
  image_file: z.any().optional(),
});

interface AddTopicDialogProps {
  onTopicAdded?: () => void;
}

export function AddTopicDialog({ onTopicAdded }: AddTopicDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageMode, setImageMode] = useState<"url" | "file">("url");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const tCommon = useTranslations("Common");
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      image_url: "",
      image_file: undefined,
    },
  });

  const watchedImageUrl = watch("image_url");
  const watchedImageFile = watch("image_file");

  useEffect(() => {
    if (imageMode === "url" && watchedImageUrl) {
      try {
        z.string().url().parse(watchedImageUrl);
        setPreviewUrl(watchedImageUrl);
      } catch {
        setPreviewUrl(null);
      }
    } else if (imageMode === "file" && watchedImageFile?.[0]) {
      const file = watchedImageFile[0];
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [watchedImageUrl, watchedImageFile, imageMode]);

  const fileRef = register("image_file");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      
      if (imageMode === "url" && values.image_url) {
        formData.append("image_url", values.image_url);
      } else if (imageMode === "file" && values.image_file?.[0]) {
        formData.append("image", values.image_file[0]);
      }

      const result = await createTopic(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Topic created successfully!");
      setOpen(false);
      reset();
      setPreviewUrl(null);
      if (onTopicAdded) {
        onTopicAdded();
      }
    } catch (error: any) {
      toast.error(error.message || "Error creating topic");
    } finally {
      setLoading(false);
    }
  }

  const handleRemoveFile = () => {
    setValue("image_file", undefined);
    setPreviewUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="h-[200px] w-full border-dashed flex flex-col gap-4 hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <span className="text-lg font-medium">Add Topic</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Topic</DialogTitle>
          <DialogDescription>
            Add a new topic to organize your quizzes.
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
                placeholder="e.g. Mathematics, History"
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
              <Label>Cover Image</Label>
              <Tabs value={imageMode} onValueChange={(v) => setImageMode(v as "url" | "file")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">Image URL</TabsTrigger>
                  <TabsTrigger value="file">Upload File</TabsTrigger>
                </TabsList>
                
                {previewUrl && (
                  <div className="mt-4 relative aspect-video w-full rounded-lg overflow-hidden border bg-muted">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    {imageMode === "file" && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}

                <TabsContent value="url" className="mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="image_url" className="sr-only">
                      Image URL
                    </Label>
                    <Input
                      id="image_url"
                      placeholder="https://example.com/image.jpg"
                      {...register("image_url")}
                      disabled={loading}
                    />
                    {errors.image_url && (
                      <p className="text-sm text-destructive">
                        {errors.image_url.message}
                      </p>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="file" className="mt-4">
                   <div className="space-y-2">
                    <Label htmlFor="image_file" className="sr-only">
                      Upload File
                    </Label>
                    {!previewUrl ? (
                      <div className="flex items-center justify-center w-full">
                          <label htmlFor="image_file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                  <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                                  <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF</p>
                              </div>
                              <input 
                                  id="image_file" 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  {...fileRef}
                                  onChange={(e) => {
                                      fileRef.onChange(e);
                                  }}
                              />
                          </label>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => document.getElementById('image_file')?.click()}
                        >
                          Change Image
                        </Button>
                        <input 
                            id="image_file" 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            {...fileRef}
                            onChange={(e) => {
                                fileRef.onChange(e);
                            }}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? tCommon("loading") : tCommon("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
