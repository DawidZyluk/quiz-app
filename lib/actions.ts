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

export async function updateQuestion(questionId: string, data: QuestionData) {
  const supabase = await createClient();
  const { question_text, question_type, quiz_id, answers } = data;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify ownership through quiz -> topic
  const { data: question, error: fetchError } = await supabase
    .from("questions")
    .select("quiz_id, quizzes!inner(topic_id, topics!inner(user_id))")
    .eq("id", questionId)
    .single();

  if (fetchError || !question) {
    return { error: "Question not found" };
  }

  // @ts-ignore
  if (question.quizzes.topics.user_id !== user.id) {
    return { error: "Unauthorized" };
  }

  // Update question
  const { error: updateError } = await supabase
    .from("questions")
    .update({
      question_text,
      question_type,
    })
    .eq("id", questionId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Delete old answers and insert new ones
  await supabase.from("answers").delete().eq("question_id", questionId);

  const answersToInsert = answers.map((ans) => ({
    question_id: questionId,
    answer_text: ans.answer_text,
    is_correct: ans.is_correct,
  }));

  const { error: answersError } = await supabase
    .from("answers")
    .insert(answersToInsert);

  if (answersError) {
    return { error: answersError.message };
  }

  revalidatePath(`/dashboard/quiz/${quiz_id}`);
  revalidatePath(`/dashboard/quiz/${quiz_id}/questions`);
  return { success: true };
}

export async function deleteQuestion(questionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get question to check ownership and get quiz_id
  const { data: question, error: fetchError } = await supabase
    .from("questions")
    .select("quiz_id, quizzes!inner(topic_id, topics!inner(user_id))")
    .eq("id", questionId)
    .single();

  if (fetchError || !question) {
    return { error: "Question not found" };
  }

  // @ts-ignore
  if (question.quizzes.topics.user_id !== user.id) {
    return { error: "Unauthorized" };
  }

  // @ts-ignore
  const quizId = question.quiz_id;

  // Delete question (cascade will handle related answers and progress)
  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/quiz/${quizId}`);
  revalidatePath(`/dashboard/quiz/${quizId}/questions`);
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

  // First, try to get current progress with counts
  let currentRemembered = 0;
  let currentForgotten = 0;
  let hasCountColumns = true;

  const { data: currentProgress, error: fetchError } = await supabase
    .from("user_flashcard_progress")
    .select("remembered_count, forgotten_count")
    .eq("user_id", user.id)
    .eq("flashcard_id", flashcardId)
    .maybeSingle();

  // Check if columns exist - if error is about column, they don't exist
  if (fetchError) {
    if (fetchError.code === '42703' || fetchError.message?.includes('column')) {
      hasCountColumns = false;
    } else if (fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine
      console.warn("Warning fetching progress:", fetchError);
    }
  } else if (currentProgress) {
    currentRemembered = currentProgress.remembered_count ?? 0;
    currentForgotten = currentProgress.forgotten_count ?? 0;
  }

  // Calculate counts
  const rememberedCount = currentRemembered + (status === 'remembered' ? 1 : 0);
  const forgottenCount = currentForgotten + (status === 'forgotten' ? 1 : 0);

  // Build base upsert data
  const baseData = {
    user_id: user.id,
    flashcard_id: flashcardId,
    status,
    last_reviewed_at: new Date().toISOString(),
  };

  // Try with counts first if columns exist
  if (hasCountColumns) {
    const { error } = await supabase
      .from("user_flashcard_progress")
      .upsert(
        {
          ...baseData,
          remembered_count: rememberedCount,
          forgotten_count: forgottenCount,
        },
        { onConflict: "user_id, flashcard_id" }
      );

    if (error) {
      // If it's a column error, retry without counts
      if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('remembered_count') || error.message?.includes('forgotten_count')) {
        hasCountColumns = false;
      } else {
        return { error: error.message };
      }
    } else {
      return { success: true };
    }
  }

  // Fallback: upsert without count columns
  const { error } = await supabase
    .from("user_flashcard_progress")
    .upsert(
      baseData,
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

export async function saveQuizProgress(questionId: string, isCorrect: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("user_quiz_progress")
    .insert({
      user_id: user.id,
      question_id: questionId,
      is_correct: isCorrect,
    });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function resetQuizProgress(quizId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Find all questions in the quiz
  const { data: questions, error: fetchError } = await supabase
    .from("questions")
    .select("id")
    .eq("quiz_id", quizId);

  if (fetchError) {
    return { error: fetchError.message };
  }

  const questionIds = questions.map((q) => q.id);

  if (questionIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("user_quiz_progress")
      .delete()
      .eq("user_id", user.id)
      .in("question_id", questionIds);

    if (deleteError) {
      return { error: deleteError.message };
    }
  }

  revalidatePath(`/dashboard/quiz/${quizId}`);
  return { success: true };
}

export async function updateQuiz(quizId: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify quiz ownership through topic
  const { data: quiz, error: fetchError } = await supabase
    .from("quizzes")
    .select("topic_id, topics!inner(user_id)")
    .eq("id", quizId)
    .single();

  if (fetchError || !quiz) {
    return { error: "Quiz not found" };
  }

  // @ts-ignore
  if (quiz.topics.user_id !== user.id) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("quizzes")
    .update({
      title,
      description: description || null,
    })
    .eq("id", quizId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/topic/${quiz.topic_id}`);
  revalidatePath(`/dashboard/quiz/${quizId}`);
  return { success: true };
}

