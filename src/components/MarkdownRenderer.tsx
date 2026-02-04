import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, Linking } from 'react-native';
import MarkdownDisplay from 'react-native-markdown-display';
import { parseTaskLine, parseLocalDate, getTodayLocal } from '@/src/utils/taskParser';
import TaskLine from '@/src/components/TaskLine';
import { Toolbar } from '@/src/components/MarkdownEditor';
import { typography, colors, spacing, radius } from '@/src/theme';

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
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  taskContainer: {
    marginVertical: spacing.sm,
  },
  emptyText: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginTop: 40,
  },
});

// Shared heading style - all heading levels (h1-h6) use the same style
const headingStyle = {
  color: colors.text.heading,
  fontFamily: typography.fontFamily.monospace,
  fontSize: typography.fontSize.heading,
  fontWeight: typography.fontWeight.bold,
  lineHeight: typography.lineHeight.heading,
};

const markdownStyles = {
  body: {
    color: colors.text.primary,
    fontFamily: typography.fontFamily.monospace,
  },
  heading1: headingStyle,
  heading2: headingStyle,
  heading3: headingStyle,
  heading4: headingStyle,
  heading5: headingStyle,
  heading6: headingStyle,
  text: {
    color: colors.text.primary,
  },
  paragraph: {
    color: colors.text.primary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  strong: {
    color: colors.text.heading,
    fontWeight: typography.fontWeight.bold,
  },
  em: {
    color: colors.text.primary,
  },
  link: {
    color: colors.accent,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      textDecorationLine: 'underline',
    }),
  },
  blockquote: {
    backgroundColor: colors.background.secondary,
    borderLeftColor: colors.border,
    borderLeftWidth: 4,
    paddingLeft: spacing.lg,
    color: colors.text.secondary,
  },
  code_inline: {
    backgroundColor: colors.badge.code,
    color: colors.badge.codeText,
    fontFamily: typography.fontFamily.monospace,
  },
  code_block: {
    backgroundColor: colors.background.secondary,
    color: colors.text.primary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.lg,
    fontFamily: typography.fontFamily.monospace,
  },
  fence: {
    backgroundColor: colors.background.secondary,
    color: colors.text.primary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.lg,
    fontFamily: typography.fontFamily.monospace,
  },
  hr: {
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  list_item: {
    color: colors.text.primary,
  },
  bullet_list: {
    color: colors.text.primary,
  },
  ordered_list: {
    color: colors.text.primary,
  },
  table: {
    borderColor: colors.border,
  },
  thead: {
    backgroundColor: colors.background.secondary,
  },
  tbody: {
    backgroundColor: colors.background.primary,
  },
  th: {
    color: colors.text.heading,
    borderColor: colors.border,
  },
  td: {
    color: colors.text.primary,
    borderColor: colors.border,
  },
  tr: {
    borderColor: colors.border,
  },
};

// Custom render rules to ensure links are properly styled and clickable
const renderRules = {
  link: (node: any, children: any, parent: any, styles: any) => {
    // Force link color on all children by cloning them with the link color style
    const styledChildren = React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === Text) {
        return React.cloneElement(child as React.ReactElement<any>, {
          style: [child.props.style, { color: colors.accent }],
        });
      }
      return child;
    });

    return (
      <Text
        key={node.key}
        style={[styles.link, { color: colors.accent }]}
        onPress={() => Linking.openURL(node.attributes.href).catch((err) => console.error('Failed to open URL:', err))}
      >
        {styledChildren}
      </Text>
    );
  },
};

interface ContentBlock {
  type: 'markdown' | 'tasks';
  content: string; // for markdown blocks
  tasks?: { line: string; metadata: any; lineIndex: number }[]; // for task blocks
  visible?: boolean; // determines if block should render when filters are active
}

export default function MarkdownRenderer({ content, onTaskToggle, mode, onModeChange, syncStatusComponent, onRefresh }: MarkdownRendererProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [filterDue, setFilterDue] = useState(false);
  const [filterScheduled, setFilterScheduled] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const shouldShowTask = (metadata: any): boolean => {
    // If any filter is active, hide completed tasks
    if ((filterDue || filterScheduled) && metadata.isChecked) {
      return false;
    }

    // If no filters are active, show all tasks
    if (!filterDue && !filterScheduled) {
      return true;
    }

    // If task is complete, we already handled hiding it above
    if (metadata.isChecked) {
      return true; // Won't reach here due to first check
    }

    const todayStr = getTodayLocal();
    const today = parseLocalDate(todayStr);

    // Check due date filter
    if (filterDue) {
      if (!metadata.dueDate) return false;
      const dueDate = parseLocalDate(metadata.dueDate);
      if (dueDate > today) return false;
    }

    // Check scheduled date filter
    if (filterScheduled) {
      if (!metadata.scheduledDate) return false;
      const scheduledDate = parseLocalDate(metadata.scheduledDate);
      if (scheduledDate > today) return false;
    }

    return true;
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

  // Post-process blocks to determine visibility based on active filters
  const isFilterActive = filterDue || filterScheduled;
  
  if (isFilterActive) {
    // When filtering: hide all markdown, only show task blocks with visible tasks
    blocks.forEach(block => {
      if (block.type === 'markdown') {
        block.visible = false;
      } else {
        // Task block - only visible if has tasks after filtering
        const visibleTasks = block.tasks!.filter(({ metadata }) => 
          shouldShowTask(metadata)
        );
        block.visible = visibleTasks.length > 0;
      }
    });
  } else {
    // No filters active - show everything
    blocks.forEach(block => {
      block.visible = true;
    });
  }

  return (
    <View style={styles.container}>
      <Toolbar 
        mode={mode} 
        onModeChange={onModeChange} 
        syncStatusComponent={syncStatusComponent}
        filterDue={filterDue}
        filterScheduled={filterScheduled}
        onFilterDueToggle={() => setFilterDue(!filterDue)}
        onFilterScheduledToggle={() => setFilterScheduled(!filterScheduled)}
      />
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
          // Skip blocks marked as invisible
          if (block.visible === false) return null;

          if (block.type === 'markdown') {
            return block.content.trim() ? (
              <View key={`markdown-${blockIndex}`} style={{ marginBottom: 16 }}>
                <MarkdownDisplay style={markdownStyles} rules={renderRules}>
                  {block.content}
                </MarkdownDisplay>
              </View>
            ) : null;
          } else {
            // Task block - filter tasks based on active filters
            const filteredTasks = block.tasks!.filter(({ metadata }) => shouldShowTask(metadata));
            
            return (
              <View key={`tasks-${blockIndex}`}>
                {filteredTasks.map(({ line, metadata, lineIndex }) => (
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
