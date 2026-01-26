export type TaskPriority = 'highest' | 'high' | 'low' | 'lowest';

export interface TaskMetadata {
  isTask: boolean;
  isChecked: boolean;
  description: string;
  dueDate?: string;      // YYYY-MM-DD
  scheduledDate?: string; // YYYY-MM-DD
  recurrence?: string;    // e.g., "every week"
  doneDate?: string;      // YYYY-MM-DD
  priority?: TaskPriority; // ⏫ highest, 🔼 high, 🔽 low, ⏬ lowest
  createdDate?: string;   // YYYY-MM-DD
  isMaybe?: boolean;      // true when [?] is present
}