export async function deleteQuiz(quizId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify quiz ownership through topic
  const { data: quiz, error: fetchError } = await supabase
    .from("quizzes")
    .select("topic_id, topics!inner(user_id)")
    .eq("id", quizId)
    .single();

  if (fetchError || !quiz) {
    return { error: "Quiz not found" };
  }

  // @ts-ignore
  if (quiz.topics.user_id !== user.id) {
    return { error: "Unauthorized" };
  }

  const topicId = quiz.topic_id;

  // Delete quiz (cascade will handle related questions, answers, and progress)
  const { error } = await supabase
    .from("quizzes")
    .delete()
    .eq("id", quizId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/topic/${topicId}`);
  return { success: true };
}

export async function resetFlashcardProgress(deckId: string) {
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

  revalidatePath(`/dashboard/deck/${deckId}/flashcards`);
  return { success: true };
}

export async function updateDeck(deckId: string, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify deck ownership through topic
  const { data: deck, error: fetchError } = await supabase
    .from("flashcard_decks")
    .select("topic_id, topics!inner(user_id)")
    .eq("id", deckId)
    .single();

  if (fetchError || !deck) {
    return { error: "Deck not found" };
  }

  // @ts-ignore
  if (deck.topics.user_id !== user.id) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("flashcard_decks")
    .update({
      name,
      description: description || null,
    })
    .eq("id", deckId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/topic/${deck.topic_id}`);
  revalidatePath(`/dashboard/deck/${deckId}`);
  return { success: true };
}

