import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Toast } from '../components/ui';
import {
  deleteContent as deleteContentRecord,
  getUserContent,
  saveContent as saveContentRecord,
  updateContent as updateContentRecord,
} from '../services/contentService';
import { useAuth } from '../hooks/useAuth';

export const ContentContext = createContext(undefined);

const rollbackMessage = 'Failed to save changes. Your previous version has been restored.';
const getCacheKey = (userId) => `cram_content_cache_${userId}`;

const readCachedContent = (userId) => {
  if (!userId) return [];
  try {
    const raw = sessionStorage.getItem(getCacheKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read cached content', error);
    return [];
  }
};

const writeCachedContent = (userId, content) => {
  if (!userId) return;
  try {
    sessionStorage.setItem(getCacheKey(userId), JSON.stringify(Array.isArray(content) ? content : []));
  } catch (error) {
    console.error('Failed to cache content', error);
  }
};

const createDraftContent = (userId, contentType, contentData) => {
  const now = new Date().toISOString();
  const sourceText = String(contentData?.sourceText || '').trim();
  const content = contentData?.content || {};
  const title = sourceText.replace(/\s+/g, ' ').slice(0, 50) || 'Untitled content';

  return {
    id: contentData?.id || `pending-${now}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    type: contentType,
    title,
    content,
    sourceText,
    createdAt: now,
    updatedAt: now,
    metadata: contentData?.metadata || {},
    isPending: true,
  };
};

export const ContentProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.uid;
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingItemIds, setPendingItemIds] = useState([]);
  const [toast, setToast] = useState(null);

  const setPending = useCallback((contentId, isPending) => {
    setPendingItemIds((prev) => {
      if (isPending) return prev.includes(contentId) ? prev : [...prev, contentId];
      return prev.filter((id) => id !== contentId);
    });
  }, []);

  const showRollbackToast = useCallback(() => {
    setToast({ message: rollbackMessage, type: 'danger' });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const refreshContent = useCallback(async () => {
    if (!userId) {
      setContent([]);
      setError(null);
      setIsLoading(false);
      return { data: [], error: null };
    }

    const cached = readCachedContent(userId);
    if (cached.length) setContent(cached);

    setIsLoading(true);
    const result = await getUserContent(userId);
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return result;
    }

    setContent(result.data);
    writeCachedContent(userId, result.data);
    setError(null);
    setIsLoading(false);
    return result;
  }, [userId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      refreshContent();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refreshContent]);

  useEffect(() => {
    if (userId) writeCachedContent(userId, content);
  }, [content, userId]);

  const saveContent = useCallback(
    async (contentType, contentData) => {
      if (!userId) {
        const authError = { type: 'AUTH_REQUIRED', message: 'Sign in before saving content.' };
        setError(authError);
        return { data: null, error: authError };
      }

      const previousContent = content;
      const draft = createDraftContent(userId, contentType, contentData);
      setPending(draft.id, true);
      setContent((prev) => [draft, ...prev]);

      const result = await saveContentRecord(userId, contentType, contentData);
      if (result.error) {
        setContent(previousContent);
        setPending(draft.id, false);
        setError(result.error);
        showRollbackToast();
        return result;
      }

      setContent((prev) =>
        prev.map((item) => (item.id === draft.id ? result.data : item)).filter(Boolean)
      );
      setPending(draft.id, false);
      setError(null);
      return result;
    },
    [content, setPending, showRollbackToast, userId]
  );

  const updateContent = useCallback(
    async (contentId, updatedData) => {
      if (!userId) {
        const authError = { type: 'AUTH_REQUIRED', message: 'Sign in before updating content.' };
        setError(authError);
        return { data: null, error: authError };
      }

      const previousContent = content;
      const existing = content.find((item) => item.id === contentId);
      if (!existing) {
        const missingError = { type: 'NOT_FOUND', message: 'Content item was not found.' };
        setError(missingError);
        return { data: null, error: missingError };
      }

      const optimistic = {
        ...existing,
        ...updatedData,
        updatedAt: new Date().toISOString(),
        isPending: true,
      };
      setPending(contentId, true);
      setContent((prev) => prev.map((item) => (item.id === contentId ? optimistic : item)));

      const result = await updateContentRecord(userId, contentId, updatedData);
      if (result.error) {
        setContent(previousContent);
        setPending(contentId, false);
        setError(result.error);
        showRollbackToast();
        return result;
      }

      setContent((prev) => prev.map((item) => (item.id === contentId ? result.data : item)));
      setPending(contentId, false);
      setError(null);
      return result;
    },
    [content, setPending, showRollbackToast, userId]
  );

  const deleteContent = useCallback(
    async (contentId) => {
      if (!userId) {
        const authError = { type: 'AUTH_REQUIRED', message: 'Sign in before deleting content.' };
        setError(authError);
        return { data: null, error: authError };
      }

      const previousContent = content;
      setPending(contentId, true);
      setContent((prev) =>
        prev.map((item) => (item.id === contentId ? { ...item, isDeleting: true } : item))
      );

      const result = await deleteContentRecord(userId, contentId);
      if (result.error) {
        setContent(previousContent);
        setPending(contentId, false);
        setError(result.error);
        showRollbackToast();
        return result;
      }

      setContent((prev) => prev.filter((item) => item.id !== contentId));
      setPending(contentId, false);
      setError(null);
      return result;
    },
    [content, setPending, showRollbackToast, userId]
  );

  const value = useMemo(
    () => ({
      content,
      isLoading,
      error,
      pendingItemIds,
      isSaving: pendingItemIds.length > 0,
      saveContent,
      updateContent,
      deleteContent,
      refreshContent,
    }),
    [
      content,
      deleteContent,
      error,
      isLoading,
      pendingItemIds,
      refreshContent,
      saveContent,
      updateContent,
    ]
  );

  return (
    <ContentContext.Provider value={value}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </ContentContext.Provider>
  );
};
