# Folder Kanban

An Obsidian plugin that transforms your folder structure into a Kanban board view with automatic card generation from markdown notes.

![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-purple)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🎯 Features

### 📊 **Folder-Based Kanban Boards**
- Create a `Board.md` file in any folder to view it as a Kanban board
- Notes in subfolders automatically become cards
- Tags are derived from the subfolder names (e.g., notes in `Frontend/` get the `frontend` tag)
- Organize your notes visually without changing their file structure

### 📋 **Customizable Columns**
- Define column names in the `Board.md` file using a `## Columns` section
- Format: `## Columns` followed by comma-separated column names (e.g., `Todo, In Progress, Done`)
- Cards track position by column index, so renaming columns preserves card positions
- Falls back to default columns (To Do, In Progress, Done) if not specified

### 🎨 **Per-Board Tag Colors**
- Customize tag colors for each board independently
- Click the "Customize" button on any board to configure colors
- Default color scheme provided for common tags (frontend, backend, database, design)
- Colors stored per-board, so different projects can have different color schemes

### ✅ **Progress Tracking**
- Displays progress bars on cards based on checklist completion in notes
- Shows percentage and checked/total count
- Updates in real-time when you edit notes

### 🔄 **Drag & Drop**
- Move cards between columns with drag and drop
- Right-click cards to move them via context menu
- Card positions persist across sessions

### ⚡ **Real-Time Sync**
- Boards update automatically when files are modified
- Watches for file creation, deletion, and renames
- No manual refresh needed

### 📝 **Next Task Preview**
- Shows the first unchecked item from each note's checklist
- Helps you see at a glance what needs to be done next

### 🎯 **Modern UI**
- Clean card design with tag badges
- Responsive column layout
- Dark mode compatible
- Smooth drag animations

## 🚀 Getting Started

### Installation

**Option 1: From Obsidian Community Plugins (Recommended)**
1. Open Settings in Obsidian
2. Go to Community Plugins and browse
3. Search for "Folder Kanban"
4. Click Install, then Enable

**Option 2: Manual Installation**
1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/yourusername/folder-kanban/releases)
2. Create folder: `<vault>/.obsidian/plugins/folder-kanban/`
3. Copy the downloaded files into that folder
4. Reload Obsidian (Ctrl+R)
5. Go to Settings → Community Plugins and enable "Folder Kanban"

### Quick Start

1. **Create a Board from a Folder**
   - Right-click any folder in your vault
   - Select "Create Kanban Board from Folder"
   - A `Board.md` file is created and opens as a Kanban board
   
   Or manually create your structure:
   ```
   Projects/
   ├── Board.md          # Your board file
   ├── Frontend/         # Subfolder (creates "frontend" tag)
   │   └── Task 1.md
   ├── Backend/          # Subfolder (creates "backend" tag)
   │   └── Task 2.md
   └── Database/         # Subfolder (creates "database" tag)
       └── Task 3.md
   ```

2. **Configure Columns in Board.md**
   ```markdown
   ## Columns
   Todo, In Progress, Done
   ```

3. **Add Checklists to Your Notes** (optional)
   ```markdown
   # Task Title
   
   - [ ] First subtask
   - [ ] Second subtask
   - [x] Completed subtask
   ```

4. **Open the Kanban Board**
   - Right-click on `Board.md`
   - Select "Open as Kanban Board"
   - Your board appears with all notes as cards!

5. **Customize** (optional)
   - Click the "Customize" button on the board
   - Edit column names
   - Set custom tag colors for this board

## 📝 Usage

### How It Works

1. **Board Detection**: Any folder containing a `Board.md` file can be opened as a Kanban board
2. **Card Generation**: All markdown notes in subfolders become cards on the board
3. **Tagging**: Cards are automatically tagged based on their subfolder name
4. **Column Assignment**: Cards start in the first column and can be moved via drag-and-drop or context menu
5. **Persistence**: Card positions are saved per-board and survive column renaming

### Organizing Your Work

The plugin works best when you organize notes into subfolders by category/type:
- `Frontend/` - UI-related tasks
- `Backend/` - Server-side tasks  
- `Database/` - Data model tasks
- `Design/` - Design tasks

Each subfolder becomes a tag, and you can customize tag colors per-board.

## ⚙️ Configuration

### Customizing Columns

Edit your `Board.md` file to define columns:

```markdown
## Columns
Backlog, Todo, In Progress, Review, Done
```

Columns are comma-separated. The board will update automatically.

### Customizing Tag Colors

1. Open a board
2. Click the "Customize" button
3. Pick colors for each tag
4. Colors are saved per-board

### Settings

Access plugin settings via Settings → Folder Kanban:
- View and edit tag colors for the currently active board
- Colors are organized per-board, not globally

## 🎨 Card Details

Each card shows:
- **Title**: The note's filename
- **Tag Badge**: Color-coded label based on the subfolder (top-right corner)
- **Progress Bar**: Visual checklist completion indicator (if the note contains tasks)
- **Progress Text**: Shows percentage and "X/Y checked" count
- **Next Task**: The first unchecked item from the note's checklist

## 🔧 Technical Details

### Architecture
- Built with TypeScript and Web Components
- Uses Shadow DOM for card rendering
- Efficient real-time file watching via Obsidian's Vault API

### Data Storage
- Card positions stored in plugin settings
- Columns defined in `Board.md` file using markdown
- Tag colors stored per-board path

### Performance
- Cards indexed by column position (not name) for stability
- Automatic deduplication prevents duplicate cards
- Minimal DOM updates on file changes

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

### Development Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/folder-kanban.git

# Install dependencies
npm install

# Build the plugin
npm run build

# For development with auto-rebuild
npm run dev
```

### Project Structure
- `main.ts` - Core plugin logic and Kanban view
- `components.ts` - Web Components (KanbanCard, KanbanProgress, etc.)
- `styles.css` - UI styling

## 📄 License

MIT License - feel free to use this plugin in your workflow!

## � Acknowledgments

Built for the Obsidian community.

---

**Enjoying Folder Kanban?** Consider giving it a ⭐ on GitHub!
