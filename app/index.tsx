import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useRef } from 'react';

import { storage } from '@/src/utils/storage';
import { syncLocalToRemote, getSyncStatus } from '@/src/utils/supabaseStorage';
import { parseTaskLine, createRecurringTask } from '@/src/utils/taskParser';
import { useAuth } from '@/src/contexts/AuthContext';
import { useDebouncedSync } from '@/src/hooks/useDebouncedSync';
import MarkdownEditor, { MarkdownEditorHandle } from '@/src/components/MarkdownEditor';
import MarkdownRenderer from '@/src/components/MarkdownRenderer';
import AuthPrompt from '@/src/components/AuthPrompt';
import SyncStatus, { SyncState } from '@/src/components/SyncStatus';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
});

type Mode = 'edit' | 'read';

export default function TasksScreen() {
  const { session, signInWithEmail } = useAuth();
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('read');
  const [content, setContent] = useState('');
  const [lastCursorPosition, setLastCursorPosition] = useState<number>(0);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('offline');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [version, setVersion] = useState<number>(0);

  // Debounced remote sync (1s debounce, 5s throttle)
  const { scheduleSync, flushSync } = useDebouncedSync({
    debounceMs: 1000,
    throttleMs: 5000,
    onSync: async (content: string) => {
      try {
        setSyncState('syncing');
        await storage.saveContent(content);
        await updateSyncStatus();
      } catch (error) {
        console.error('Remote sync failed:', error);
        setSyncState('error');
      }
    },
  });

  useEffect(() => {
    loadContent();
  }, []);

  // Flush pending syncs on unmount
  useEffect(() => {
    return () => {
      flushSync();
    };
  }, [flushSync]);

  // Periodically check for remote updates when authenticated
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(async () => {
      try {
        const savedContent = await storage.getContent();
        if (savedContent !== content) {
          setContent(savedContent);
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [session, content]);

  // Show auth prompt after a delay if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      const timer = setTimeout(() => {
        setShowAuthPrompt(true);
      }, 2000); // Show after 2 seconds
      return () => clearTimeout(timer);
    } else {
      setShowAuthPrompt(false);
    }
  }, [loading, session]);

  // Reload content and sync when session becomes available
  useEffect(() => {
    if (!loading && session) {
      // Session just became available - reload to sync with remote
      const syncWithRemote = async () => {
        try {
          setSyncState('syncing');
          const savedContent = await storage.getContent();
          setContent(savedContent);

          // If we have local content but no remote, push to remote
          if (savedContent) {
            await syncLocalToRemote();
          }

          await updateSyncStatus();
        } catch (error) {
          console.error('Failed to sync with remote:', error);
          setSyncState('error');
        }
      };

      syncWithRemote();
    } else if (!loading && !session) {
      updateSyncStatus();
    }
  }, [session, loading]);

  const loadContent = async () => {
    try {
      setSyncState('syncing');
      const savedContent = await storage.getContent();
      setContent(savedContent);
      await updateSyncStatus();
    } catch (error) {
      console.error('Failed to load content:', error);
      setSyncState('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setSyncState('syncing');
      const savedContent = await storage.getContent();
      setContent(savedContent);
      await updateSyncStatus();
    } catch (error) {
      console.error('Failed to refresh content:', error);
      setSyncState('error');
    }
  };

  const updateSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      setLastSync(status.lastSync);
      setVersion(status.version);

      if (session) {
        // If authenticated, we're ready to sync (even if no remote document yet)
        setSyncState('synced');
      } else {
        setSyncState('offline');
      }
    } catch (error) {
      console.error('Failed to get sync status:', error);
      setSyncState('error');
    }
  };

  const handleContentChange = async (newContent: string) => {
    setContent(newContent);
    
    try {
      // 1. Save locally IMMEDIATELY (fast, no network)
      await storage.saveContentLocal(newContent);
      
      // 2. Schedule remote sync (debounced + throttled)
      scheduleSync(newContent);
    } catch (error) {
      console.error('Failed to save content locally:', error);
      setSyncState('error');
    }
  };

  const handleSignIn = async (email: string) => {
    await signInWithEmail(email);
  };

  const handleModeChange = async (newMode: Mode) => {
    // Flush any pending syncs before switching modes
    await flushSync();
    setMode(newMode);
  };

  const handleToggleTask = (newContent: string) => {
    handleContentChange(newContent);
  };

  // Keyboard shortcuts for web - Ctrl+E to toggle Edit/View mode, Ctrl+K for new task
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+E (or Cmd+E on Mac) to toggle Edit/View mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        e.stopPropagation();
        setMode((currentMode) => currentMode === 'edit' ? 'read' : 'edit');
      }
      
      // Ctrl+K (or Cmd+K on Mac) to create new task (edit mode only)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && mode === 'edit') {
        e.preventDefault();
        e.stopPropagation();
        editorRef.current?.handleNewTask();
      }
    };

    // Use capture phase to catch the event before TextInput can handle it
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [mode]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.content}>
          {mode === 'edit' && (
            <MarkdownEditor
              ref={editorRef}
              content={content}
              onContentChange={handleContentChange}
              onToggleTask={handleToggleTask}
              mode={mode}
              onModeChange={handleModeChange}
              initialCursorPosition={lastCursorPosition}
              onCursorPositionChange={setLastCursorPosition}
              syncStatusComponent={
                !loading && <SyncStatus state={syncState} lastSync={lastSync} version={version} />
              }
            />
          )}
          {mode === 'read' && (
            <MarkdownRenderer
              content={content}
              mode={mode}
              onModeChange={handleModeChange}
              syncStatusComponent={
                !loading && <SyncStatus state={syncState} lastSync={lastSync} version={version} />
              }
              onRefresh={handleRefresh}
              onTaskToggle={(lineIndex, newLine) => {
                const lines = content.split('\n');
                const oldLine = lines[lineIndex];

                const oldMetadata = parseTaskLine(oldLine);
                const newMetadata = parseTaskLine(newLine);

                lines[lineIndex] = newLine;

                // If task was just checked and has recurrence, create a new task
                if (!oldMetadata.isChecked && newMetadata.isChecked && oldMetadata.recurrence) {
                  const recurringTask = createRecurringTask(oldLine);
                  if (recurringTask) {
                    lines.splice(lineIndex + 1, 0, recurringTask);
                  }
                }

                handleContentChange(lines.join('\n'));
              }}
            />
          )}
        </View>

        {/* Auth prompt - shown at bottom when not signed in */}
        {showAuthPrompt && !session && (
          <AuthPrompt
            onSignIn={handleSignIn}
            onDismiss={() => setShowAuthPrompt(false)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
