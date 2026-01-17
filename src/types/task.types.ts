export type TaskPriority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';

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
}

export interface TaskList {
  id: string;
  title: string;
  markdownContent: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListsContextType {
  taskLists: TaskList[];
  currentTaskList: TaskList | null;
  setCurrentTaskList: (taskList: TaskList | null) => void;
  createTaskList: (title: string) => Promise<TaskList>;
  updateTaskList: (id: string, content: string) => Promise<void>;
  deleteTaskList: (id: string) => Promise<void>;
  addTaskList: (taskList: TaskList) => void;
}
