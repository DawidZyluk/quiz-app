
import { createClient } from "@/lib/supabase/client";

// Delete all user data before seeding
async function deleteAllUserData(supabase: ReturnType<typeof createClient>, userId: string) {
  // Get all user topics first
  const { data: userTopics } = await supabase
    .from("topics")
    .select("id, image_url")
    .eq("user_id", userId);
  
  if (!userTopics || userTopics.length === 0) {
    console.log("No user data to delete");
    return;
  }
  
  const topicIds = userTopics.map(t => t.id);
  
  // 1. Get all quizzes for user's topics
  const { data: userQuizzes } = await supabase
    .from("quizzes")
    .select("id")
    .in("topic_id", topicIds);
  
  const quizIds = userQuizzes?.map(q => q.id) || [];
  
  // 2. Get all questions for user's quizzes
  const { data: userQuestions } = await supabase
    .from("questions")
    .select("id")
    .in("quiz_id", quizIds);
  
  const questionIds = userQuestions?.map(q => q.id) || [];
  
  // 3. Get all decks for user's topics
  const { data: userDecks } = await supabase
    .from("flashcard_decks")
    .select("id")
    .in("topic_id", topicIds);
  
  const deckIds = userDecks?.map(d => d.id) || [];
  
  // 4. Get all flashcards for user's decks
  const { data: userFlashcards } = await supabase
    .from("flashcards")
    .select("id")
    .in("deck_id", deckIds);
  
  const flashcardIds = userFlashcards?.map(f => f.id) || [];
  
  // Delete in order to respect foreign key constraints
  
  // Delete progress first
  if (questionIds.length > 0) {
    await supabase
      .from("user_quiz_progress")
      .delete()
      .eq("user_id", userId)
      .in("question_id", questionIds);
  }
  
  if (flashcardIds.length > 0) {
    await supabase
      .from("user_flashcard_progress")
      .delete()
      .eq("user_id", userId)
      .in("flashcard_id", flashcardIds);
  }
  
  // Delete answers
  if (questionIds.length > 0) {
    await supabase
      .from("answers")
      .delete()
      .in("question_id", questionIds);
  }
  
  // Delete questions
  if (quizIds.length > 0) {
    await supabase
      .from("questions")
      .delete()
      .in("quiz_id", quizIds);
  }
  
  // Delete quizzes
  if (topicIds.length > 0) {
    await supabase
      .from("quizzes")
      .delete()
      .in("topic_id", topicIds);
  }
  
  // Delete flashcards
  if (deckIds.length > 0) {
    await supabase
      .from("flashcards")
      .delete()
      .in("deck_id", deckIds);
  }
  
  // Delete flashcard decks
  if (topicIds.length > 0) {
    await supabase
      .from("flashcard_decks")
      .delete()
      .in("topic_id", topicIds);
  }
  
  // Delete topic images from storage
  for (const topic of userTopics) {
    if (topic.image_url && topic.image_url.includes('/storage/v1/object/public/topics/')) {
      const fileName = topic.image_url.split('/topics/')[1];
      if (fileName) {
        await supabase.storage.from('topics').remove([fileName]);
      }
    }
  }
  
  // Delete topics (last, as everything depends on it)
  await supabase
    .from("topics")
    .delete()
    .eq("user_id", userId);
  
  console.log("All user data deleted");
}

