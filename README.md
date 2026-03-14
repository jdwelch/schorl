<img src="assets/images/splash-icon.png" alt="Schorl crystal" width="80" />

# Schorl

A fast, clean mobile interface for managing tasks that respects the principle of data ownership. Built for one user's needs: my own. I LOVE Obsidian and its task plugins, but it's too heavy for quick, ephemeral tasks, like a grocery list you'd traditionally put on paper.

> Ultra important disclaimer: 95% of this tool was generated with LLMs. If that turns you off, read no further.

![Schorl on web and iOS](schorl-screenshot.png)

## Prior Art

This project wouldn't exist without these established tools and conventions:

- **[Obsidian Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks)** - The syntax standard for task metadata (due dates, recurrence, priorities)
- **Plain text task management** - Inspired by todo.txt, Taskwarrior, and other text-based systems
- **Markdown-first** - Following the philosophy that your notes and tasks should be readable without special software


## Features

- **Obsidian Tasks syntax** - Full support for due dates, scheduled dates, recurrence patterns, and priorities
- **Edit and Read modes** - Switch between raw markdown editing and a rendered task view
- **Smart task creation** - Type `@` on any task line to quickly add dates
- **Recurring tasks** - Automatic generation of next instances when you complete repeating tasks
- **Local-first** - Everything works offline, data stored on your device


## Tech

- **[Expo](https://expo.dev)**  - React Native framework
- **AsyncStorage** - Local-first offline persistence
- **[Supabase](https://supabase.com)** - Cloud sync and authentication (optional)


## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start
```

## Installing on iOS (Progressive Web App)

Install Schorl as a Progressive Web App for a native-like experience:

1. **Open in Safari** (required for iOS PWA support)
   - Navigate to your deployment URL
   
2. **Add to Home Screen**
   - Tap the Share button (□↑) at the bottom
   - Select "Add to Home Screen"
   - Tap "Add"

3. **Launch from your home screen**
   - Opens in standalone mode without browser chrome
   - Works offline with local storage
   - Optional cloud sync via email OTP authentication

## License

MIT

---

AID Statement: Artificial Intelligence Tools: Anthropic models, OpenAI models via various tools. Execution: Generated the vast majority of code. Generated placeholder icons.
