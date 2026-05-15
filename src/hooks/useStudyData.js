import { useCallback, useEffect } from 'react';
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
    setDecks((prev) => [...prev, newDeck]);
    return newDeck.id;
  }, [setDecks]);

  const deleteDeck = useCallback((deckId) => {
    setDecks((prev) => prev.filter((deck) => deck.id !== deckId));
    setHistory((prev) => prev.filter((h) => h.deckId !== deckId));
  }, [setDecks, setHistory]);

  const softDeleteDeck = useCallback((deckId) => {
    setDecks((prev) =>
      prev.map((deck) =>
        deck.id === deckId ? { ...deck, isDeleted: true, deletedAt: new Date().toISOString() } : deck
      )
    );
    setHistory((prev) => prev.filter((h) => h.deckId !== deckId));
  }, [setDecks, setHistory]);

  const restoreDeck = useCallback(
    (deck) => {
      setDecks((prev) =>
        prev.map((existing) =>
          existing.id === deck.id ? { ...deck, isDeleted: false, deletedAt: null } : existing
        )
      );
    },
    [setDecks]
  );

  const permanentlyRemoveDeck = useCallback(
    (deckId) => {
      setDecks((prev) => prev.filter((deck) => deck.id !== deckId));
    },
    [setDecks]
  );

  const loadDeck = useCallback(
    (deckId) => decks.find((deck) => deck.id === deckId && !deck.isDeleted),
    [decks]
  );

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
    setHistory((prev) => [...prev, entry]);
  }, [setHistory]);

  useEffect(() => {
    const now = Date.now();
    setDecks((prev) =>
      prev.filter((deck) => {
        if (!deck.isDeleted || !deck.deletedAt) return true;
        return now - new Date(deck.deletedAt).getTime() < 8000;
      })
    );
  }, [setDecks]);

  const activeDecks = decks.filter((deck) => !deck.isDeleted);

  return {
    decks: activeDecks,
    history,
    progress,
    saveDeck,
    deleteDeck,
    softDeleteDeck,
    restoreDeck,
    permanentlyRemoveDeck,
    loadDeck,
    updateProgress,
    addHistoryEntry,
  };
};

export default useStudyData;