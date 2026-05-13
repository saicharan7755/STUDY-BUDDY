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

export const TRUE_FALSE_PROMPT = `You are an expert educator creating true/false active recall questions.
Generate {count} true/false statements on the topic: {topic}.

Requirements:
- Mix true and false statements
- False statements should be plausible but clearly incorrect
- Include a brief explanation for each answer
- Statements should test understanding, not trivia

Return ONLY a valid JSON object in the following format:
{
  "trueFalse": [
    {
      "id": "unique-string-id",
      "statement": "Clear statement about the topic.",
      "answer": true,
      "explanation": "Brief explanation of why the statement is true or false."
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

/**
 * Safely parses Gemini AI JSON responses and validates structure
 * @param {string} response - Raw response from Gemini AI
 * @param {string} expectedType - Expected type ('flashcards', 'quiz', 'summary', etc.)
 * @returns {Object} Parsed and validated JSON object
 * @throws {Error} If parsing fails or structure is invalid
 */
export const parseGeminiResponse = (response, expectedType) => {
  if (!response || typeof response !== 'string') {
    throw new Error('Invalid response: response must be a non-empty string');
  }

  let jsonString = response.trim();

  // Handle cases where AI adds extra text around JSON
  // Look for JSON object boundaries
  const jsonStart = jsonString.indexOf('{');
  const jsonEnd = jsonString.lastIndexOf('}');

  if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
    throw new Error('Invalid response: no valid JSON object found in response');
  }

  // Extract just the JSON part
  jsonString = jsonString.substring(jsonStart, jsonEnd + 1);

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (parseError) {
    throw new Error(`Failed to parse JSON response: ${parseError.message}`);
  }

  // Validate structure based on expected type
  switch (expectedType) {
    case 'flashcards':
      if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
        throw new Error('Invalid flashcards response: missing or invalid "flashcards" array');
      }

      // Validate each flashcard
      parsed.flashcards.forEach((card, index) => {
        if (!card.id || !card.front || !card.back) {
          throw new Error(
            `Invalid flashcard at index ${index}: missing required fields (id, front, back)`
          );
        }
        if (!['easy', 'medium', 'hard'].includes(card.difficulty)) {
          throw new Error(
            `Invalid flashcard at index ${index}: difficulty must be "easy", "medium", or "hard"`
          );
        }
        if (!Array.isArray(card.tags) || card.tags.length === 0) {
          throw new Error(`Invalid flashcard at index ${index}: tags must be a non-empty array`);
        }
      });
      break;

    case 'quiz':
      if (!parsed.quiz || !Array.isArray(parsed.quiz)) {
        throw new Error('Invalid quiz response: missing or invalid "quiz" array');
      }

      // Validate each question
      parsed.quiz.forEach((question, index) => {
        if (
          !question.id ||
          !question.question ||
          !question.options ||
          !question.correct ||
          !question.explanation
        ) {
          throw new Error(`Invalid quiz question at index ${index}: missing required fields`);
        }
        if (!Array.isArray(question.options) || question.options.length !== 4) {
          throw new Error(
            `Invalid quiz question at index ${index}: options must be an array of exactly 4 items`
          );
        }
        if (!question.options.includes(question.correct)) {
          throw new Error(
            `Invalid quiz question at index ${index}: correct answer must be one of the options`
          );
        }
      });
      break;

    case 'true-false':
      if (!parsed.trueFalse || !Array.isArray(parsed.trueFalse)) {
        throw new Error('Invalid true/false response: missing or invalid "trueFalse" array');
      }

      parsed.trueFalse.forEach((question, index) => {
        if (
          !question.id ||
          !question.statement ||
          typeof question.answer !== 'boolean' ||
          !question.explanation
        ) {
          throw new Error(`Invalid true/false question at index ${index}: missing required fields`);
        }
      });
      break;

    case 'summary':
      if (!parsed.summary) {
        throw new Error('Invalid summary response: missing "summary" object');
      }

      const summary = parsed.summary;
      if (
        !Array.isArray(summary.keyConcepts) ||
        !Array.isArray(summary.mainTopics) ||
        !Array.isArray(summary.importantTerms) ||
        !summary.overview
      ) {
        throw new Error('Invalid summary response: missing required fields in summary object');
      }

      // Validate importantTerms structure
      summary.importantTerms.forEach((term, index) => {
        if (!term.term || !term.definition) {
          throw new Error(`Invalid term at index ${index}: missing term or definition`);
        }
      });
      break;

    default:
      // For other types, just ensure it's an object
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error(`Invalid ${expectedType} response: expected an object`);
      }
  }

  return parsed;
};
