# Schorl

A mobile-first task management app that uses plain text and the Obsidian Tasks markdown syntax. I built this for one user's needs: my own. I LOVE Obsidian and its task plugins, but it's too heavy for quick, ephemeral tasks, like a grocery list you'd traditionally put on paper.

> Disclaimer: 95% of this tool was generated with LLMs. If that turns you off, read no further.

## Motivation

Task management apps often lock your data in proprietary formats or require constant internet connectivity. Schorl takes a different approach: your tasks are stored as plain markdown text using the well-documented [Obsidian Tasks](https://publish.obsidian.md/tasks/) syntax. 

The goal is simple: a fast, clean mobile interface for managing tasks that respects the principle of data ownership.

## Prior Art

This project builds on established tools and conventions:

- **[Obsidian Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks)** - The syntax standard for task metadata (due dates, recurrence, priorities)
- **Plain text task management** - Inspired by todo.txt, Taskwarrior, and other text-based systems
- **Markdown-first** - Following the philosophy that your notes and tasks should be readable without special software

## Features

- **Obsidian Tasks syntax** - Full support for due dates, scheduled dates, recurrence patterns, and priorities
- **Mobile-optimized** - Built with React Native for iOS and web, with a focus on touch interfaces
- **Edit and Read modes** - Switch between raw markdown editing and a rendered task view
- **Smart task creation** - Type `@` on any task line to quickly add dates
- **Recurring tasks** - Automatic generation of next instances when you complete repeating tasks
- **Local-first** - Everything works offline, data stored on your device

Built for iOS and web (Linux) with a monospace, dark-themed interface.

## Tech Stack

- **[Expo](https://expo.dev)** - React Native framework for building cross-platform apps
- **Storage abstraction layer** - Clean interface (`StorageAPI`) designed to be swappable
  - **AsyncStorage** - Local-first offline persistence
  - **[Supabase](https://supabase.com)** - Cloud sync and authentication (optional)
  - Architecture allows easy replacement with other backends (Firebase, self-hosted, etc.)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm expo start
```

## License

MIT

---

AID Statement: Artificial Intelligence Tool: Claude Web, Claude Code, ChatGPT; Execution: Generated the vast majority of code. Generated placeholder icons..