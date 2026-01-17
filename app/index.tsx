import { View, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { Edit2, Eye } from 'lucide-react-native';

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
  header: {
    backgroundColor: '#262626',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#374151',
  },
  modeButtonActive: {
    backgroundColor: '#3B82F6',
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

  const handleToggleTask = () => {
    const newTask = '- [ ] New task\n';
    if (content.trim()) {
      handleContentChange(content + '\n' + newTask);
    } else {
      handleContentChange(newTask);
    }
  };

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
        <View style={styles.header}>
          <View style={styles.modeButtons}>
            <Pressable
              onPress={() => handleModeChange('edit')}
              style={[styles.modeButton, mode === 'edit' && styles.modeButtonActive]}
            >
              <Edit2
                size={16}
                color={mode === 'edit' ? '#fff' : '#9ca3af'}
                strokeWidth={2}
              />
            </Pressable>
            <Pressable
              onPress={() => handleModeChange('read')}
              style={[styles.modeButton, mode === 'read' && styles.modeButtonActive]}
            >
              <Eye
                size={16}
                color={mode === 'read' ? '#fff' : '#9ca3af'}
                strokeWidth={2}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          {mode === 'edit' && (
            <MarkdownEditor
              content={content}
              onContentChange={handleContentChange}
              onToggleTask={handleToggleTask}
            />
          )}
          {mode === 'read' && (
            <MarkdownRenderer
              content={content}
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
