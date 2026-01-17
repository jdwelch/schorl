import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

import { storage } from '@/src/utils/storage';
import { parseTaskLine, createRecurringTask } from '@/src/utils/taskParser';
import MarkdownEditor from '@/src/components/MarkdownEditor';
import MarkdownRenderer from '@/src/components/MarkdownRenderer';

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
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('edit');
  const [content, setContent] = useState('');
  const [lastCursorPosition, setLastCursorPosition] = useState<number>(0);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const savedContent = await storage.getContent();
      setContent(savedContent);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = async (newContent: string) => {
    setContent(newContent);
    try {
      await storage.saveContent(newContent);
    } catch (error) {
      console.error('Failed to save content:', error);
    }
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
            />
          )}
          {mode === 'read' && (
            <MarkdownRenderer
              content={content}
              mode={mode}
              onModeChange={handleModeChange}
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
      </View>
    </SafeAreaView>
  );
}
