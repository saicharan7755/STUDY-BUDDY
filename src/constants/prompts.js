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

export const SUMMARY_PROMPT = `You are an expert educator creating study materials for students.
Analyze the following topic and create a comprehensive study summary.

Topic: {topic}

Return ONLY a valid JSON object in the following format:
{
  "summary": {
    "keyConcepts": ["List of 5-10 main concepts covered"],
    "mainTopics": ["List of 3-5 primary topics"],
    "importantTerms": [
      {
        "term": "Term name",
        "definition": "Clear, concise definition"
      }
    ],
    "overview": "2-3 sentence overview of the entire topic"
  }
}`;

export const FLASHCARD_PROMPT = `You are an expert educator creating high-quality flashcards for active recall practice.
Generate {count} flashcards on the topic: {topic}. Each flashcard should test one specific concept with clear, unambiguous questions.

Requirements:
- Mix of difficulty levels: easy (basic recall), medium (understanding), hard (application/analysis)
- Include topic tags for categorization
- Front should be a clear, specific question or term
- Back should be a concise, accurate answer
- Ensure variety: definitions, examples, comparisons, applications

Return ONLY a valid JSON object in the following format:
{
  "flashcards": [
    {
      "id": "unique-string-id",
      "front": "Clear, specific question or term",
      "back": "Concise, accurate answer",
      "difficulty": "easy" | "medium" | "hard",
      "tags": ["topic-tag-1", "topic-tag-2"]
    }
  ]
}`;

export const QUIZ_PROMPT = `You are an expert educator creating challenging multiple-choice questions.
Generate {count} multiple-choice questions on the topic: {topic}.

Requirements:
- Each question must have exactly 4 options (A, B, C, D)
- One clearly correct answer
- Three plausible but incorrect distractors
- Include a brief explanation for why the correct answer is right
- Questions should test understanding, not just memorization

Return ONLY a valid JSON object in the following format:
{
  "quiz": [
    {
      "id": "unique-string-id",
      "question": "Clear, specific question text ending with a question mark?",
      "options": ["A) Option text", "B) Option text", "C) Option text", "D) Option text"],
      "correct": "A) Exact string of the correct option from the options array",
      "explanation": "Brief explanation of why this answer is correct and why others are wrong."
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

// Re-export the parseGeminiResponse utility from lib
export { parseGeminiResponse } from '../../lib/prompts.js';
