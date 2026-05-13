export const STUDY_PLAN_PROMPT = `You are an expert academic tutor and study strategist.
Given the following syllabus/topics, create an optimized study plan that
prioritizes high-weight and frequently-tested topics first. Allocate time
proportionally based on topic complexity and importance. The student has
{time} to study at {difficulty} depth. 

Return ONLY a valid JSON object in the following format:
{
  "topics": [
    {
      "id": "unique-string-id",
      "title": "Topic Name",
      "priority": "High" | "Medium" | "Low",
      "timeAllocation": "e.g., 30m",
      "subtopics": ["Subtopic 1", "Subtopic 2"]
    }
  ]
}`;

export const SUMMARY_PROMPT = `You are an expert educator. Summarize the following topic
in a concise, exam-focused format. Use bullet points, highlight key terms
in **bold**, include important formulas/dates/definitions. Structure with
clear headers. Focus on what's most likely to be tested.

Topic: {topic}
Difficulty level: {difficulty}

Return ONLY a valid JSON object in the following format:
{
  "summary": "Markdown string containing the structured summary"
}`;

export const FLASHCARD_PROMPT = `Generate {count} flashcards for active recall practice
on the topic: {topic}. Each card should test one specific concept. Front
should be a clear question or term. Back should be a concise answer.
Include a mix of definition, application, and comparison cards.

Return ONLY a valid JSON object in the following format:
{
  "flashcards": [
    {
      "id": "unique-string-id",
      "front": "Question or Term",
      "back": "Concise Answer"
    }
  ]
}`;

export const QUIZ_PROMPT = `Generate {count} multiple choice questions on: {topic}.
Each question should have exactly 4 options. Include one clearly correct
answer. Make distractors plausible but distinguishable. After each correct
answer, provide a one-sentence explanation.

Return ONLY a valid JSON object in the following format:
{
  "quiz": [
    {
      "id": "unique-string-id",
      "question": "The question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": "Exact string of the correct option from the options array",
      "explanation": "One-sentence explanation of why it's correct."
    }
  ]
}`;

export const ELI5_PROMPT = `Explain {topic} as if teaching a 5-year-old. Use everyday
analogies, simple language, and relatable examples. No jargon. Make it
memorable and fun. Include a 'Remember it like this:' mnemonic at the end.

Return ONLY a valid JSON object in the following format:
{
  "explanation": "Markdown string of the ELI5 explanation including the mnemonic"
}`;

export const DEEPER_EXPLANATION_PROMPT = `Provide a more detailed breakdown and explanation for the following topic and summary. 

Topic: {topic}
Current Summary: {currentSummary}

Return ONLY a valid JSON object in the following format:
{
  "detailedExplanation": "Markdown string of the deeper explanation"
}`;
