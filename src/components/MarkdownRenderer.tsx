import { View, Text, StyleSheet, ScrollView, Platform, RefreshControl } from 'react-native';
import { useState } from 'react';
import MarkdownDisplay from 'react-native-markdown-display';
import { parseTaskLine } from '@/src/utils/taskParser';
import TaskLine from '@/src/components/TaskLine';
import { Toolbar } from '@/src/components/MarkdownEditor';

interface MarkdownRendererProps {
  content: string;
  onTaskToggle: (lineIndex: number, newLine: string) => void;
  mode: 'edit' | 'read';
  onModeChange: (mode: 'edit' | 'read') => void;
  syncStatusComponent?: React.ReactNode;
  onRefresh?: () => Promise<void>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  taskContainer: {
    marginVertical: 6,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});

const markdownStyles = {
  body: {
    color: '#e5e7eb',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  heading1: {
    color: '#f3f4f6',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  heading2: {
    color: '#f3f4f6',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  heading3: {
    color: '#f3f4f6',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  heading4: {
    color: '#f3f4f6',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  heading5: {
    color: '#f3f4f6',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  heading6: {
    color: '#f3f4f6',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  text: {
    color: '#e5e7eb',
  },
  paragraph: {
    color: '#e5e7eb',
    marginTop: 4,
    marginBottom: 4,
  },
  strong: {
    color: '#f3f4f6',
  },
  em: {
    color: '#e5e7eb',
  },
  link: {
    color: '#3B82F6',
  },
  blockquote: {
    backgroundColor: '#262626',
    borderLeftColor: '#374151',
    borderLeftWidth: 4,
    paddingLeft: 12,
    color: '#9ca3af',
  },
  code_inline: {
    backgroundColor: '#262626',
    color: '#fcd34d',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  code_block: {
    backgroundColor: '#262626',
    color: '#e5e7eb',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  fence: {
    backgroundColor: '#262626',
    color: '#e5e7eb',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  hr: {
    backgroundColor: '#374151',
  },
  list_item: {
    color: '#e5e7eb',
  },
  bullet_list: {
    color: '#e5e7eb',
  },
  ordered_list: {
    color: '#e5e7eb',
  },
  table: {
    borderColor: '#374151',
  },
  thead: {
    backgroundColor: '#262626',
  },
  tbody: {
    backgroundColor: '#1a1a1a',
  },
  th: {
    color: '#f3f4f6',
    borderColor: '#374151',
  },
  td: {
    color: '#e5e7eb',
    borderColor: '#374151',
  },
  tr: {
    borderColor: '#374151',
  },
};

interface ContentBlock {
  type: 'markdown' | 'tasks';
  content: string; // for markdown blocks
  tasks?: Array<{ line: string; metadata: any; lineIndex: number }>; // for task blocks
}

export default function MarkdownRenderer({ content, onTaskToggle, mode, onModeChange, syncStatusComponent, onRefresh }: MarkdownRendererProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  if (!content.trim()) {
    return (
      <View style={styles.container}>
        <Toolbar mode={mode} onModeChange={onModeChange} syncStatusComponent={syncStatusComponent} />
        <Text style={styles.emptyText}>No content to display</Text>
      </View>
    );
  }

  const lines = content.split('\n');
  const blocks: ContentBlock[] = [];
  let currentBlock: ContentBlock | null = null;

  lines.forEach((line, index) => {
    // Check if empty task (e.g., "- [ ]" with no description)
    const emptyTaskRegex = /^\s*[-*+]\s+\[([ xX])\]\s*$/;
    const isEmptyTask = emptyTaskRegex.test(line);

    if (isEmptyTask) {
      return; // Skip empty tasks
    }

    const taskMetadata = parseTaskLine(line);
    const isTask = taskMetadata.isTask;

    if (isTask) {
      // Extract display text to check if task has meaningful content
      const descriptionMatch = taskMetadata.description.match(
        /^(.+?)(?:\s*📅|\s*⏳|\s*🔁|\s*✅|\s*➕|\s*⏫|\s*🔼|\s*🔽|\s*⏬|$)/
      );
      const displayText = descriptionMatch ? descriptionMatch[1].trim() : taskMetadata.description.trim();

      if (!displayText || displayText.length === 0) {
        return; // Skip tasks with no meaningful description
      }

      // Start a new task block if needed
      if (!currentBlock || currentBlock.type !== 'tasks') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'tasks', content: '', tasks: [] };
      }
      currentBlock.tasks!.push({ line, metadata: taskMetadata, lineIndex: index });
    } else {
      // Start a new markdown block if needed
      if (!currentBlock || currentBlock.type !== 'markdown') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'markdown', content: '' };
      }
      currentBlock.content += line + '\n';
    }
  });

  // Push the last block
  if (currentBlock) blocks.push(currentBlock);

  return (
    <View style={styles.container}>
      <Toolbar mode={mode} onModeChange={onModeChange} syncStatusComponent={syncStatusComponent} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
            />
          ) : undefined
        }
      >
        {blocks.map((block, blockIndex) => {
          if (block.type === 'markdown') {
            return block.content.trim() ? (
              <View key={`markdown-${blockIndex}`} style={{ marginBottom: 16 }}>
                <MarkdownDisplay style={markdownStyles}>{block.content}</MarkdownDisplay>
              </View>
            ) : null;
          } else {
            // Task block
            return (
              <View key={`tasks-${blockIndex}`}>
                {block.tasks!.map(({ line, metadata, lineIndex }) => (
                  <View key={`task-${lineIndex}`} style={styles.taskContainer}>
                    <TaskLine
                      line={line}
                      lineIndex={lineIndex}
                      onToggle={onTaskToggle}
                      metadata={metadata}
                    />
                  </View>
                ))}
              </View>
            );
          }
        })}
      </ScrollView>
    </View>
  );
}
