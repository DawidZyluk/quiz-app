"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Upload, X } from "lucide-react";

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
import { updateTopic } from "@/lib/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  image_url: z.string().url({
    message: "Please enter a valid URL.",
  }).optional().or(z.literal("")),
  image_file: z.any().optional(),
  remove_image: z.boolean().optional(),
});

interface Topic {
  id: string;
  name: string;
  image_url: string | null;
}

interface EditTopicDialogProps {
  topic: Topic;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTopicUpdated?: () => void;
}

export function EditTopicDialog({ topic, open, onOpenChange, onTopicUpdated }: EditTopicDialogProps) {
  const [loading, setLoading] = useState(false);
  const [imageMode, setImageMode] = useState<"url" | "file" | "keep">(topic.image_url ? "keep" : "url");
  const [isRemovingImage, setIsRemovingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(topic.image_url || null);
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
      name: topic.name,
      image_url: topic.image_url || "",
      image_file: undefined,
      remove_image: false,
    },
  });

  // Reset form when topic changes or dialog opens
  useEffect(() => {
    if (open) {
      reset({
        name: topic.name,
        image_url: topic.image_url || "",
        image_file: undefined,
        remove_image: false,
      });
      setPreviewUrl(topic.image_url || null);
      setImageMode(topic.image_url ? "keep" : "url");
      setIsRemovingImage(false);
    }
  }, [topic, open, reset]);

  const watchedImageUrl = watch("image_url");
  const watchedImageFile = watch("image_file");

  useEffect(() => {
    if (isRemovingImage) {
      setPreviewUrl(null);
    } else if (imageMode === "url" && watchedImageUrl) {
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
    } else if (imageMode === "keep" && topic.image_url) {
      setPreviewUrl(topic.image_url);
    } else {
      setPreviewUrl(null);
    }
  }, [watchedImageUrl, watchedImageFile, imageMode, topic.image_url, isRemovingImage]);

  const fileRef = register("image_file");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      
      if (isRemovingImage || values.remove_image) {
        formData.append("remove_image", "true");
      } else if (imageMode === "url" && values.image_url) {
        formData.append("image_url", values.image_url);
      } else if (imageMode === "file" && values.image_file?.[0]) {
        formData.append("image", values.image_file[0]);
      }
      // If imageMode is "keep", we don't send anything and the server will keep the existing image

      const result = await updateTopic(topic.id, formData);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Topic updated successfully!");
      onOpenChange(false);
      reset();
      if (onTopicUpdated) {
        onTopicUpdated();
      }
    } catch (error: any) {
      toast.error(error.message || "Error updating topic");
    } finally {
      setLoading(false);
    }
  }

  const handleRemoveFile = () => {
    setValue("image_file", undefined);
    setPreviewUrl(topic.image_url || null);
    setImageMode("keep");
  };

  const handleRemoveImage = () => {
    if (isRemovingImage) {
      // Cancel removal
      setIsRemovingImage(false);
      setPreviewUrl(topic.image_url || null);
      setValue("remove_image", false);
    } else {
      // Start removal
      setIsRemovingImage(true);
      setPreviewUrl(null);
      setValue("remove_image", true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Topic</DialogTitle>
          <DialogDescription>
            Update the topic name and cover image.
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
              <Tabs value={imageMode} onValueChange={(v) => {
                const newMode = v as "url" | "file" | "keep";
                setImageMode(newMode);
                setIsRemovingImage(false);
                if (newMode === "keep") {
                  setPreviewUrl(topic.image_url || null);
                  setValue("remove_image", false);
                }
              }}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="keep">Keep Current</TabsTrigger>
                  <TabsTrigger value="url">Image URL</TabsTrigger>
                  <TabsTrigger value="file">Upload File</TabsTrigger>
                </TabsList>
                
                {previewUrl && !isRemovingImage && (
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

                {isRemovingImage && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">Image will be removed</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setIsRemovingImage(false);
                        setPreviewUrl(topic.image_url || null);
                        setValue("remove_image", false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                <TabsContent value="keep" className="mt-4">
                  {topic.image_url ? (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground text-center py-2">
                        Current image will be kept
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleRemoveImage}
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      No image currently set
                    </div>
                  )}
                </TabsContent>

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
                    {topic.image_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleRemoveImage}
                      >
                        Remove Image
                      </Button>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="file" className="mt-4">
                   <div className="space-y-2">
                    <Label htmlFor="image_file" className="sr-only">
                      Upload File
                    </Label>
                    {!previewUrl || imageMode === "file" ? (
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
                    {topic.image_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleRemoveImage}
                      >
                        Remove Image
                      </Button>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
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

