import { View, TextInput, Pressable, StyleSheet, Modal, Text, Platform, Dimensions } from 'react-native';
import { CheckSquare, Calendar, Repeat, Edit2, Eye, Clock } from 'lucide-react-native';
import { useRef, useState, useEffect, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { parseTaskLine, insertDueDate, insertRecurrence } from '@/src/utils/taskParser';

// Detect if we're on a mobile device (including mobile web)
const isMobile = Platform.OS !== 'web' || Dimensions.get('window').width < 768;

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label?: string;
  onPress?: () => void;
  active?: boolean;
  variant?: 'default' | 'mode';
}

function ToolbarButton({ icon, label, onPress, active = false, variant = 'default' }: ToolbarButtonProps) {
  const buttonStyle = variant === 'mode' ? styles.modeButton : styles.toolbarButton;
  const activeStyle = active ? styles.filterButtonActive : undefined;

  return (
    <Pressable style={[buttonStyle, activeStyle]} onPress={onPress}>
      {isMobile || !label ? (
        icon
      ) : (
        <View style={styles.toolbarButtonContent}>
          {icon}
          <Text style={[styles.toolbarButtonText, active && styles.filterButtonTextActive]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

interface DateOption {
  label: string;
  date: Date;
}

function getDateOptions(): DateOption[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Find next Monday
  const nextMonday = new Date(today);
  const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7;
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);

  // Find this weekend (Saturday)
  const thisWeekend = new Date(today);
  const daysUntilSaturday = (6 - thisWeekend.getDay() + 7) % 7;
  thisWeekend.setDate(thisWeekend.getDate() + daysUntilSaturday);

  // Format date in local timezone as YYYY-MM-DD
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return [
    { label: `Today ${formatDate(today)}`, date: today },
    { label: `Tomorrow ${formatDate(tomorrow)}`, date: tomorrow },
    { label: `Next Monday ${formatDate(nextMonday)}`, date: nextMonday },
    { label: `This Weekend ${formatDate(thisWeekend)}`, date: thisWeekend },
  ];
}

interface ToolbarProps {
  mode: 'edit' | 'read';
  onModeChange: (mode: 'edit' | 'read') => void;
  onNewTask?: () => void;
  onDatePicker?: () => void;
  onRecurrence?: () => void;
  syncStatusComponent?: React.ReactNode;
  filterDue?: boolean;
  filterScheduled?: boolean;
  onFilterDueToggle?: () => void;
  onFilterScheduledToggle?: () => void;
}

export function Toolbar({ mode, onModeChange, onNewTask, onDatePicker, onRecurrence, syncStatusComponent, filterDue, filterScheduled, onFilterDueToggle, onFilterScheduledToggle }: ToolbarProps) {
  const iconSize = isMobile ? 16 : 12;
  
  return (
    <View style={styles.toolbar}>
      {/* Left side: mode toggle */}
      <ToolbarButton
        icon={mode === 'edit' ? <Eye size={iconSize} color="#9ca3af" strokeWidth={2} /> : <Edit2 size={iconSize} color="#9ca3af" strokeWidth={2} />}
        label={mode === 'edit' ? 'View' : 'Edit'}
        onPress={() => onModeChange(mode === 'edit' ? 'read' : 'edit')}
        variant="mode"
      />

      {/* Action buttons (edit mode only) */}
      {mode === 'edit' && (
        <>
          <ToolbarButton
            icon={<CheckSquare size={iconSize} color="#9ca3af" strokeWidth={2} />}
            label="New Task"
            onPress={onNewTask}
          />
          <ToolbarButton
            icon={<Calendar size={iconSize} color="#9ca3af" strokeWidth={2} />}
            label="Date"
            onPress={onDatePicker}
          />
          <ToolbarButton
            icon={<Repeat size={iconSize} color="#9ca3af" strokeWidth={2} />}
            label="Repeat"
            onPress={onRecurrence}
          />
        </>
      )}

      {/* Filter buttons (read mode only) */}
      {mode === 'read' && (
        <>
          <ToolbarButton
            icon={<Calendar size={iconSize} color={filterDue ? '#ffffff' : '#9ca3af'} strokeWidth={2} />}
            label="Due Today/Overdue"
            onPress={onFilterDueToggle}
            active={filterDue}
          />
          <ToolbarButton
            icon={<Clock size={iconSize} color={filterScheduled ? '#ffffff' : '#9ca3af'} strokeWidth={2} />}
            label="Scheduled Today/Past"
            onPress={onFilterScheduledToggle}
            active={filterScheduled}
          />
        </>
      )}

      {/* Flexible spacer */}
      <View style={styles.spacer} />

      {/* Right side: sync status */}
      {syncStatusComponent}
    </View>
  );
}

interface MarkdownEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onToggleTask: (newContent: string) => void;
  mode: 'edit' | 'read';
  onModeChange: (mode: 'edit' | 'read') => void;
  initialCursorPosition?: number;
  onCursorPositionChange?: (position: number) => void;
  syncStatusComponent?: React.ReactNode;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  toolbar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#262626',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    alignItems: 'center',
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#374151',
  },
  toolbarButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbarButtonText: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  spacer: {
    flex: 1,
  },
  modeButton: {
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#374151',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  editor: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#e5e7eb',
    textAlignVertical: 'top',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 20,
    minWidth: 300,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#f3f4f6',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#374151',
  },
  modalButtonConfirm: {
    backgroundColor: '#3B82F6',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  modalButtonTextConfirm: {
    color: '#fff',
  },
  datePopover: {
    position: 'absolute',
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    padding: 4,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    ...Platform.select({
      web: {
        // @ts-ignore - web-specific
        outline: 'none',
      },
    }),
  },
  dateOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
  },
  dateOptionSelected: {
    backgroundColor: '#3B82F6',
  },
  dateOptionText: {
    fontSize: 14,
    color: '#e5e7eb',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  recurrenceModalContent: {
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 20,
    width: 280,
    borderWidth: 1,
    borderColor: '#374151',
  },
  recurrenceLabel: {
    fontSize: 16,
    color: '#f3f4f6',
    marginBottom: 12,
    textAlign: 'center',
  },
  recurrenceNumberInput: {
    backgroundColor: '#1a1a1a',
    color: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  recurrencePicker: {
    backgroundColor: '#1a1a1a',
    marginBottom: 16,
    height: 150,
  },
  recurrencePickerItem: {
    color: '#e5e7eb',
    fontSize: 18,
  },
});

export default function MarkdownEditor({
  content,
  onContentChange,
  onToggleTask,
  mode,
  onModeChange,
  initialCursorPosition,
  onCursorPositionChange,
  syncStatusComponent,
}: MarkdownEditorProps) {
  const textInputRef = useRef<TextInput>(null);
  const popoverRef = useRef<View>(null);
  const cursorPositionRef = useRef<number>(0);
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateOptions] = useState<DateOption[]>(getDateOptions());
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState('1');
  const [recurrenceUnit, setRecurrenceUnit] = useState<'day' | 'week' | 'month'>('day');

  // Handle selection updates after content changes
  useEffect(() => {
    if (pendingSelectionRef.current) {
      const sel = pendingSelectionRef.current;
      pendingSelectionRef.current = null;

      // Apply selection after content has rendered
      setSelection(sel);
      setCursorPosition(sel.start);
      cursorPositionRef.current = sel.start;

      // Focus the input (critical for iOS)
      requestAnimationFrame(() => {
        textInputRef.current?.focus();
      });
    }
  }, [content]);

  // Restore cursor position when switching back to edit mode (only on mount)
  useEffect(() => {
    if (initialCursorPosition !== undefined && initialCursorPosition > 0) {
      // Set selection to restore cursor position
      setSelection({ start: initialCursorPosition, end: initialCursorPosition });
      setCursorPosition(initialCursorPosition);
      cursorPositionRef.current = initialCursorPosition;

      // Focus the input
      requestAnimationFrame(() => {
        textInputRef.current?.focus();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Report cursor position to parent when component is about to unmount
  useEffect(() => {
    return () => {
      // Save cursor position when leaving edit mode
      if (onCursorPositionChange) {
        onCursorPositionChange(cursorPositionRef.current);
      }
    };
  }, [onCursorPositionChange]);

  const handleDateCancel = useCallback(() => {
    setShowDateModal(false);
    // Return focus to text input
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 0);
  }, []);

  const handleDateOptionSelect = useCallback((date: Date) => {
    // Format date in local timezone as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Find which line the cursor is on using the ref
    const textBeforeCursor = content.substring(0, cursorPositionRef.current);
    const lines = content.split('\n');
    let currentLineIndex = textBeforeCursor.split('\n').length - 1;

    if (currentLineIndex < 0 || currentLineIndex >= lines.length) {
      currentLineIndex = lines.length - 1;
    }

    const currentLine = lines[currentLineIndex];

    // Check if line starts with task checkbox (even if empty)
    const isTaskLine = /^\s*[-*+]\s+\[([ xX])\]/.test(currentLine);

    // Add due date if line has task checkbox
    if (isTaskLine) {
      const updatedLine = insertDueDate(currentLine, dateStr);
      lines[currentLineIndex] = updatedLine;
      onContentChange(lines.join('\n'));
    }

    setShowDateModal(false);

    // Return focus to text input
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 0);
  }, [content, onContentChange]);

  // Focus popover when it opens on web
  useEffect(() => {
    if (showDateModal && Platform.OS === 'web' && popoverRef.current) {
      // Give focus to the popover container
      const popoverElement = popoverRef.current as any;
      if (popoverElement && popoverElement.focus) {
        setTimeout(() => popoverElement.focus(), 0);
      }
    }
  }, [showDateModal]);

  // Handle keyboard navigation in date popover
  useEffect(() => {
    if (!showDateModal || Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedOptionIndex((prev) => Math.min(prev + 1, dateOptions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedOptionIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleDateOptionSelect(dateOptions[selectedOptionIndex].date);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleDateCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDateModal, selectedOptionIndex, dateOptions, handleDateOptionSelect, handleDateCancel]);

  const handleNewTaskClick = () => {
    // Find which line the cursor is on
    const textBeforeCursor = content.substring(0, cursorPositionRef.current);
    const lines = content.split('\n');
    let currentLineIndex = textBeforeCursor.split('\n').length - 1;

    // Ensure we're within bounds
    if (currentLineIndex < 0) {
      currentLineIndex = 0;
    }
    if (currentLineIndex >= lines.length) {
      currentLineIndex = lines.length - 1;
    }

    const currentLine = lines[currentLineIndex] || '';

    // Check if line is already a task
    const metadata = parseTaskLine(currentLine);
    if (metadata.isTask) {
      // Already a task, do nothing
      return;
    }

    // Get the text content (strip all leading whitespace for flat list)
    const lineText = currentLine.trimStart();

    let newLine: string;
    if (lineText === '') {
      // Blank line - just add checkbox
      newLine = '- [ ] ';
    } else {
      // Line has text - prepend checkbox
      newLine = `- [ ] ${lineText}`;
    }

    // Replace the line
    lines[currentLineIndex] = newLine;
    const newContent = lines.join('\n');

    // Position cursor at end of the modified line
    const textBeforeLine = lines.slice(0, currentLineIndex).join('\n');
    const newCursorPos = (textBeforeLine ? textBeforeLine.length + 1 : 0) + newLine.length;

    // Set pending selection to apply after content updates
    pendingSelectionRef.current = { start: newCursorPos, end: newCursorPos };

    // Update content (useEffect will handle selection and focus)
    onToggleTask(newContent);
  };


  const handleDatePickerOpen = () => {
    // Store the current cursor position in ref before opening modal
    cursorPositionRef.current = cursorPosition;
    setShowDateModal(true);
    setSelectedDate(new Date());
    setSelectedOptionIndex(0);
  };

  const handleContentChangeWithTrigger = (newContent: string) => {
    // Check if user just typed "@" on a task line
    const diff = newContent.length - content.length;
    if (diff === 1) {
      // Find where the new character was inserted
      let insertPos = 0;
      for (let i = 0; i < newContent.length; i++) {
        if (i >= content.length || newContent[i] !== content[i]) {
          insertPos = i;
          break;
        }
      }

      if (newContent[insertPos] === '@') {
        // Find which line the cursor is on
        const textBeforeCursor = newContent.substring(0, insertPos + 1);
        const lines = newContent.split('\n');
        const currentLineIndex = textBeforeCursor.split('\n').length - 1;

        if (currentLineIndex >= 0 && currentLineIndex < lines.length) {
          const currentLine = lines[currentLineIndex];
          const metadata = parseTaskLine(currentLine);

          if (metadata.isTask) {
            // Remove the "@" character
            const withoutAt = newContent.substring(0, insertPos) + newContent.substring(insertPos + 1);

            // First update the content without @
            onContentChange(withoutAt);

            // Update cursor position state and ref to where @ was typed (now removed)
            setCursorPosition(insertPos);
            cursorPositionRef.current = insertPos;

            // Open date picker after a brief delay to let state update
            setTimeout(() => {
              setShowDateModal(true);
              setSelectedDate(new Date());
              setSelectedOptionIndex(0);
            }, 10);
            return;
          }
        }
      }
    }

    onContentChange(newContent);
  };

  const handleRecurrenceOpen = () => {
    setShowRecurrenceModal(true);
    setRecurrenceInterval('1');
    setRecurrenceUnit('day');
  };

  const handleRecurrenceConfirm = () => {
    // Build recurrence string
    const interval = parseInt(recurrenceInterval, 10);
    let recurrenceStr = '';

    if (interval === 1) {
      recurrenceStr = `every ${recurrenceUnit}`;
    } else {
      const unit = recurrenceUnit === 'day' ? 'days' : recurrenceUnit === 'week' ? 'weeks' : 'months';
      recurrenceStr = `every ${interval} ${unit}`;
    }

    // Find which line the cursor is on
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lines = content.split('\n');
    let currentLineIndex = textBeforeCursor.split('\n').length - 1;

    if (currentLineIndex < 0 || currentLineIndex >= lines.length) {
      currentLineIndex = lines.length - 1;
    }

    const currentLine = lines[currentLineIndex];
    const metadata = parseTaskLine(currentLine);

    // Only add recurrence if it's a task
    if (metadata.isTask) {
      const updatedLine = insertRecurrence(currentLine, recurrenceStr);
      lines[currentLineIndex] = updatedLine;
      onContentChange(lines.join('\n'));
    }

    setShowRecurrenceModal(false);
  };

  const handleRecurrenceCancel = () => {
    setShowRecurrenceModal(false);
  };

  const handleKeyPress = (e: any) => {
    // Only handle Enter key
    if (e.nativeEvent.key !== 'Enter') {
      return;
    }

    // Find which line the cursor is on
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lines = content.split('\n');
    const currentLineIndex = textBeforeCursor.split('\n').length - 1;

    if (currentLineIndex < 0 || currentLineIndex >= lines.length) {
      return;
    }

    const currentLine = lines[currentLineIndex];
    const metadata = parseTaskLine(currentLine);

    // If on a task line, insert a new task line
    if (metadata.isTask) {
      e.preventDefault();

      // Insert newline with new task checkbox (no indentation for flat list)
      const textAfterCursor = content.substring(cursorPosition);
      const newContent = `${textBeforeCursor}\n- [ ] ${textAfterCursor}`;

      onContentChange(newContent);

      // Move cursor to after the checkbox
      const newCursorPos = cursorPosition + 1 + 6; // 1 for \n, 6 for "- [ ] "

      setTimeout(() => {
        if (Platform.OS === 'web') {
          // For web, use the underlying DOM element
          const input = textInputRef.current as any;
          if (input && input.setSelectionRange) {
            input.setSelectionRange(newCursorPos, newCursorPos);
          }
        } else {
          // For native, update cursor position state which will trigger re-render
          setCursorPosition(newCursorPos);
        }
      }, 0);
    }
  };

  // Both web and mobile use simple TextInput
  return (
    <View style={styles.container}>
      <Toolbar
        mode={mode}
        onModeChange={onModeChange}
        onNewTask={handleNewTaskClick}
        onDatePicker={handleDatePickerOpen}
        onRecurrence={handleRecurrenceOpen}
        syncStatusComponent={syncStatusComponent}
      />

      <TextInput
        ref={textInputRef}
        style={styles.editor}
        value={content}
        selection={selection}
        onChangeText={handleContentChangeWithTrigger}
        onSelectionChange={(event) => {
          const pos = event.nativeEvent.selection.start;
          setCursorPosition(pos);
          cursorPositionRef.current = pos;
          // Clear controlled selection after user moves cursor
          if (selection) {
            setSelection(undefined);
          }
        }}
        onKeyPress={handleKeyPress}
        placeholder="Start typing your tasks here..."
        placeholderTextColor="#6b7280"
        multiline
        textAlignVertical="top"
      />

      {/* Date picker - Popover for web, Modal for mobile */}
      {Platform.OS === 'web' ? (
        showDateModal && (
          <>
            <Pressable
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999,
              }}
              onPress={handleDateCancel}
            />
            <View
              ref={popoverRef}
              style={[styles.datePopover, { top: 60, left: 16, zIndex: 1000 }]}
              // @ts-ignore - web-specific props
              tabIndex={0}
            >
              {dateOptions.map((option, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.dateOption,
                    selectedOptionIndex === index && styles.dateOptionSelected,
                  ]}
                  onPress={() => handleDateOptionSelect(option.date)}
                >
                  <Text style={styles.dateOptionText}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )
      ) : (
        showDateModal && (
          <Modal
            visible={showDateModal}
            transparent
            animationType="fade"
            onRequestClose={handleDateCancel}
          >
            <Pressable style={styles.modalOverlay} onPress={handleDateCancel}>
              <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                <Text style={styles.modalTitle}>Select Due Date</Text>

                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={(_event, date) => {
                    if (date) {
                      setSelectedDate(date);
                    }
                  }}
                />

                <View style={styles.modalButtons}>
                  <Pressable
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={handleDateCancel}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={() => handleDateOptionSelect(selectedDate)}
                  >
                    <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                      Confirm
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        )
      )}

      <Modal
        visible={showRecurrenceModal}
        transparent
        animationType="fade"
        onRequestClose={handleRecurrenceCancel}
      >
        <Pressable style={styles.modalOverlay} onPress={handleRecurrenceCancel}>
          <Pressable style={styles.recurrenceModalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Set Recurrence</Text>

            <Text style={styles.recurrenceLabel}>Repeat every</Text>

            <TextInput
              style={styles.recurrenceNumberInput}
              value={recurrenceInterval}
              onChangeText={setRecurrenceInterval}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor="#6b7280"
            />

            {Platform.OS === 'web' ? (
              <select
                value={recurrenceUnit}
                onChange={(e) => setRecurrenceUnit(e.target.value as 'day' | 'week' | 'month')}
                style={{
                  backgroundColor: '#1a1a1a',
                  color: '#e5e7eb',
                  border: '1px solid #374151',
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 16,
                  width: '100%',
                  marginBottom: 16,
                }}
              >
                <option value="day">days</option>
                <option value="week">weeks</option>
                <option value="month">months</option>
              </select>
            ) : (
              <Picker
                selectedValue={recurrenceUnit}
                onValueChange={(itemValue) => setRecurrenceUnit(itemValue)}
                style={styles.recurrencePicker}
                itemStyle={styles.recurrencePickerItem}
              >
                <Picker.Item label="days" value="day" />
                <Picker.Item label="weeks" value="week" />
                <Picker.Item label="months" value="month" />
              </Picker>
            )}

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleRecurrenceCancel}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleRecurrenceConfirm}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                  Confirm
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
