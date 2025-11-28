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

export async function createQuiz(formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const topic_id = formData.get("topic_id") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("quizzes").insert({
    title,
    description,
    topic_id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/topic/${topic_id}`);
  return { success: true };
}

interface QuestionData {
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice';
  quiz_id: string;
  answers: {
    answer_text: string;
    is_correct: boolean;
  }[];
}

export async function createQuestion(data: QuestionData) {
  const supabase = await createClient();
  const { question_text, question_type, quiz_id, answers } = data;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // 1. Create question
  const { data: question, error: questionError } = await supabase
    .from("questions")
    .insert({
      quiz_id,
      question_text,
      question_type,
    })
    .select()
    .single();

  if (questionError) {
    return { error: questionError.message };
  }

  // 2. Create answers
  const answersToInsert = answers.map((ans) => ({
    question_id: question.id,
    answer_text: ans.answer_text,
    is_correct: ans.is_correct,
  }));

  const { error: answersError } = await supabase
    .from("answers")
    .insert(answersToInsert);

  if (answersError) {
    // Cleanup question if answers fail
    await supabase.from("questions").delete().eq("id", question.id);
    return { error: answersError.message };
  }

  revalidatePath(`/dashboard/quiz/${quiz_id}`);
  return { success: true };
}

export async function updateFlashcardStatus(flashcardId: string, status: 'remembered' | 'forgotten') {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("user_flashcard_progress")
    .upsert(
      {
        user_id: user.id,
        flashcard_id: flashcardId,
        status,
        last_reviewed_at: new Date().toISOString(),
      },
      { onConflict: "user_id, flashcard_id" }
    );

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function resetDeckProgress(deckId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Find all flashcards in the deck
  const { data: flashcards, error: fetchError } = await supabase
    .from("flashcards")
    .select("id")
    .eq("deck_id", deckId);

  if (fetchError) {
    return { error: fetchError.message };
  }

  const flashcardIds = flashcards.map((f) => f.id);

  if (flashcardIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("user_flashcard_progress")
      .delete()
      .eq("user_id", user.id)
      .in("flashcard_id", flashcardIds);

    if (deleteError) {
      return { error: deleteError.message };
    }
  }

  revalidatePath(`/dashboard/deck/${deckId}`);
  return { success: true };
}
