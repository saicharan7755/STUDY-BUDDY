const GUEST_FLASHCARDS_KEY = 'cram_guest_flashcards_v1';
const GUEST_STUDY_STATE_KEY = 'cram_guest_study_state_v1';

export const loadGuestFlashcards = () => {
  try {
    const raw = localStorage.getItem(GUEST_FLASHCARDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load guest flashcards', error);
    return [];
  }
};

export const saveGuestFlashcards = (cards) => {
  try {
    localStorage.setItem(GUEST_FLASHCARDS_KEY, JSON.stringify(Array.isArray(cards) ? cards : []));
  } catch (error) {
    console.error('Failed to save guest flashcards', error);
  }
};

export const clearGuestFlashcards = () => {
  localStorage.removeItem(GUEST_FLASHCARDS_KEY);
};

export const createGuestStudyState = ({ topic = '', count = 10, cards = [] } = {}) => ({
  topic,
  count,
  cards: Array.isArray(cards) ? cards : [],
  updatedAt: new Date().toISOString(),
});

export { GUEST_FLASHCARDS_KEY, GUEST_STUDY_STATE_KEY };
