
import { createClient } from "@/lib/supabase/client";

// This is a client-side utility to seed data for testing purposes
export async function seedData() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("Must be logged in to seed data");
    return;
  }

  try {
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
    
    alert("Seed data created successfully! Refresh the dashboard.");
    window.location.href = "/dashboard";

  } catch (error: any) {
    console.error("Error seeding data:", error);
    alert("Error seeding data: " + error.message);
  }
}

