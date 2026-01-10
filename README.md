# Folder Kanban Plugin

An Obsidian plugin that automatically creates kanban boards from your folder structure. Cards are automatically generated from notes in subfolders and tagged with the folder name.

## Features

- 📁 **Automatic Card Generation**: All notes in subfolders become kanban cards
- 🏷️ **Auto-Tagging**: Cards are automatically tagged with their subfolder name
- 🎯 **Smart Column Detection**: Detects appropriate columns based on folder context
  - Learning folders → "To Learn | Learning | Mastered"
  - Entertainment folders → "Want To Watch | Watching | Done"
  - Game folders → "To Do | In Progress | Done"
- 🖱️ **Drag & Drop**: Move cards between columns with drag and drop
- 💾 **Persistent State**: Card positions are saved automatically
- 📝 **Click to Open**: Click any card to open the note

## How It Works

1. Create a `Board.md` file in any folder
2. Create subfolders for different categories (e.g., Anatomy, French, Geography)
3. Add notes to those subfolders
4. Open `Board.md` and the kanban board will automatically appear!

### Example Structure

```
Learning/
  Board.md              ← Kanban board
  Anatomy/
    Basics of Anatomy.md
    Skeletal System.md
  French/
    Basics of French.md
    Verbs.md
  Maths/
    Basics of Mathematics.md
```

The Board.md will show cards for all these notes, automatically tagged:
- "Basics of Anatomy" #Anatomy
- "Skeletal System" #Anatomy
- "Basics of French" #French
- etc.

## Installation

### For Testing

1. Build the plugin:
   ```bash
   npm install
   npm run build
   ```

2. Copy to your vault:
   - Navigate to `[YourVault]/.obsidian/plugins/`
   - Create a folder named `folder-kanban`
   - Copy `main.js`, `manifest.json`, and `styles.css` to this folder

3. Enable in Obsidian:
   - Restart Obsidian (or Ctrl+R / Cmd+R)
   - Go to Settings → Community plugins
   - Enable "Folder Kanban"

### For Development

Run with auto-rebuild:
```bash
npm run dev
```

## Usage

1. **Create a Board**: Add a `Board.md` file in any folder
2. **Add Content**: Create subfolders and add notes to them
3. **Open Board**: Click on `Board.md` to see your kanban board
4. **Organize**: Drag cards between columns to track progress
5. **Refresh**: Use command palette → "Refresh Kanban Board" to update

## Commands

- **Refresh Kanban Board**: Manually refresh the current board to pick up new files

## Settings

- **Board file name**: Change the filename used for boards (default: `Board.md`)

## Use Cases

### Learning Management
```
Learning/
  Board.md
  Anatomy/
  French/
  Geography/
  History/
  Maths/
```

### Entertainment Tracking
```
Entertainment/
  Board.md
  Books/
  Movies/
  Series/
  Anime/
```

### Project Management
```
MyProjects/
  Board.md
  WebApp/
  MobileApp/
  Documentation/
```

## Tips

- Cards automatically appear when you create new notes in subfolders
- Use the right-click menu on cards for quick actions
- The plugin remembers which column each card is in
- Click "Refresh Kanban Board" if new files don't appear immediately
