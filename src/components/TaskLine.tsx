import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { TaskMetadata } from '@/src/types/task.types';
import { toggleTaskLine, parseLocalDate, getTodayLocal } from '@/src/utils/taskParser';
import { typography, colors, spacing, radius } from '@/src/theme';

interface TaskLineProps {
  line: string;
  lineIndex: number;
  metadata: TaskMetadata;
  onToggle: (lineIndex: number, newLine: string) => void;
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
    /^(.+?)(?:\s*📅|\s*⏳|\s*🔁|\s*✅|\s*➕|\s*⏫|\s*🔼|\s*🔽|\s*⏬|$)/
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
        ) : (
          <Circle size={20} color={colors.text.tertiary} strokeWidth={2} />
        )}
      </Pressable>

      <View style={styles.content}>
        <Text
          style={[
            styles.taskText,
            metadata.isChecked && styles.taskTextChecked,
          ]}
        >
          {displayText}
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
