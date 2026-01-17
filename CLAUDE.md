# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a mobile-first task management app built with Expo/React Native that uses **Obsidian Tasks markdown syntax** for task storage and management. The app targets iOS and web (Linux) equally, with Android deprioritized.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (choose platform from menu)
npm start

# Start for specific platform
npm run web      # Web development
npm run ios      # iOS simulator
npm run android  # Android emulator

# Linting
npm run lint
```

## Architecture

### Routing & Navigation

Uses **Expo Router** with file-based routing:
- `app/_layout.tsx` - Root layout with dark theme navigation config (header hidden)
- `app/index.tsx` - Single task management screen with Edit/Read mode toggle
  - Wrapped in `SafeAreaView` from `react-native-safe-area-context` to avoid status bar/notch on iOS
  - Uses `edges={['top']}` to only apply safe area to top edge

### Task Management System

**Obsidian Tasks Syntax** - Tasks follow the format:
```
- [ ] Task description 📅 2026-01-17 🔁 every week ⏫ ✅ 2026-01-17
```

Supported metadata:
- `📅` Due date (YYYY-MM-DD)
- `⏳` Scheduled date (YYYY-MM-DD)
- `🔁` Recurrence pattern (e.g., "every day", "every 2 weeks")
- `✅` Done date (auto-added when checked)
- `➕` Created date
- `⏫` Highest priority / `🔼` High / `🔽` Low / `⏬` Lowest

### Core Modules

**`src/utils/taskParser.ts`** - Critical parsing logic:
- `parseTaskLine()` - Extracts task metadata from markdown line
- `toggleTaskLine()` - Handles checking/unchecking, auto-adds done date
- `createRecurringTask()` - Generates new task instance when recurring task is completed
- Uses regex patterns to parse all Obsidian Tasks metadata

**`src/utils/storage.ts`** - Storage abstraction layer:
- Currently uses AsyncStorage for local persistence
- Designed to swap to Supabase backend later
- Exports `storage` object with `getContent()` and `saveContent()` methods
- Stores a single markdown document containing all tasks

**`src/types/task.types.ts`** - TypeScript interfaces:
- `TaskMetadata` - Parsed task information
- `TaskPriority` - Type-safe priority values

### Component Structure

**MarkdownEditor** (`src/components/MarkdownEditor.tsx`):
- Plain TextInput with toolbar
- Auto-inserts `- [ ]` when pressing Enter on task lines (preserves indentation)
- Typing `@` on task line triggers date picker:
  - **Web**: Keyboard-navigable popover with quick date options (Today, Tomorrow, Next Monday, This Weekend)
    - Navigate with Arrow Up/Down keys
    - Select with Enter key
    - Cancel with Escape key
    - Returns focus to editor after selection
  - **Mobile**: Touch-optimized modal with native DateTimePicker
- Toolbar buttons: checkbox, calendar, recurrence, bold, italic, link

**MarkdownRenderer** (`src/components/MarkdownRenderer.tsx`):
- Separates tasks from regular markdown
- Uses `react-native-markdown-display` for non-task content
- Tasks rendered with interactive TaskLine components

**TaskLine** (`src/components/TaskLine.tsx`):
- Interactive checkbox for toggling task completion
- Displays metadata as badges with color coding
- Overdue dates highlighted in red

### Editor Modes

**Edit Mode**: Plain text editor with markdown syntax
**Read Mode**: Rendered markdown + interactive task checkboxes

When checking a recurring task in read mode (`app/index.tsx:139-157`):
1. Task is marked complete with done date
2. `createRecurringTask()` generates new instance with updated scheduled date
3. New task inserted after completed task
4. Content is automatically saved to storage

### Styling Approach

**All styling uses StyleSheet.create()** - NativeWind/className not used due to React Native compatibility issues.

**Dark theme only** with monospace fonts:
- Backgrounds: `#1a1a1a` (main), `#262626` (surfaces)
- Text: `#e5e7eb` (primary), `#9ca3af` (secondary), `#6b7280` (tertiary)
- Borders: `#374151`
- Accent: `#3B82F6` (blue)
- Font stack: `IBM Plex Mono, Roboto Mono, Menlo, monospace` (web), `Menlo` (iOS), `monospace` (Android)

Use `Platform.select()` for platform-specific styling.

### Path Aliases

TypeScript configured with `@/*` alias mapping to root directory (tsconfig.json):
```typescript
import { storage } from '@/src/utils/storage';
```

### Key Dependencies

- **Expo SDK ~54.0** - Core framework
- **Expo Router ~6.0** - File-based routing
- **react-native-markdown-display** - Markdown rendering
- **@react-native-community/datetimepicker** - Native date picker
- **lucide-react-native** - Icons
- **AsyncStorage** - Local persistence

### Important Implementation Details

1. **Auto-Save**: Content is automatically saved to AsyncStorage whenever it changes in the editor.

2. **Cursor Position Tracking**: MarkdownEditor tracks cursor position via `onSelectionChange` to enable smart metadata insertion on the correct task line.

3. **Platform-Specific UI**: Use `Platform.OS === 'web'` checks for web vs mobile differences (e.g., HTML date input vs DateTimePicker).

4. **Recurring Task Logic**: When a task with `🔁` metadata is checked, the app creates a new unchecked task with an updated `⏳` scheduled date based on the recurrence pattern.

5. **Auto-Task Creation**: Pressing Enter while on a task line automatically creates a new task line with `- [ ]` and preserves indentation.

6. **Date Picker**:
   - **Trigger**: Typing `@` on a task line removes the `@` and opens the date picker
   - **Web**: Displays a keyboard-navigable popover with quick date shortcuts positioned near the toolbar
   - **Mobile**: Shows a touch-friendly modal with native date picker component
