import {
  parseTaskLine,
  toggleTaskLine,
  insertDueDate,
  insertRecurrence,
  createRecurringTask,
  getTodayLocal,
  parseLocalDate,
} from '../utils/taskParser';

describe('taskParser', () => {
  describe('parseTaskLine', () => {
    it('parses unchecked task', () => {
      const result = parseTaskLine('- [ ] Buy groceries');
      expect(result.isTask).toBe(true);
      expect(result.isChecked).toBe(false);
      expect(result.description).toBe('Buy groceries');
    });

    it('parses checked task', () => {
      const result = parseTaskLine('- [x] Buy groceries');
      expect(result.isTask).toBe(true);
      expect(result.isChecked).toBe(true);
    });

    it('parses task with due date', () => {
      const result = parseTaskLine('- [ ] Buy groceries 📅 2026-01-31');
      expect(result.dueDate).toBe('2026-01-31');
    });

    it('parses task with scheduled date', () => {
      const result = parseTaskLine('- [ ] Buy groceries ⏳ 2026-01-31');
      expect(result.scheduledDate).toBe('2026-01-31');
    });

    it('parses task with recurrence', () => {
      const result = parseTaskLine('- [ ] Buy groceries 🔁 every week');
      expect(result.recurrence).toBe('every week');
    });

    it('parses task with done date', () => {
      const result = parseTaskLine('- [x] Buy groceries ✅ 2026-01-31');
      expect(result.doneDate).toBe('2026-01-31');
    });

    it('parses task with created date', () => {
      const result = parseTaskLine('- [ ] Buy groceries ➕ 2026-01-31');
      expect(result.createdDate).toBe('2026-01-31');
    });

    it('parses task with highest priority', () => {
      const result = parseTaskLine('- [ ] Urgent task ⏫');
      expect(result.priority).toBe('highest');
    });

    it('parses task with high priority', () => {
      const result = parseTaskLine('- [ ] Important task 🔼');
      expect(result.priority).toBe('high');
    });

    it('parses task with low priority', () => {
      const result = parseTaskLine('- [ ] Low priority task 🔽');
      expect(result.priority).toBe('low');
    });

    it('parses task with lowest priority', () => {
      const result = parseTaskLine('- [ ] Lowest priority task ⏬');
      expect(result.priority).toBe('lowest');
    });

    it('parses maybe task', () => {
      const result = parseTaskLine('- [ ] Maybe do this [?]');
      expect(result.isMaybe).toBe(true);
    });

    it('parses task with indentation', () => {
      const result = parseTaskLine('    - [ ] Nested task');
      expect(result.isTask).toBe(true);
      expect(result.description).toBe('Nested task');
    });

    it('returns non-task for regular text', () => {
      const result = parseTaskLine('Just some text');
      expect(result.isTask).toBe(false);
    });

    it('returns non-task for headers', () => {
      const result = parseTaskLine('# Header');
      expect(result.isTask).toBe(false);
    });

    it('parses complex task with multiple metadata', () => {
      const result = parseTaskLine('- [ ] Weekly review 📅 2026-02-01 🔁 every week ⏫');
      expect(result.isTask).toBe(true);
      expect(result.dueDate).toBe('2026-02-01');
      expect(result.recurrence).toBe('every week');
      expect(result.priority).toBe('highest');
    });
  });

  describe('toggleTaskLine', () => {
    it('checks unchecked task and adds done date', () => {
      const today = getTodayLocal();
      const result = toggleTaskLine('- [ ] Buy groceries');
      expect(result).toBe(`- [x] Buy groceries ✅ ${today}`);
    });

    it('unchecks checked task and removes done date', () => {
      const result = toggleTaskLine('- [x] Buy groceries ✅ 2026-01-31');
      expect(result).toBe('- [ ] Buy groceries');
    });

    it('preserves indentation', () => {
      const today = getTodayLocal();
      const result = toggleTaskLine('    - [ ] Nested task');
      expect(result).toBe(`    - [x] Nested task ✅ ${today}`);
    });

    it('returns non-task lines unchanged', () => {
      const result = toggleTaskLine('Just some text');
      expect(result).toBe('Just some text');
    });

    it('replaces existing done date when re-checking', () => {
      const today = getTodayLocal();
      const result = toggleTaskLine('- [ ] Task ✅ 2020-01-01');
      // First removes old date, then adds new one
      expect(result).toBe(`- [x] Task ✅ ${today}`);
    });
  });

  describe('insertDueDate', () => {
    it('adds due date to task without one', () => {
      const result = insertDueDate('- [ ] Buy groceries', '2026-02-01');
      expect(result).toBe('- [ ] Buy groceries 📅 2026-02-01');
    });

    it('replaces existing due date', () => {
      const result = insertDueDate('- [ ] Buy groceries 📅 2026-01-01', '2026-02-01');
      expect(result).toBe('- [ ] Buy groceries 📅 2026-02-01');
    });
  });

  describe('insertRecurrence', () => {
    it('adds recurrence to task without one', () => {
      const result = insertRecurrence('- [ ] Buy groceries', 'every week');
      expect(result).toBe('- [ ] Buy groceries 🔁 every week');
    });

    it('replaces existing recurrence', () => {
      const result = insertRecurrence('- [ ] Buy groceries 🔁 every day', 'every week');
      expect(result).toBe('- [ ] Buy groceries 🔁 every week');
    });
  });

  describe('createRecurringTask', () => {
    // Mock today's date for consistent tests
    const mockToday = new Date(2026, 0, 31); // Jan 31, 2026
    
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockToday);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns null for non-recurring task', () => {
      const result = createRecurringTask('- [x] Buy groceries ✅ 2026-01-31');
      expect(result).toBeNull();
    });

    it('returns null for non-task line', () => {
      const result = createRecurringTask('Just some text');
      expect(result).toBeNull();
    });

    it('creates task for "every day" recurrence', () => {
      const result = createRecurringTask('- [x] Daily task 🔁 every day ✅ 2026-01-31');
      expect(result).toBe('- [ ] Daily task ⏳ 2026-02-01 🔁 every day');
    });

    it('creates task for "every 3 days" recurrence', () => {
      const result = createRecurringTask('- [x] Task 🔁 every 3 days ✅ 2026-01-31');
      expect(result).toBe('- [ ] Task ⏳ 2026-02-03 🔁 every 3 days');
    });

    it('creates task for "every week" recurrence', () => {
      const result = createRecurringTask('- [x] Weekly task 🔁 every week ✅ 2026-01-31');
      expect(result).toBe('- [ ] Weekly task ⏳ 2026-02-07 🔁 every week');
    });

    it('creates task for "every 2 weeks" recurrence', () => {
      const result = createRecurringTask('- [x] Biweekly task 🔁 every 2 weeks ✅ 2026-01-31');
      expect(result).toBe('- [ ] Biweekly task ⏳ 2026-02-14 🔁 every 2 weeks');
    });

    it('creates task for "every month" recurrence', () => {
      // Note: Jan 31 + 1 month = Mar 3 (Feb has 28 days, so JS rolls over)
      // This is JavaScript Date behavior - month overflow
      const result = createRecurringTask('- [x] Monthly task 🔁 every month ✅ 2026-01-31');
      expect(result).toBe('- [ ] Monthly task ⏳ 2026-03-03 🔁 every month');
    });

    it('creates task for "every month" recurrence from mid-month', () => {
      // Mid-month dates work predictably
      jest.setSystemTime(new Date(2026, 0, 15)); // Jan 15, 2026
      const result = createRecurringTask('- [x] Monthly task 🔁 every month ✅ 2026-01-15');
      expect(result).toBe('- [ ] Monthly task ⏳ 2026-02-15 🔁 every month');
    });

    it('updates existing scheduled date', () => {
      const result = createRecurringTask('- [x] Task ⏳ 2026-01-31 🔁 every week ✅ 2026-01-31');
      expect(result).toBe('- [ ] Task ⏳ 2026-02-07 🔁 every week');
    });

    it('removes done date from new task', () => {
      const result = createRecurringTask('- [x] Task 🔁 every day ✅ 2026-01-31');
      expect(result).not.toContain('✅');
    });

    it('creates unchecked task', () => {
      const result = createRecurringTask('- [x] Task 🔁 every day ✅ 2026-01-31');
      expect(result).toMatch(/^- \[ \]/);
    });
  });

  describe('getTodayLocal', () => {
    it('returns date in YYYY-MM-DD format', () => {
      const result = getTodayLocal();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('parseLocalDate', () => {
    it('parses date string to Date object', () => {
      const result = parseLocalDate('2026-01-31');
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January = 0
      expect(result.getDate()).toBe(31);
    });
  });
});
