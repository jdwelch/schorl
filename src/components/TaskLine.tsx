import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { CheckCircle2, Circle, CircleDashed } from 'lucide-react-native';
import { TaskMetadata } from '@/src/types/task.types';
import { toggleTaskLine, parseLocalDate, getTodayLocal } from '@/src/utils/taskParser';
import { typography, colors, spacing, radius } from '@/src/theme';

interface TaskLineProps {
  line: string;
  lineIndex: number;
  metadata: TaskMetadata;
  onToggle: (lineIndex: number, newLine: string) => void;
}

type TextSegment = {
  type: 'text' | 'bold' | 'italic' | 'code' | 'highlight' | 'link';
  content: string;
  url?: string;
};

// Parse inline markdown formatting
function parseInlineMarkdown(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let remaining = text;

  // Combined regex for all inline formatting
  const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))|(==([^=]+)==)/g;
  
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(remaining)) !== null) {
    // Add plain text before this match
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: remaining.substring(lastIndex, match.index) });
    }

    // Determine which pattern matched
    if (match[1]) {
      // **bold**
      segments.push({ type: 'bold', content: match[2] });
    } else if (match[3]) {
      // *italic*
      segments.push({ type: 'italic', content: match[4] });
    } else if (match[5]) {
      // _italic_
      segments.push({ type: 'italic', content: match[6] });
    } else if (match[7]) {
      // `code`
      segments.push({ type: 'code', content: match[8] });
    } else if (match[9]) {
      // [link](url)
      segments.push({ type: 'link', content: match[10], url: match[11] });
    } else if (match[12]) {
      // ==highlight==
      segments.push({ type: 'highlight', content: match[13] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < remaining.length) {
    segments.push({ type: 'text', content: remaining.substring(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    flexShrink: 0,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: 1, // Optical alignment with checkbox icon
  },
  taskText: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.monospace,
  },
  taskTextChecked: {
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  taskTextMaybe: {
    opacity: 0.6,
  },
  taskLink: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    color: colors.accent,
    fontFamily: typography.fontFamily.monospace,
    textDecorationLine: 'underline',
  },
  taskBold: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.heading,
  },
  taskItalic: {
    fontStyle: 'italic',
  },
  taskCode: {
    backgroundColor: colors.badge.code,
    color: colors.badge.codeText,
    fontFamily: typography.fontFamily.monospace,
    paddingHorizontal: 2,
  },
  taskHighlight: {
    backgroundColor: colors.highlight,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.badge.default,
  },
  badgeText: {
    fontSize: typography.fontSize.small,
    color: colors.badge.defaultText,
    fontFamily: typography.fontFamily.monospace,
  },
  dueBadge: {
    backgroundColor: colors.badge.due,
  },
  dueBadgeText: {
    color: colors.badge.dueText,
  },
  overdueBadge: {
    backgroundColor: colors.badge.overdue,
  },
  overdueBadgeText: {
    color: colors.badge.overdueText,
  },
  priorityBadge: {
    backgroundColor: colors.badge.default,
  },
  priorityHighest: {
    backgroundColor: colors.priority.highest,
  },
  priorityHigh: {
    backgroundColor: colors.priority.high,
  },
  priorityLow: {
    backgroundColor: colors.priority.low,
  },
  priorityLowest: {
    backgroundColor: colors.priority.lowest,
  },
});

export default function TaskLine({ line, lineIndex, metadata, onToggle }: TaskLineProps) {
  const handleToggle = () => {
    const newLine = toggleTaskLine(line);
    onToggle(lineIndex, newLine);
  };

  // Extract just the description without metadata
  const descriptionMatch = metadata.description.match(
    /^(.+?)(?:\s*\[\?\]|\s*📅|\s*⏳|\s*🔁|\s*✅|\s*➕|\s*⏫|\s*🔼|\s*🔽|\s*⏬|$)/
  );
  const displayText = descriptionMatch ? descriptionMatch[1].trim() : metadata.description;

  // Priority emoji map
  const priorityEmoji: Record<string, string> = {
    highest: '⏫',
    high: '🔼',
    low: '🔽',
    lowest: '⏬',
  };

  // Calculate due date status
  let dueDateStatus: 'overdue' | 'today' | 'soon' | null = null;
  if (metadata.dueDate) {
    const dueDate = parseLocalDate(metadata.dueDate);
    const todayStr = getTodayLocal();
    const today = parseLocalDate(todayStr);

    if (dueDate < today) {
      dueDateStatus = 'overdue';
    } else if (dueDate.getTime() === today.getTime()) {
      dueDateStatus = 'today';
    } else {
      const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) {
        dueDateStatus = 'soon';
      }
    }
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.checkbox} onPress={handleToggle}>
        {metadata.isChecked ? (
          <CheckCircle2 size={20} color={colors.success} strokeWidth={2} />
        ) : metadata.isMaybe ? (
          <CircleDashed size={20} color={colors.text.tertiary} strokeWidth={2} />
        ) : (
          <Circle size={20} color={colors.text.tertiary} strokeWidth={2} />
        )}
      </Pressable>

      <View style={styles.content}>
        <Text
          style={[
            styles.taskText,
            metadata.isChecked && styles.taskTextChecked,
            metadata.isMaybe && !metadata.isChecked && styles.taskTextMaybe,
          ]}
        >
          {parseInlineMarkdown(displayText).map((segment, idx) => {
            const baseStyle = [
              metadata.isChecked && styles.taskTextChecked,
            ];

            if (segment.type === 'bold') {
              return (
                <Text key={idx} style={[...baseStyle, styles.taskBold]}>
                  {segment.content}
                </Text>
              );
            } else if (segment.type === 'italic') {
              return (
                <Text key={idx} style={[...baseStyle, styles.taskItalic]}>
                  {segment.content}
                </Text>
              );
            } else if (segment.type === 'code') {
              return (
                <Text key={idx} style={[...baseStyle, styles.taskCode]}>
                  {segment.content}
                </Text>
              );
            } else if (segment.type === 'highlight') {
              return (
                <Text key={idx} style={[...baseStyle, styles.taskHighlight]}>
                  {segment.content}
                </Text>
              );
            } else if (segment.type === 'link') {
              return (
                <Text
                  key={idx}
                  style={[...baseStyle, styles.taskLink]}
                  onPress={() => Linking.openURL(segment.url!).catch((err) => console.error('Failed to open URL:', err))}
                >
                  {segment.content}
                </Text>
              );
            }
            return <Text key={idx}>{segment.content}</Text>;
          })}
        </Text>

        {metadata.priority && (
          <View
            style={[
              styles.badge,
              styles.priorityBadge,
              metadata.priority === 'highest' && styles.priorityHighest,
              metadata.priority === 'high' && styles.priorityHigh,
              metadata.priority === 'low' && styles.priorityLow,
              metadata.priority === 'lowest' && styles.priorityLowest,
            ]}
          >
            <Text style={styles.badgeText}>{priorityEmoji[metadata.priority]}</Text>
          </View>
        )}
         {metadata.dueDate && (
           <View style={[styles.badge, !metadata.isChecked && (dueDateStatus === 'overdue' || dueDateStatus === 'today') && styles.overdueBadge]}>
             <Text
               style={[
                 styles.badgeText,
                 !metadata.isChecked && (dueDateStatus === 'overdue' || dueDateStatus === 'today') && styles.overdueBadgeText,
               ]}
             >
               📅 {metadata.dueDate}
             </Text>
           </View>
         )}
        {metadata.scheduledDate && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>⏳ {metadata.scheduledDate}</Text>
          </View>
        )}
        {metadata.recurrence && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🔁 {metadata.recurrence}</Text>
          </View>
        )}
        {metadata.createdDate && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>➕ {metadata.createdDate}</Text>
          </View>
        )}
        {metadata.doneDate && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✅ {metadata.doneDate}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
