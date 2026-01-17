import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import MarkdownDisplay from 'react-native-markdown-display';
import { parseTaskLine } from '@/src/utils/taskParser';
import TaskLine from '@/src/components/TaskLine';

interface MarkdownRendererProps {
  content: string;
  onTaskToggle: (lineIndex: number, newLine: string) => void;
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

export default function MarkdownRenderer({ content, onTaskToggle }: MarkdownRendererProps) {
  if (!content.trim()) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No content to display</Text>
      </View>
    );
  }

  const lines = content.split('\n');
  const taskLineIndices = new Set<number>();

  // Find which lines are tasks
  lines.forEach((line, index) => {
    const taskMetadata = parseTaskLine(line);
    if (taskMetadata.isTask) {
      taskLineIndices.add(index);
    }
  });

  // Separate task lines from regular markdown
  let regularContent = '';
  const tasksByIndex: Record<number, { line: string; metadata: any }> = {};

  lines.forEach((line, index) => {
    if (taskLineIndices.has(index)) {
      const taskMetadata = parseTaskLine(line);
      tasksByIndex[index] = { line, metadata: taskMetadata };
    } else {
      regularContent += line + '\n';
    }
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Render markdown content first */}
        {regularContent.trim() && (
          <View style={{ marginBottom: 16 }}>
            <MarkdownDisplay style={markdownStyles}>{regularContent}</MarkdownDisplay>
          </View>
        )}

        {/* Render task lines */}
        {Object.entries(tasksByIndex).map(([indexStr, { line, metadata }]) => {
          const index = parseInt(indexStr, 10);
          return (
            <View key={`task-${index}`} style={styles.taskContainer}>
              <TaskLine
                line={line}
                lineIndex={index}
                onToggle={onTaskToggle}
                metadata={metadata}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
