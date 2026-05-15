import { useCallback, useState } from 'react';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const useRetry = (asyncFunction, maxRetries = 3, delayMs = 1000) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setRetryCount(0);
  }, []);

  const execute = useCallback(
    async (...args) => {
      setIsLoading(true);
      setError(null);
      setRetryCount(0);

      let attempt = 0;
      let lastError = null;

      while (attempt <= maxRetries) {
        try {
          const result = await asyncFunction(...args);
          setIsLoading(false);
          return result;
        } catch (err) {
          lastError = err;
          attempt += 1;
          if (attempt > maxRetries) break;
          setRetryCount(attempt);
          await wait(delayMs * 2 ** (attempt - 1));
        }
      }

      setError(lastError);
      setIsLoading(false);
      throw lastError;
    },
    [asyncFunction, delayMs, maxRetries]
  );

  return {
    execute,
    isLoading,
    error,
    retryCount,
    reset,
  };
};

export default useRetry;
