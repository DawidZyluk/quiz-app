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
