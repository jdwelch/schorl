import { View, TextInput, Pressable, StyleSheet, Modal, Text, Platform } from 'react-native';
import { CheckSquare, Calendar, Repeat, Edit2, Eye } from 'lucide-react-native';
import { useRef, useState, useEffect, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { parseTaskLine, insertDueDate, insertRecurrence } from '@/src/utils/taskParser';

interface DateOption {
  label: string;
  date: Date;
}

function getDateOptions(): DateOption[] {
  const today = new Date();
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

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

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
}

export function Toolbar({ mode, onModeChange, onNewTask, onDatePicker, onRecurrence }: ToolbarProps) {
  return (
    <View style={styles.toolbar}>
      {mode === 'edit' && (
        <>
          <Pressable style={styles.toolbarButton} onPress={onNewTask}>
            <CheckSquare size={16} color="#9ca3af" strokeWidth={2} />
          </Pressable>
          <Pressable style={styles.toolbarButton} onPress={onDatePicker}>
            <Calendar size={16} color="#9ca3af" strokeWidth={2} />
          </Pressable>
          <Pressable style={styles.toolbarButton} onPress={onRecurrence}>
            <Repeat size={16} color="#9ca3af" strokeWidth={2} />
          </Pressable>
        </>
      )}

      <View style={styles.spacer} />

      <View style={styles.modeButtons}>
        <Pressable
          onPress={() => onModeChange('edit')}
          style={[styles.modeButton, mode === 'edit' && styles.modeButtonActive]}
        >
          <Edit2
            size={16}
            color={mode === 'edit' ? '#fff' : '#9ca3af'}
            strokeWidth={2}
          />
        </Pressable>
        <Pressable
          onPress={() => onModeChange('read')}
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
  );
}

interface MarkdownEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onToggleTask: (newContent: string) => void;
  mode: 'edit' | 'read';
  onModeChange: (mode: 'edit' | 'read') => void;
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
  },
  spacer: {
    flex: 1,
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
  recurrenceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  recurrenceLabel: {
    fontSize: 16,
    color: '#f3f4f6',
  },
  recurrenceNumberInput: {
    backgroundColor: '#1a1a1a',
    color: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minWidth: 60,
    textAlign: 'center',
  },
  recurrencePicker: {
    backgroundColor: '#1a1a1a',
    color: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minWidth: 100,
  },
});

export default function MarkdownEditor({
  content,
  onContentChange,
  onToggleTask,
  mode,
  onModeChange,
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

  const handleDateCancel = useCallback(() => {
    setShowDateModal(false);
    // Return focus to text input
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 0);
  }, []);

  const handleDateOptionSelect = useCallback((date: Date) => {
    const dateStr = date.toISOString().split('T')[0];

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
    const newTask = '- [ ] New task';
    let newContent: string;
    let newCursorPos: number;

    if (content.trim()) {
      newContent = content + '\n' + newTask;
      newCursorPos = newContent.length; // Position after "New task"
    } else {
      newContent = newTask;
      newCursorPos = newTask.length; // Position after "New task"
    }

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

      // Extract indentation from current line
      const indentMatch = currentLine.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';

      // Insert newline with new task checkbox
      const textAfterCursor = content.substring(cursorPosition);
      const newContent = `${textBeforeCursor}\n${indent}- [ ] ${textAfterCursor}`;

      onContentChange(newContent);

      // Move cursor to after the checkbox
      const newCursorPos = cursorPosition + 1 + indent.length + 6; // 1 for \n, 6 for "- [ ] "

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
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Set Recurrence</Text>

            <View style={styles.recurrenceInputRow}>
              <Text style={styles.recurrenceLabel}>Every</Text>
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
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingTop: 8,
                    paddingBottom: 8,
                    fontSize: 16,
                    minWidth: 100,
                  }}
                >
                  <option value="day">days</option>
                  <option value="week">weeks</option>
                  <option value="month">months</option>
                </select>
              ) : (
                <View style={styles.recurrencePicker}>
                  <Pressable onPress={() => setRecurrenceUnit('day')}>
                    <Text style={{ color: recurrenceUnit === 'day' ? '#3B82F6' : '#e5e7eb' }}>
                      days
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setRecurrenceUnit('week')}>
                    <Text style={{ color: recurrenceUnit === 'week' ? '#3B82F6' : '#e5e7eb' }}>
                      weeks
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setRecurrenceUnit('month')}>
                    <Text style={{ color: recurrenceUnit === 'month' ? '#3B82F6' : '#e5e7eb' }}>
                      months
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

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
