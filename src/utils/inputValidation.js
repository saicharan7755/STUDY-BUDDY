export const TEXT_LIMITS = {
  flashcardMin: 50,
  flashcardMax: 10000,
  syllabusMin: 10,
  syllabusMax: 5000,
};

export const getCharacterCountState = (length, { min, max, warningAt = 0.8 }) => {
  if (length > max) return 'danger';
  if (length < min) return 'danger';
  if (length >= max * warningAt) return 'warning';
  return 'success';
};

export const validateStudyText = (text, numCards) => {
  const value = text || '';
  const trimmed = value.trim();
  const errors = [];

  if (!trimmed) {
    errors.push('Text cannot be empty.');
  }

  if (trimmed && trimmed.length < TEXT_LIMITS.flashcardMin) {
    errors.push(`Text must be at least ${TEXT_LIMITS.flashcardMin} characters long.`);
  }

  if (value.length > TEXT_LIMITS.flashcardMax) {
    errors.push(`Text cannot exceed ${TEXT_LIMITS.flashcardMax.toLocaleString()} characters.`);
  }

  if (trimmed) {
    const hasLetters = /[a-zA-Z]/.test(trimmed);
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    const symbolCount = (trimmed.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const symbolRatio = symbolCount / Math.max(trimmed.length, 1);

    if (!hasLetters || wordCount < 5 || symbolRatio > 0.5) {
      errors.push('Text appears to be random or incomplete. Please paste coherent study content.');
    }
  }

  if (numCards < 3 || numCards > 50) {
    errors.push('Number of flashcards must be between 3 and 50.');
  }

  return errors;
};

export const validateSyllabusInput = (syllabus, image) => {
  const trimmed = (syllabus || '').trim();

  if (!trimmed && !image) {
    return 'Please paste a syllabus or upload a course image.';
  }

  if (!image && trimmed.length < TEXT_LIMITS.syllabusMin) {
    return `Your syllabus should be at least ${TEXT_LIMITS.syllabusMin} characters.`;
  }

  if (syllabus.length > TEXT_LIMITS.syllabusMax) {
    return `Your syllabus cannot exceed ${TEXT_LIMITS.syllabusMax.toLocaleString()} characters.`;
  }

  return '';
};
