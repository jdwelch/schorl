import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { TaskMetadata } from '@/src/types/task.types';
import { toggleTaskLine } from '@/src/utils/taskParser';

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
    gap: 12,
    paddingVertical: 4,
  },
  checkbox: {
    marginTop: 2,
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  taskText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#e5e7eb',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  taskTextChecked: {
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  metadata: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#374151',
  },
  badgeText: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  dueBadge: {
    backgroundColor: '#78350f',
  },
  dueBadgeText: {
    color: '#fcd34d',
  },
  overdueBadge: {
    backgroundColor: '#7f1d1d',
  },
  overdueBadgeText: {
    color: '#fca5a5',
  },
  priorityBadge: {
    backgroundColor: '#374151',
  },
  priorityHighest: {
    backgroundColor: '#7f1d1d',
  },
  priorityHigh: {
    backgroundColor: '#78350f',
  },
  priorityLow: {
    backgroundColor: '#1e3a8a',
  },
  priorityLowest: {
    backgroundColor: '#3730a3',
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
    const dueDate = new Date(metadata.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
          <CheckCircle2 size={20} color="#10B981" strokeWidth={2} />
        ) : (
          <Circle size={20} color="#6b7280" strokeWidth={2} />
        )}
      </Pressable>

      <View style={styles.content}>
        <Text
          style={[
            styles.taskText,
            metadata.isChecked && styles.taskTextChecked,
          ]}
          numberOfLines={2}
        >
          {displayText}
        </Text>

        {(metadata.priority || metadata.dueDate || metadata.scheduledDate || metadata.recurrence || metadata.createdDate || metadata.doneDate) && (
          <View style={styles.metadata}>
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
              <View style={[styles.badge, dueDateStatus === 'overdue' && styles.overdueBadge]}>
                <Text
                  style={[
                    styles.badgeText,
                    dueDateStatus === 'overdue' && styles.overdueBadgeText,
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
        )}
      </View>
    </View>
  );
}
