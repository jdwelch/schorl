# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Critical Rules

**NEVER run `npm run deploy` without explicitly asking the user first.** Always confirm before deploying to production.

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
- **Interface**: `StorageAPI` with three methods:
  - `getContent()` - Loads content (checks remote, falls back to local)
  - `saveContent(content)` - Saves with retry logic, returns `SaveResult` with conflict info
  - `saveContentLocal(content)` - Fast local-only save (used during typing)
  - `subscribe(onUpdate)` - Optional realtime subscription (returns unsubscribe function)
- **Current Implementation**: `supabaseStorageAPI` exported as `storage`
- **Storage Keys**: 
  - `@schorl:content` - Document content (local cache)
  - `@schorl:version` - Document version number
  - `@schorl:last-sync` - Last sync timestamp

**`src/utils/supabaseStorage.ts`** - Supabase backend implementation:
- **Authentication**: Gracefully falls back to local-only mode when not authenticated
- **Sync Strategy**: 
  - Optimistic local saves on every keystroke via `saveContentLocal()`
  - `saveContent()` syncs to Supabase with optimistic locking (version-based)
  - `getContent()` compares local vs remote version, uses newer
  - Realtime subscription via `subscribe()` updates local cache on remote changes
- **Conflict Resolution**: 
  - Optimistic locking using integer `version` column
  - Retry logic with exponential backoff (max 3 attempts)
  - Returns `hadConflict: true` if retries occurred
- **Database Schema**: Single `documents` table with columns:
  - `user_id` (uuid, primary key) - Supabase auth user ID
  - `content` (text) - Full markdown document
  - `version` (integer) - Incremented on each save for optimistic locking
  - `updated_at` (timestamp) - Auto-updated trigger
- **SSR Safety**: All Supabase operations check `typeof window === 'undefined'` and bail early
- **Helper Functions**:
  - `getSyncStatus()` - Returns last sync time, version, and remote existence
  - `syncLocalToRemote()` - Force-syncs local content to remote (useful after sign-in)

**`src/lib/supabase.ts`** - Supabase client setup:
- Platform-aware storage adapter (localStorage on web, AsyncStorage on native)
- Auth persistence enabled with auto-refresh
- Magic link detection enabled for web
- SSR-safe client creation with placeholder during server render

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

**All styling uses StyleSheet.create()** with centralized **design tokens** in `src/theme/`.

**Design Token System** (`src/theme/`):
- **`tokens.ts`** - Single source of truth for all design values
  - Typography: Font families, sizes (unitless dp), weights, line heights
  - Colors: Semantic color palette (e.g., `colors.text.primary` not `#e5e7eb`)
  - Spacing: Consistent scale (xs: 4, sm: 6, md: 8, lg: 12, xl: 16, xxl: 20)
  - Border radius: Corner radius values (sm: 4, md: 6, lg: 12)
- **`utils.ts`** - Scaling utilities for responsive sizing (PixelRatio-based)
- **`index.ts`** - Barrel export for easy imports

**Usage in components**:
```typescript
import { typography, colors, spacing, radius } from '@/src/theme';

const styles = StyleSheet.create({
  text: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.monospace,
  },
});
```

**Dark theme only**:
- All sizes are unitless and represent density-independent pixels (React Native does not support rem/em)
- Platform-specific fonts resolved once in tokens via `Platform.select()`
- Monospace font stack: `IBM Plex Mono, Roboto Mono, Menlo, monospace` (web), `Menlo` (iOS), `monospace` (Android)

**Headings**: All heading levels (h1-h6) share identical styling:
- Font size: 17 (1.2x base of 14)
- Font weight: 700 (bold)
- No visual hierarchy between heading levels

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
- **@supabase/supabase-js** - Backend client with realtime
- **AsyncStorage** - Local persistence and cache

### Important Implementation Details

1. **Auto-Save**: Content is saved locally on every keystroke via `saveContentLocal()`. Full sync to Supabase happens on blur or periodic intervals. Works offline and gracefully handles auth state.

2. **Cursor Position Tracking**: MarkdownEditor tracks cursor position via `onSelectionChange` to enable smart metadata insertion on the correct task line.

3. **Platform-Specific UI**: Use `Platform.OS === 'web'` checks for web vs mobile differences (e.g., HTML date input vs DateTimePicker).

4. **Recurring Task Logic**: When a task with `🔁` metadata is checked, the app creates a new unchecked task with an updated `⏳` scheduled date based on the recurrence pattern.

5. **Auto-Task Creation**: Pressing Enter while on a task line automatically creates a new task line with `- [ ]` and preserves indentation.

6. **Date Picker**:
   - **Trigger**: Typing `@` on a task line removes the `@` and opens the date picker
   - **Web**: Displays a keyboard-navigable popover with quick date shortcuts positioned near the toolbar
   - **Mobile**: Shows a touch-friendly modal with native date picker component
