import { useCallback } from 'react';
import useLocalStorage from './useLocalStorage';

const useStudyData = () => {
  const [decks, setDecks] = useLocalStorage('study-decks', []);
  const [history, setHistory] = useLocalStorage('study-history', []);
  const [progress, setProgress] = useLocalStorage('study-progress', {});

  const saveDeck = useCallback((name, cards) => {
    const newDeck = {
      id: Date.now().toString(),
      name,
      cards,
      createdAt: new Date().toISOString(),
    };
    setDecks(prev => [...prev, newDeck]);
    return newDeck.id;
  }, [setDecks]);

  const deleteDeck = useCallback((deckId) => {
    setDecks(prev => prev.filter(deck => deck.id !== deckId));
    setHistory(prev => prev.filter(h => h.deckId !== deckId));
  }, [setDecks, setHistory]);

  const loadDeck = useCallback((deckId) => {
    return decks.find(deck => deck.id === deckId);
  }, [decks]);

  const updateProgress = useCallback((topicId, updates) => {
    setProgress(prev => ({
      ...prev,
      [topicId]: { ...prev[topicId], ...updates },
    }));
  }, [setProgress]);

  const addHistoryEntry = useCallback((deckId, progressData) => {
    const entry = {
      id: Date.now().toString(),
      deckId,
      date: new Date().toISOString(),
      ...progressData,
    };
    setHistory(prev => [...prev, entry]);
  }, [setHistory]);

  return {
    decks,
    history,
    progress,
    saveDeck,
    deleteDeck,
    loadDeck,
    updateProgress,
    addHistoryEntry,
  };
};

export default useStudyData;