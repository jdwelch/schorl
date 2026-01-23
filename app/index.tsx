import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

import { storage } from '@/src/utils/storage';
import { syncLocalToRemote, getSyncStatus } from '@/src/utils/supabaseStorage';
import { parseTaskLine, createRecurringTask } from '@/src/utils/taskParser';
import { useAuth } from '@/src/contexts/AuthContext';
import MarkdownEditor from '@/src/components/MarkdownEditor';
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
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('read');
  const [content, setContent] = useState('');
  const [lastCursorPosition, setLastCursorPosition] = useState<number>(0);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('offline');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

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

  const syncLocalContentToRemote = async () => {
    try {
      setSyncState('syncing');
      await syncLocalToRemote();
      await updateSyncStatus();
    } catch (error) {
      console.error('Failed to sync local content:', error);
      setSyncState('error');
    }
  };

  const handleContentChange = async (newContent: string) => {
    setContent(newContent);
    try {
      setSyncState('syncing');
      await storage.saveContent(newContent);
      await updateSyncStatus();
    } catch (error) {
      console.error('Failed to save content:', error);
      setSyncState('error');
    }
  };

  const handleSignIn = async (email: string) => {
    await signInWithEmail(email);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
  };

  const handleToggleTask = (newContent: string) => {
    handleContentChange(newContent);
  };

  // Keyboard shortcuts for web - Ctrl+E to toggle Edit/View mode
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+E (or Cmd+E on Mac) to toggle Edit/View mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        e.stopPropagation();
        setMode((currentMode) => currentMode === 'edit' ? 'read' : 'edit');
      }
    };

    // Use capture phase to catch the event before TextInput can handle it
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

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
              content={content}
              onContentChange={handleContentChange}
              onToggleTask={handleToggleTask}
              mode={mode}
              onModeChange={handleModeChange}
              initialCursorPosition={lastCursorPosition}
              onCursorPositionChange={setLastCursorPosition}
              syncStatusComponent={
                !loading && <SyncStatus state={syncState} lastSync={lastSync} />
              }
            />
          )}
          {mode === 'read' && (
            <MarkdownRenderer
              content={content}
              mode={mode}
              onModeChange={handleModeChange}
              syncStatusComponent={
                !loading && <SyncStatus state={syncState} lastSync={lastSync} />
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