// This is a client-side utility to seed data for testing purposes
export async function seedData() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("Must be logged in to seed data");
    return;
  }

  try {
    // Delete all existing user data first
    await deleteAllUserData(supabase, user.id);
    
    // Now create seed data
    // 1. Create a Topic
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .insert({
        name: "English Vocabulary",
        user_id: user.id,
        // random image from unsplash
        image_url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
      })
      .select()
      .single();

    if (topicError) throw topicError;
    console.log("Created topic:", topic.name);

    // 2. Create a Deck
    const { data: deck, error: deckError } = await supabase
      .from("flashcard_decks")
      .insert({
        name: "Common Verbs",
        description: "100 most used verbs in English",
        topic_id: topic.id
      })
      .select()
      .single();

    if (deckError) throw deckError;
    console.log("Created deck:", deck.name);

    // 3. Create Flashcards
    const flashcardsData = [
      { question: "To be", answer: "Być" },
      { question: "To have", answer: "Mieć" },
      { question: "To do", answer: "Robić" },
      { question: "To say", answer: "Mówić" },
      { question: "To go", answer: "Iść" },
      { question: "To get", answer: "Dostać" },
      { question: "To make", answer: "Robić (tworzyć)" },
      { question: "To know", answer: "Wiedzieć" },
      { question: "To think", answer: "Myśleć" },
      { question: "To take", answer: "Brać" },
    ];

    const flashcards = flashcardsData.map(f => ({
      ...f,
      deck_id: deck.id
    }));

    const { error: flashcardsError } = await supabase
      .from("flashcards")
      .insert(flashcards);

    if (flashcardsError) throw flashcardsError;
    console.log(`Created ${flashcards.length} flashcards`);

    // 3.5. Add some progress data to simulate learning in progress
    const { data: insertedFlashcards } = await supabase
      .from("flashcards")
      .select("id")
      .eq("deck_id", deck.id)
      .order("created_at", { ascending: true });

    if (insertedFlashcards && insertedFlashcards.length > 0) {
      // Add progress data for all flashcards to simulate learning in progress
      for (let i = 0; i < insertedFlashcards.length; i++) {
        const flashcard = insertedFlashcards[i];
        
        // Different scenarios for variety
        let status: 'remembered' | 'forgotten';
        let rememberedCount: number;
        let forgottenCount: number;
        
        if (i < 3) {
          // First 3 - mostly remembered
          status = 'remembered';
          rememberedCount = 2 + i; // 2, 3, 4
          forgottenCount = 1;
        } else if (i < 6) {
          // Next 3 - mostly forgotten
          status = 'forgotten';
          rememberedCount = 1;
          forgottenCount = 2 + (i - 3); // 2, 3, 4
        } else if (i < 8) {
          // Next 2 - mixed, but remembered
          status = 'remembered';
          rememberedCount = 3 + (i - 6); // 3, 4
          forgottenCount = 2;
        } else {
          // Last ones - mixed, but forgotten
          status = 'forgotten';
          rememberedCount = 1;
          forgottenCount = 2 + (i - 8); // 2, 3
        }
        
        // Try to upsert with count columns first
        const baseData = {
          user_id: user.id,
          flashcard_id: flashcard.id,
          status,
          last_reviewed_at: new Date(Date.now() - (i * 86400000)).toISOString(),
        };

        const { error: progressError } = await supabase
          .from("user_flashcard_progress")
          .upsert({
            ...baseData,
            remembered_count: rememberedCount,
            forgotten_count: forgottenCount,
          }, { onConflict: "user_id, flashcard_id" });
        
        // If error is about missing columns, retry without them
        if (progressError) {
          const isColumnError = progressError.code === '42703' || 
                               progressError.message?.toLowerCase().includes('column') ||
                               progressError.message?.includes('remembered_count') ||
                               progressError.message?.includes('forgotten_count');
          
          if (isColumnError) {
            console.warn(`Count columns don't exist, using basic progress for flashcard ${flashcard.id}`);
            // Retry without count columns
            const { error: retryError } = await supabase
              .from("user_flashcard_progress")
              .upsert(baseData, { onConflict: "user_id, flashcard_id" });
            
            if (retryError) {
              console.error(`Error adding progress for flashcard ${flashcard.id}:`, retryError);
            } else {
              console.log(`Added basic progress for flashcard ${flashcard.id} (count columns not available)`);
            }
          } else {
            console.error(`Error adding progress for flashcard ${flashcard.id}:`, progressError);
          }
        } else {
          console.log(`Added progress for flashcard ${flashcard.id}: remembered=${rememberedCount}, forgotten=${forgottenCount}`);
        }
      }
    }

    console.log("Added progress data to flashcards");

    // 4. Create a Quiz
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        title: "Basic Grammar",
        description: "Test your knowledge of basic English grammar rules",
        topic_id: topic.id
      })
      .select()
      .single();

    if (quizError) throw quizError;
    console.log("Created quiz:", quiz.title);

    // 5. Create Questions for Quiz
    // Question 1
    const { data: q1, error: q1Error } = await supabase
      .from("questions")
      .insert({
        quiz_id: quiz.id,
        question_text: "Which sentence is correct?",
        question_type: "single_choice"
      })
      .select()
      .single();
    
    if (q1Error) throw q1Error;

    await supabase.from("answers").insert([
      { question_id: q1.id, answer_text: "She don't like apples.", is_correct: false },
      { question_id: q1.id, answer_text: "She doesn't likes apples.", is_correct: false },
      { question_id: q1.id, answer_text: "She doesn't like apples.", is_correct: true },
      { question_id: q1.id, answer_text: "She not like apples.", is_correct: false },
    ]);

    // Question 2
    const { data: q2, error: q2Error } = await supabase
      .from("questions")
      .insert({
        quiz_id: quiz.id,
        question_text: "Select all plural nouns:",
        question_type: "multiple_choice"
      })
      .select()
      .single();

    if (q2Error) throw q2Error;

    await supabase.from("answers").insert([
      { question_id: q2.id, answer_text: "Cat", is_correct: false },
      { question_id: q2.id, answer_text: "Dogs", is_correct: true },
      { question_id: q2.id, answer_text: "Children", is_correct: true },
      { question_id: q2.id, answer_text: "Mouse", is_correct: false },
    ]);

    console.log("Created quiz questions");
    
    // Redirect will be handled by the caller
    return { success: true };

  } catch (error: any) {
    console.error("Error seeding data:", error);
    throw error;
  }
}

