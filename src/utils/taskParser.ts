import { TaskMetadata, TaskPriority } from '../types/task.types';

// Get today's date in local timezone as YYYY-MM-DD
export function getTodayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse YYYY-MM-DD string to Date object at midnight in local timezone
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Regex patterns for task parsing
const TASK_LINE_REGEX = /^(\s*)[-*+]\s+\[([ xX])\]\s+(.+)$/;
const DUE_DATE_REGEX = /📅\s*(\d{4}-\d{2}-\d{2})/;
const SCHEDULED_DATE_REGEX = /⏳\s*(\d{4}-\d{2}-\d{2})/;
const RECURRENCE_REGEX = /🔁\s*(.+?)(?=\s*[📅⏳✅➕⏫🔼🔽⏬]|$)/;
const DONE_DATE_REGEX = /✅\s*(\d{4}-\d{2}-\d{2})/;
const CREATED_DATE_REGEX = /➕\s*(\d{4}-\d{2}-\d{2})/;
const PRIORITY_REGEX = /(⏫|🔼|🔽|⏬)/;
const MAYBE_REGEX = /\[\?\]/;

const PRIORITY_MAP: Record<string, TaskPriority> = {
  '⏫': 'highest',
  '🔼': 'high',
  '🔽': 'low',
  '⏬': 'lowest',
};

export function parseTaskLine(line: string): TaskMetadata {
  const match = line.match(TASK_LINE_REGEX);

  if (!match) {
    return {
      isTask: false,
      isChecked: false,
      description: line,
    };
  }

  const [, , checkbox, description] = match;
  const isChecked = checkbox.toLowerCase() === 'x';

  const dueDate = description.match(DUE_DATE_REGEX)?.[1];
  const scheduledDate = description.match(SCHEDULED_DATE_REGEX)?.[1];
  const recurrence = description.match(RECURRENCE_REGEX)?.[1]?.trim();
  const doneDate = description.match(DONE_DATE_REGEX)?.[1];
  const createdDate = description.match(CREATED_DATE_REGEX)?.[1];

  const priorityMatch = description.match(PRIORITY_REGEX)?.[1];
  const priority = priorityMatch ? PRIORITY_MAP[priorityMatch] : undefined;

  const isMaybe = MAYBE_REGEX.test(description);

  return {
    isTask: true,
    isChecked,
    description,
    dueDate,
    scheduledDate,
    recurrence,
    doneDate,
    createdDate,
    priority,
    isMaybe,
  };
}

export function toggleTaskLine(line: string): string {
  const match = line.match(TASK_LINE_REGEX);

  if (!match) {
    return line;
  }

  const [, indent, checkbox, description] = match;
  const wasChecked = checkbox.toLowerCase() === 'x';
  const newCheckbox = wasChecked ? ' ' : 'x';

  let newDescription = description;

  // If checking the task, add done date if not present
  if (!wasChecked) {
    const today = getTodayLocal();
    // Remove existing done date if any
    newDescription = newDescription.replace(/\s*✅\s*\d{4}-\d{2}-\d{2}/g, '');
    // Add new done date
    newDescription = `${newDescription} ✅ ${today}`.trim();
  } else {
    // If unchecking, remove done date
    newDescription = newDescription.replace(/\s*✅\s*\d{4}-\d{2}-\d{2}/g, '').trim();
  }

  return `${indent}- [${newCheckbox}] ${newDescription}`;
}

export function insertDueDate(line: string, date: string): string {
  // Remove existing due date if present
  let cleanedLine = line.replace(/\s*📅\s*\d{4}-\d{2}-\d{2}/, '');

  // Append new due date
  return `${cleanedLine} 📅 ${date}`.trim();
}

export function insertRecurrence(line: string, recurrence: string): string {
  // Remove existing recurrence if present
  let cleanedLine = line.replace(/\s*🔁\s*.+?(?=\s*[📅⏳✅]|$)/, '');

  // Append new recurrence
  return `${cleanedLine} 🔁 ${recurrence}`.trim();
}

export function createRecurringTask(line: string): string | null {
  const metadata = parseTaskLine(line);

  // Only create recurring task if the original task has recurrence
  if (!metadata.isTask || !metadata.recurrence) {
    return null;
  }

  // Parse the recurrence pattern
  const recurrence = metadata.recurrence.toLowerCase();
  let nextDate: Date | null = null;

  // Start from today in local timezone
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Handle "every X day(s)" pattern
  const everyDayMatch = recurrence.match(/every\s+(\d+)\s*days?/);
  if (everyDayMatch) {
    const days = parseInt(everyDayMatch[1], 10);
    nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + days);
  }

  // Handle "every day" (singular) pattern
  if (!nextDate && recurrence === 'every day') {
    nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + 1);
  }

  // Handle "every X week(s)" pattern
  const everyWeekMatch = recurrence.match(/every\s+(\d+)\s*weeks?/);
  if (!nextDate && everyWeekMatch) {
    const weeks = parseInt(everyWeekMatch[1], 10);
    nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + (weeks * 7));
  }

  // Handle "every week" (singular) pattern
  if (!nextDate && recurrence === 'every week') {
    nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + 7);
  }

  // Handle "every X month(s)" pattern
  const everyMonthMatch = recurrence.match(/every\s+(\d+)\s*months?/);
  if (!nextDate && everyMonthMatch) {
    const months = parseInt(everyMonthMatch[1], 10);
    nextDate = new Date(today);
    nextDate.setMonth(nextDate.getMonth() + months);
  }

  // Handle "every month" (singular) pattern
  if (!nextDate && recurrence === 'every month') {
    nextDate = new Date(today);
    nextDate.setMonth(nextDate.getMonth() + 1);
  }

  if (!nextDate) {
    return null;
  }

  // Format as YYYY-MM-DD in local timezone
  const year = nextDate.getFullYear();
  const month = String(nextDate.getMonth() + 1).padStart(2, '0');
  const day = String(nextDate.getDate()).padStart(2, '0');
  const nextDateStr = `${year}-${month}-${day}`;

  // Create new unchecked task with updated scheduled date
  let newTaskDescription = metadata.description;

  // Remove done date
  newTaskDescription = newTaskDescription.replace(/\s*✅\s*\d{4}-\d{2}-\d{2}/g, '');

  // Update scheduled date if present, otherwise add it
  if (metadata.scheduledDate) {
    newTaskDescription = newTaskDescription.replace(/⏳\s*\d{4}-\d{2}-\d{2}/, `⏳ ${nextDateStr}`);
  } else {
    // Add scheduled date before recurrence
    newTaskDescription = newTaskDescription.replace(/🔁/, `⏳ ${nextDateStr} 🔁`);
  }

  return `- [ ] ${newTaskDescription.trim()}`;
}
