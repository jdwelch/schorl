import { useRef, useCallback, useEffect } from 'react';

interface UseDebouncedSyncOptions {
  debounceMs?: number; // Wait time after last change
  throttleMs?: number; // Maximum wait time during continuous changes
  onSync: (content: string) => Promise<void>;
}

/**
 * Hook for debounced + throttled syncing with manual flush capability.
 * 
 * Strategy:
 * - Debounce: Wait for typing pause before syncing
 * - Throttle: Force sync if too much time passes during continuous typing
 * - Flush: Immediate sync on demand (mode switch, unmount, etc)
 */
export function useDebouncedSync({
  debounceMs = 1000,
  throttleMs = 5000,
  onSync,
}: UseDebouncedSyncOptions) {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncTimeRef = useRef<number>(0);
  const pendingContentRef = useRef<string | null>(null);
  const isSyncingRef = useRef<boolean>(false);
  const onSyncRef = useRef(onSync);

  // Keep onSync ref up to date
  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  const performSyncInternal = async (content: string) => {
    if (isSyncingRef.current) {
      // Already syncing, will retry after current sync completes
      return;
    }

    try {
      isSyncingRef.current = true;
      pendingContentRef.current = null;
      lastSyncTimeRef.current = Date.now();
      await onSyncRef.current(content);
    } catch (error) {
      console.error('Sync failed:', error);
      // On error, keep pending content so it can be retried
      pendingContentRef.current = content;
    } finally {
      isSyncingRef.current = false;

      // If new content arrived while syncing, schedule another sync
      if (pendingContentRef.current !== null) {
        const nextContent = pendingContentRef.current;
        pendingContentRef.current = null;
        // Re-schedule using the scheduleSync logic
        scheduleSyncInternal(nextContent);
      }
    }
  };

  const scheduleSyncInternal = useCallback((content: string) => {
    // Store pending content
    pendingContentRef.current = content;

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Check if we need to throttle (force sync if too much time has passed)
    const timeSinceLastSync = Date.now() - lastSyncTimeRef.current;
    const shouldThrottle = timeSinceLastSync >= throttleMs;

    if (shouldThrottle) {
      // Force immediate sync due to throttle
      performSyncInternal(content);
    } else {
      // Schedule debounced sync
      debounceTimerRef.current = setTimeout(() => {
        if (pendingContentRef.current !== null) {
          performSyncInternal(pendingContentRef.current);
        }
      }, debounceMs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceMs, throttleMs]);

  const flushSync = useCallback(async () => {
    // Cancel any pending debounced sync
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Sync any pending content immediately
    if (pendingContentRef.current !== null) {
      await performSyncInternal(pendingContentRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    scheduleSync: scheduleSyncInternal,
    flushSync,
  };
}
