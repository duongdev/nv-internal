import { useEffect, useRef } from 'react';

/**
 * useDebounce hook
 * Delays invoking the callback until after the specified delay has passed since the last change.
 *
 * @param callback Function to be called after debounce delay
 * @param delay Delay in milliseconds
 * @param deps Dependency array
 */
export function useDebounce(callback: () => void, delay: number, deps: any[]) {
  const callbackRef = useRef(callback);

  // Update callback ref if it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = setTimeout(() => {
      callbackRef.current();
    }, delay);

    return () => {
      clearTimeout(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}