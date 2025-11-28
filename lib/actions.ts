"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTopic(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const imageFile = formData.get("image") as File | null;
  let image_url = formData.get("image_url") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Handle file upload if a file is provided
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('topics')
      .upload(fileName, imageFile);

    if (uploadError) {
      return { error: "Failed to upload image: " + uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('topics')
      .getPublicUrl(fileName);
      
    image_url = publicUrl;
  }

  const { error } = await supabase.from("topics").insert({
    name,
    image_url,
    user_id: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function createDeck(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const topic_id = formData.get("topic_id") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("flashcard_decks").insert({
    name,
    description,
    topic_id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/topic/${topic_id}`);
  return { success: true };
}

export async function createFlashcard(formData: FormData) {
  const supabase = await createClient();
  const question = formData.get("question") as string;
  const answer = formData.get("answer") as string;
  const deck_id = formData.get("deck_id") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("flashcards").insert({
    question,
    answer,
    deck_id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/deck/${deck_id}`);
  return { success: true };
}