export async function deleteDeck(deckId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get deck to check ownership and get topic_id
  const { data: deck, error: fetchError } = await supabase
    .from("flashcard_decks")
    .select("topic_id, topics!inner(user_id)")
    .eq("id", deckId)
    .single();

  if (fetchError || !deck) {
    return { error: "Deck not found" };
  }

  // @ts-ignore
  if (deck.topics.user_id !== user.id) {
    return { error: "Unauthorized" };
  }

  const topicId = deck.topic_id;

  // Delete deck (cascade will handle related flashcards and progress)
  const { error } = await supabase
    .from("flashcard_decks")
    .delete()
    .eq("id", deckId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/topic/${topicId}`);
  return { success: true };
}

export async function updateFlashcard(flashcardId: string, formData: FormData) {
  const supabase = await createClient();
  const question = formData.get("question") as string;
  const answer = formData.get("answer") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify flashcard ownership through deck -> topic
  const { data: flashcard, error: fetchError } = await supabase
    .from("flashcards")
    .select("deck_id, flashcard_decks!inner(topic_id, topics!inner(user_id))")
    .eq("id", flashcardId)
    .single();

  if (fetchError || !flashcard) {
    return { error: "Flashcard not found" };
  }

  // @ts-ignore
  if (flashcard.flashcard_decks.topics.user_id !== user.id) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("flashcards")
    .update({
      question,
      answer,
    })
    .eq("id", flashcardId);

  if (error) {
    return { error: error.message };
  }

  // @ts-ignore
  const deckId = flashcard.deck_id;
  revalidatePath(`/dashboard/deck/${deckId}`);
  revalidatePath(`/dashboard/deck/${deckId}/flashcards`);
  return { success: true };
}

export async function deleteFlashcard(flashcardId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get flashcard to check ownership and get deck_id
  const { data: flashcard, error: fetchError } = await supabase
    .from("flashcards")
    .select("deck_id, flashcard_decks!inner(topic_id, topics!inner(user_id))")
    .eq("id", flashcardId)
    .single();

  if (fetchError || !flashcard) {
    return { error: "Flashcard not found" };
  }

  // @ts-ignore
  if (flashcard.flashcard_decks.topics.user_id !== user.id) {
    return { error: "Unauthorized" };
  }

  // @ts-ignore
  const deckId = flashcard.deck_id;

  // Delete flashcard (cascade will handle related progress)
  const { error } = await supabase
    .from("flashcards")
    .delete()
    .eq("id", flashcardId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/deck/${deckId}`);
  revalidatePath(`/dashboard/deck/${deckId}/flashcards`);
  return { success: true };
}

export async function updateTopic(topicId: string, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const imageFile = formData.get("image") as File | null;
  let image_url = formData.get("image_url") as string | null;
  const removeImage = formData.get("remove_image") === "true";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify topic ownership
  const { data: topic, error: fetchError } = await supabase
    .from("topics")
    .select("image_url, user_id")
    .eq("id", topicId)
    .single();

  if (fetchError || !topic) {
    return { error: "Topic not found" };
  }

  if (topic.user_id !== user.id) {
    return { error: "Unauthorized" };
  }

  // Handle file upload if a file is provided
  if (imageFile && imageFile.size > 0) {
    // Delete old image if it exists and is in storage
    if (topic.image_url && topic.image_url.includes('/storage/v1/object/public/topics/')) {
      const oldFileName = topic.image_url.split('/topics/')[1];
      if (oldFileName) {
        await supabase.storage.from('topics').remove([oldFileName]);
      }
    }

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
  } else if (removeImage) {
    // Delete old image from storage if it exists
    if (topic.image_url && topic.image_url.includes('/storage/v1/object/public/topics/')) {
      const oldFileName = topic.image_url.split('/topics/')[1];
      if (oldFileName) {
        await supabase.storage.from('topics').remove([oldFileName]);
      }
    }
    image_url = null;
  } else if (!image_url) {
    // Keep existing image_url if no new image provided
    image_url = topic.image_url;
  }

  const { error } = await supabase
    .from("topics")
    .update({
      name,
      image_url,
    })
    .eq("id", topicId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTopic(topicId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get topic to check ownership and get image_url
  const { data: topic, error: fetchError } = await supabase
    .from("topics")
    .select("image_url, user_id")
    .eq("id", topicId)
    .single();

  if (fetchError || !topic) {
    return { error: "Topic not found" };
  }

  if (topic.user_id !== user.id) {
    return { error: "Unauthorized" };
  }

  // Delete image from storage if it exists
  if (topic.image_url && topic.image_url.includes('/storage/v1/object/public/topics/')) {
    const fileName = topic.image_url.split('/topics/')[1];
    if (fileName) {
      await supabase.storage.from('topics').remove([fileName]);
    }
  }

  // Delete topic (cascade will handle related quizzes, decks, etc.)
  const { error } = await supabase
    .from("topics")
    .delete()
    .eq("id", topicId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}