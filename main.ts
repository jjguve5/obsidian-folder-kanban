import { 
	App, 
	Plugin, 
	PluginSettingTab, 
	Setting, 
	ItemView, 
	WorkspaceLeaf,
	TFile,
	TFolder,
	Menu,
	Notice,
	Modal,
	MarkdownView,
	ViewStateResult
} from 'obsidian';
import './components';
import { KanbanCard, ChecklistItem, TagColorEditItem } from './components';

interface FolderKanbanSettings {
	boardFileName: string;
	columns: {
		[key: string]: string[];  // folder path -> column names
	};
	customColumns: {
		[key: string]: string[];  // folder name pattern -> columns
	};
	tagColors: {
		[boardPath: string]: {    // board file path -> tag colors
			[tag: string]: string; // tag name -> hex color
		};
	};
	checklists: {
		[filePath: string]: {
			items: { text: string; checked: boolean }[];
		};
	};
}

const DEFAULT_SETTINGS: FolderKanbanSettings = {
	boardFileName: 'Board.md',
	columns: {},
	customColumns: {
		'learn': ['To Learn', 'Learning', 'Mastered'],
		'entertainment': ['Want To Watch', 'Watching', 'Done'],
		'game': ['To Do', 'In Progress', 'Done']
	},
	tagColors: {},
	checklists: {}
}

interface CardData {
	filePath: string;
	title: string;
	tag: string;
	columnIndex: number;
}

interface BoardState {
	cards: CardData[];
}

// Deduplicate cards by normalized path (case-insensitive to avoid duplicates on Windows)
const dedupeCards = (cards: CardData[]): CardData[] => {
	const map = new Map<string, CardData>();
	for (const c of cards) {
		const key = c.filePath.toLowerCase();
		if (!map.has(key)) map.set(key, c);
	}
	return Array.from(map.values());
};

const VIEW_TYPE_FOLDER_KANBAN = 'folder-kanban-view';
const VIEW_TYPE_CHECKLIST = 'checklist-view';

// Interface for view type checking
interface IFolderKanbanView extends ItemView {
	refresh(): Promise<void>;
	folderPath?: string;
	boardFile?: TFile;
}

export default class FolderKanbanPlugin extends Plugin {
	settings: FolderKanbanSettings;
	boardStates: Map<string, BoardState> = new Map();

	refreshAllKanbanViews() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_KANBAN);
		leaves.forEach(leaf => {
			const view = leaf.view as IFolderKanbanView;
			if (view && typeof view.refresh === 'function') {
				void view.refresh();
			}
		});
	}

	async onload() {
		await this.loadSettings();

		// Register the custom view
		this.registerView(
			VIEW_TYPE_FOLDER_KANBAN,
			(leaf) => new FolderKanbanView(leaf, this)
		);

		// Register checklist side view
		this.registerView(
			VIEW_TYPE_CHECKLIST,
			(leaf) => new ChecklistView(leaf, this)
		);



		// When a file is opened, check if it's a Board.md and convert to kanban view
		this.registerEvent(
			this.app.workspace.on('file-open', (file) => {
				if (file && file.name === this.settings.boardFileName) {
					this.openKanbanBoardInPlace(file);
					// Close any markdown views of this board file to prevent duplicates
					setTimeout(() => {
						const mdLeaves = this.app.workspace.getLeavesOfType('markdown');
						for (const leaf of mdLeaves) {
							const v = leaf.view as MarkdownView;
							if (v?.file?.path === file.path) {
								leaf.detach();
							}
						}
					}, 100);
				}
			})
		);

		// Real-time updates: When any file is modified, refresh board views
		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile) {
					// Refresh all kanban views that might be affected by this file
					const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_KANBAN);
					for (const leaf of leaves) {
						const view = leaf.view as IFolderKanbanView;
						if (view?.folderPath && file.path.startsWith(view.folderPath)) {
							// File is in the folder being displayed, refresh the board
							void view.refresh();
						}
					}
				}
			})
		);

		// Real-time updates: When any file is deleted, refresh board views
		this.registerEvent(
			this.app.vault.on('delete', (file) => {
				if (file instanceof TFile) {
					// Refresh all kanban views that might be affected by this file
					const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_KANBAN);
					for (const leaf of leaves) {
						const view = leaf.view as IFolderKanbanView;
						if (view?.folderPath && file.path.startsWith(view.folderPath)) {
							// File was deleted from the folder being displayed, refresh the board
							void view.refresh();
						}
					}
				}
			})
		);

		// Real-time updates: When any file is created, refresh board views
		this.registerEvent(
			this.app.vault.on('create', (file) => {
				if (file instanceof TFile) {
					// Refresh all kanban views that might be affected by this file
					const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_KANBAN);
					for (const leaf of leaves) {
						const view = leaf.view as IFolderKanbanView;
						if (view?.folderPath && file.path.startsWith(view.folderPath)) {
							// File was created in the folder being displayed, refresh the board
							void view.refresh();
						}
					}
				}
			})
		);

		// Real-time updates: When any file is renamed, refresh board views
		this.registerEvent(
			this.app.vault.on('rename', (file, oldPath) => {
				if (file instanceof TFile) {
					// Refresh all kanban views that might be affected by this file
					const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_KANBAN);
					for (const leaf of leaves) {
						const view = leaf.view as IFolderKanbanView;
						// Check both old and new paths
						if (view?.folderPath && (file.path.startsWith(view.folderPath) || oldPath.startsWith(view.folderPath))) {
							void view.refresh();
						}
					}
				}
			})
		);

		// Add context menu option for folders
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (file instanceof TFolder) {
					menu.addItem((item) => {
						item
							.setTitle('Create Folder Board')
							.setIcon('layout-dashboard')
							.onClick(async () => {
								await this.createBoardInFolder(file);
							});
					});
				}
			})
		);

		// Add command to create/refresh board
		this.addCommand({
			id: 'refresh-kanban-board',
			name: 'Refresh Kanban Board',
			callback: () => {
				const activeView = this.app.workspace.getActiveViewOfType(FolderKanbanView) as FolderKanbanView | null;
				if (activeView) {
					void activeView.refresh();
					new Notice('Board refreshed!');
				}
			}
		});


		// Ensure a persistent right-side checklist tab exists and stays synced to active note
		const ensureChecklistLeaf = () => {
			// Ensure a single checklist leaf exists in the right sidebar
			const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CHECKLIST);
			let rightLeaf: WorkspaceLeaf | null = null;

			if (leaves.length > 0) {
				rightLeaf = leaves[0];
			} else {
				// Reuse existing right leaf if present; otherwise create one without stacking
				rightLeaf = this.app.workspace.getRightLeaf(false) ?? this.app.workspace.getRightLeaf(true);
				const file = this.app.workspace.getActiveFile();
				const path = file instanceof TFile ? file.path : undefined;
				if (rightLeaf) {
					rightLeaf.setViewState({ type: VIEW_TYPE_CHECKLIST, state: { file: path }, active: true });
				}
			}

			if (rightLeaf) {
				// Pin and reveal so it shows as a dedicated top tab
				rightLeaf.setPinned(false);
				this.app.workspace.revealLeaf(rightLeaf);
				this.app.workspace.setActiveLeaf(rightLeaf);
			}
		};
		this.app.workspace.onLayoutReady(async () => {
			ensureChecklistLeaf();
		});
		this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
			const file = this.app.workspace.getActiveFile();
			const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CHECKLIST);
			if (leaves.length > 0) {
				const leaf = leaves[0];
				leaf.setViewState({ type: VIEW_TYPE_CHECKLIST, state: { file: file instanceof TFile ? file.path : undefined } });
			}
			if (leaves.length === 0) {
				ensureChecklistLeaf();
			}
			// Also enforce board view for Board.md
			if (file && file.name === this.settings.boardFileName) {
				const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (mdView && file instanceof TFile) {
					this.openKanbanBoardInPlace(file);
				}
			}
		}));

		this.addSettingTab(new FolderKanbanSettingTab(this.app, this));
	}

	async openKanbanBoardInPlace(file: TFile) {
		// First check if this board is already open in a kanban view
		const kanbanLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_KANBAN);
		let targetLeaf: WorkspaceLeaf | null = null;
		
		for (const leaf of kanbanLeaves) {
			const view = leaf.view as IFolderKanbanView;
			if (view?.boardFile?.path === file.path) {
				targetLeaf = leaf;
				break;
			}
		}

		if (!targetLeaf) {
			// If not in kanban view, check markdown leaves
			const mdLeaves = this.app.workspace.getLeavesOfType('markdown');
			for (const leaf of mdLeaves) {
				const v = leaf.view as MarkdownView;
				if (v?.file?.path === file.path) {
					targetLeaf = leaf;
					break;
				}
			}
		}

		if (!targetLeaf) {
			// Use first available kanban leaf or create new
			targetLeaf = kanbanLeaves[0] || this.app.workspace.getLeaf(false);
		}

		await targetLeaf.setViewState({
			type: VIEW_TYPE_FOLDER_KANBAN,
			state: { file: file.path }
		});
		this.app.workspace.revealLeaf(targetLeaf);
	}

	async openKanbanBoard(file: TFile) {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_KANBAN);
		let leaf: WorkspaceLeaf | null = null;

		// Check if this specific board is already open by checking the view's boardFile
		for (const existingLeaf of leaves) {
			const view = existingLeaf.view as IFolderKanbanView;
			if (view?.boardFile?.path === file.path) {
				leaf = existingLeaf;
				break;
			}
		}

		// If not open, create a new tab for this board
		if (!leaf) {
			leaf = this.app.workspace.getLeaf('tab');
		}

		await leaf.setViewState({
			type: VIEW_TYPE_FOLDER_KANBAN,
			state: { file: file.path }
		});

		this.app.workspace.revealLeaf(leaf);
	}

	async createBoardInFolder(folder: TFolder) {
		const boardPath = `${folder.path}/${this.settings.boardFileName}`;
		
		// Check if board already exists
		const existingFile = this.app.vault.getAbstractFileByPath(boardPath);
		if (existingFile) {
			new Notice('Board already exists in this folder!');
			// Open the existing board
			if (existingFile instanceof TFile) {
				await this.openKanbanBoard(existingFile);
			}
			return;
		}

		// Create the board file
		const boardFile = await this.app.vault.create(boardPath, '# Folder Board\n\nThis board will automatically show all notes from subfolders.');
		
		new Notice(`Board created in ${folder.name}!`);
		
		// Open the newly created board
		await this.openKanbanBoard(boardFile);
	}

	onunload() {	}

	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
		
		// Load board states if they exist
		if (data && data.boardStates) {
			Object.entries(data.boardStates).forEach(([key, value]) => {
				const state = value as BoardState;
				const deduped = {
					cards: dedupeCards(state.cards)
				};
				this.boardStates.set(key, deduped);
			});
		}
	}

	async saveSettings() {
		const allStates: {[key: string]: BoardState} = {};
		this.boardStates.forEach((value, key) => {
			allStates[key] = value;
		});
		await this.saveData({
			...this.settings,
			boardStates: allStates
		});
	}

	private parseChecklistFromContent(content: string): { text: string; checked: boolean }[] {
		const items: { text: string; checked: boolean }[] = [];
		content.split('\n').forEach(line => {
			const match = line.match(/^\s*[-*]\s+\[([x ])\]\s+(.+)$/i);
			if (match) {
				items.push({ text: match[2], checked: match[1].toLowerCase() === 'x' });
			}
		});
		return items;
	}

	async getChecklist(filePath: string): Promise<{ text: string; checked: boolean }[]> {
		const existing = this.settings.checklists[filePath]?.items;
		if (existing) return existing;

		// If not stored yet, try to import from the note once
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file instanceof TFile) {
			try {
				const content = await this.app.vault.read(file);
				const parsed = this.parseChecklistFromContent(content);
				this.settings.checklists[filePath] = { items: parsed };
				await this.saveSettings();
				return parsed;
			} catch (e) {
				return [];
			}
		}
		return [];
	}

	async setChecklist(filePath: string, items: { text: string; checked: boolean }[]) {
		this.settings.checklists[filePath] = { items };
		await this.saveSettings();
	}

	async saveBoardState(boardPath: string, state: BoardState) {
		const deduped = { cards: Array.from(new Map(state.cards.map(c => [c.filePath, c])).values()) };
		this.boardStates.set(boardPath, deduped);
		await this.saveSettings();
	}

	loadBoardState(boardPath: string): BoardState | null {
		const state = this.boardStates.get(boardPath) || null;
		if (!state) return null;
		return { cards: Array.from(new Map(state.cards.map(c => [c.filePath, c])).values()) };
	}
}

class FolderKanbanView extends ItemView {
	plugin: FolderKanbanPlugin;
	boardFile: TFile | null = null;
	boardContent = '';
	folderPath = '';
	columns: string[] = ['To Do', 'In Progress', 'Done'];
	cards: CardData[] = [];

	constructor(leaf: WorkspaceLeaf, plugin: FolderKanbanPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_FOLDER_KANBAN;
	}

	getDisplayText(): string {
		return this.boardFile ? `Kanban: ${this.boardFile.basename}` : 'Kanban Board';
	}

	getIcon(): string {
		return 'layout-dashboard';
	}

	async onOpen() {
		await this.refresh();
	}

	async setState(state: Record<string, unknown>, result: ViewStateResult): Promise<void> {
		if (state.file) {
			const file = this.app.vault.getAbstractFileByPath(state.file as string);
			if (file instanceof TFile) {
				this.boardFile = file;
				this.folderPath = file.parent?.path || '';
				await this.refresh();
			}
		}
	}

	getState(): Record<string, unknown> {
		return {
			file: this.boardFile?.path
		};
	}

	async refresh() {
		if (!this.boardFile) return;

		// Load board file content
		this.boardContent = await this.app.vault.read(this.boardFile);

		// Determine columns based on board file content
		this.detectColumns();

		// Scan folder structure and build cards
		await this.scanFolderForCards();

		// Load saved state
		const savedState = this.plugin.loadBoardState(this.boardFile.path);
		if (savedState) {
			// Merge saved state with current files
			this.mergeState(savedState);
		}

		// Render the board
		this.render();
	}

	detectColumns() {
		// Read columns from Board.md content
		if (!this.boardFile) {
			this.columns = ['To Do', 'In Progress', 'Done'];
			return;
		}

		// Default columns
		this.columns = ['To Do', 'In Progress', 'Done'];

		// Try to find "## Columns" section in board file
		const boardContent = this.boardContent || '';
		const columnMatch = boardContent.match(/##\s+Columns\s*\n([^\n]*)/i);
		
		if (columnMatch && columnMatch[1]) {
			// Parse columns from format: "Column1, Column2, Column3"
			const columnLine = columnMatch[1].trim();
			if (columnLine) {
				const cols = columnLine.split(',').map(c => c.trim()).filter(c => c);
				if (cols.length > 0) {
					this.columns = cols;
				}
			}
		}
	}

	scanFolderForCards() {
		if (!this.boardFile?.parent) return;

		const parentFolder = this.boardFile.parent;
		const newCards: CardData[] = [];

		// Get all subfolders
		const subfolders = parentFolder.children.filter(
			child => child instanceof TFolder && child.name !== this.app.vault.configDir.split('/').pop()
		);

		// For each subfolder, get all markdown files
		for (const subfolder of subfolders) {
		if (!(subfolder instanceof TFolder)) continue;
		}

		// Deduplicate by filePath to avoid rendering duplicates
		const dedupedCards = dedupeCards(newCards);

		// Update cards while preserving column assignments (case-insensitive keys)
		const existingCards = new Map(this.cards.map(c => [c.filePath.toLowerCase(), c]));
		this.cards = dedupedCards.map(card => {
			const existing = existingCards.get(card.filePath.toLowerCase());
			return existing || { ...card, columnIndex: 0 };
		});

		// Final guard against any residual duplicates
		this.cards = dedupeCards(this.cards);
	}

	async collectNotesFromFolder(folder: TFolder, tag: string, cards: CardData[]) {
		for (const child of folder.children) {
			if (child instanceof TFile && child.extension === 'md') {
				// Skip the board file itself
				if (child.name === this.plugin.settings.boardFileName) continue;

				cards.push({
					filePath: child.path,
					title: child.basename,
					tag: tag,
					columnIndex: 0 // Default to first column
				});
			} else if (child instanceof TFolder) {
				// Recursively collect from subfolders
				await this.collectNotesFromFolder(child, tag, cards);
			}
		}
	}

	mergeState(savedState: BoardState) {
		const savedCards = new Map(savedState.cards.map(c => [c.filePath.toLowerCase(), c]));

		this.cards = this.cards.map(card => {
			const saved = savedCards.get(card.filePath.toLowerCase());
			if (saved && saved.columnIndex >= 0 && saved.columnIndex < this.columns.length) {
				return { ...card, columnIndex: saved.columnIndex };
			}
			return card;
		});

		// Ensure no duplicates remain after merging saved state
		this.cards = dedupeCards(this.cards);
	}

	render() {
		// Hard reset the view each time to avoid any residual DOM from previous renders
		this.containerEl.empty();
		const container = this.containerEl.createDiv();
		container.addClass('folder-kanban-view');

		// Final display-level dedupe to prevent any render-time duplicates
		this.cards = dedupeCards(this.cards);

		// Guard: if no board file, show placeholder
		if (!this.boardFile) {
			container.createDiv({ cls: 'kanban-placeholder', text: 'No board file loaded. Please open a board file.' });
			return;
		}

		// Create header with edit button
		const headerEl = container.createDiv({ cls: 'kanban-view-header' });
		const titleEl = headerEl.createDiv({ cls: 'kanban-view-title' });
		titleEl.createSpan({ text: `Kanban: ${this.boardFile.basename}` });

		const editBtn = headerEl.createEl('button', { text: 'Customize', cls: 'kanban-edit-btn' });
		editBtn.addEventListener('click', () => {
			if (this.boardFile?.parent) {
				new BoardCustomizeModal(this.app, this.plugin, this.boardFile.parent.name, this.boardFile.path, this.boardFile, this.cards, () => { void this.refresh(); }).open();
			}
		});

		// Create 
		// Create kanban board
		const boardEl = container.createDiv({ cls: 'kanban-board' });

		// Create columns
		this.columns.forEach((columnName, columnIndex) => {
			const columnEl = boardEl.createDiv({ cls: 'kanban-column' });
			
			// Column header
			const headerEl = columnEl.createDiv({ cls: 'kanban-column-header' });
			headerEl.createSpan({ text: columnName, cls: 'kanban-column-title' });
			
			const cardsInColumn = this.cards.filter(c => c.columnIndex === columnIndex);
			headerEl.createSpan({ 
				text: ` (${cardsInColumn.length})`, 
				cls: 'kanban-column-count' 
			});

			// Column content
			const contentEl = columnEl.createDiv({ cls: 'kanban-column-content' });
			
			// Add drag-drop support
			this.setupDropZone(contentEl, columnIndex);


			// Render cards (display-level dedupe per column)
			const uniqueCards = new Map<string, CardData>();
			for (const card of cardsInColumn) {
				const key = card.filePath.toLowerCase();
				if (!uniqueCards.has(key)) uniqueCards.set(key, card);
			}
			uniqueCards.forEach(card => {
				this.renderCard(contentEl, card);
			});

			// Extra DOM-level guard: remove any accidental duplicates that might slip in
			const seen = new Set<string>();
			Array.from(contentEl.children).filter(el => el.hasAttribute('data-file-path')).forEach((el) => {
				const key = (el as HTMLElement).dataset.filePath?.toLowerCase();
				if (!key) return;
				if (seen.has(key)) {
					el.remove();
				} else {
					seen.add(key);
				}
			});
		});
	}

	renderCard(container: HTMLElement, card: CardData) {
		// Get tag color from settings (board-specific)
		const boardColors = this.plugin.settings.tagColors[this.boardFile?.path || ''] || {};
		const tagColor = boardColors[card.tag] || boardColors['default'] || '#3b82f6';

		// Create custom kanban-card element
		const cardEl = document.createElement('kanban-card') as KanbanCard;
		cardEl.setAttribute('title', card.title);
		cardEl.setAttribute('tag', card.tag);
		cardEl.setAttribute('tagColor', tagColor);
		cardEl.dataset.filePath = card.filePath;
		cardEl.setAttribute('draggable', 'true');

		// Remove any existing rendered card with same filePath in this container (case-insensitive)
		const targetKey = card.filePath.toLowerCase();
		Array.from(container.children).forEach((el) => {
			const key = (el as HTMLElement).dataset.filePath?.toLowerCase();
			if (key && key === targetKey) {
				el.remove();
			}
		});

		// Append to DOM FIRST to trigger connectedCallback and initialize progress component
		container.appendChild(cardEl);

		// Fetch checklist info from stored data and update card
		void this.plugin.getChecklist(card.filePath).then((items) => {
			const total = items.length;
			const checked = items.filter(i => i.checked).length;
			const nextTaskItem = items.find(i => !i.checked);
			const nextTask = nextTaskItem ? nextTaskItem.text : '';

			cardEl.setAttribute('checked', checked.toString());
			cardEl.setAttribute('total', total.toString());

			const shadowRoot = cardEl.shadowRoot;
			if (shadowRoot) {
				const nextTaskEl = Array.from(shadowRoot.children).find(el => el.classList.contains('next-task'));
				if (nextTaskEl) {
					if (nextTask) {
						nextTaskEl.textContent = nextTask;
						nextTaskEl.classList.remove('hidden');
					} else {
						nextTaskEl.classList.add('hidden');
					}
				}
			}
		}).catch(() => {});

		// Drag events - handle on element itself
		cardEl.addEventListener('dragstart', (e: DragEvent) => {
			if (e.dataTransfer) {
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/plain', card.filePath);
			}
			cardEl.classList.add('dragging');
		}, false);

		cardEl.addEventListener('dragend', () => {
			cardEl.classList.remove('dragging');
		}, false);

		// Click to open note
		cardEl.addEventListener('click', async () => {
			const file = this.app.vault.getAbstractFileByPath(card.filePath);
			if (file instanceof TFile) {
				await this.app.workspace.getLeaf(false).openFile(file);
			}
		});

		// Right-click menu
		cardEl.addEventListener('contextmenu', (e: MouseEvent) => {
			e.preventDefault();
			const menu = new Menu();
			
			menu.addItem((item) => {
				item.setTitle('Open in new pane')
					.setIcon('go-to-file')
					.onClick(async () => {
						const file = this.app.vault.getAbstractFileByPath(card.filePath);
						if (file instanceof TFile) {
							await this.app.workspace.getLeaf('split').openFile(file);
						}
					});
			});

			this.columns.forEach((col, index) => {
				if (index !== card.columnIndex) {
					menu.addItem((item) => {
						item.setTitle(`Move to ${col}`)
							.setIcon('arrow-right')
							.onClick(() => {
								this.moveCard(card.filePath, index);
							});
					});
				}
			});

			menu.showAtMouseEvent(e);
		});
	}

	setupDropZone(element: HTMLElement, columnIndex: number) {
		element.addEventListener('dragover', (e: DragEvent) => {
			e.preventDefault();
			element.addClass('drag-over');
		});

		element.addEventListener('dragleave', () => {
			element.removeClass('drag-over');
		});

		element.addEventListener('drop', async (e: DragEvent) => {
			e.preventDefault();
			element.removeClass('drag-over');
			
			const filePath = e.dataTransfer?.getData('text/plain');
			if (filePath) {
				await this.moveCard(filePath, columnIndex);
			}
		});
	}

	async moveCard(filePath: string, targetColumnIndex: number) {
		const card = this.cards.find(c => c.filePath === filePath);
		if (card) {
			card.columnIndex = targetColumnIndex;
			await this.saveState();
			this.render();
		}
	}

	async saveState() {
		if (!this.boardFile) return;

		// Deduplicate before persisting
		const state: BoardState = {
			cards: dedupeCards(this.cards)
		};

		await this.plugin.saveBoardState(this.boardFile.path, state);
	}

	async onClose() {
		// Cleanup
	}
}

class FolderKanbanSettingTab extends PluginSettingTab {
	plugin: FolderKanbanPlugin;

	constructor(app: App, plugin: FolderKanbanPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl).setName('Folder Kanban settings').setHeading();

		// Board file name setting
		new Setting(containerEl)
			.setName('Board file name')
			.setDesc('Name of the file that will be treated as a kanban board (default: Board.md)')
			.addText(text => text
				.setPlaceholder('Board.md')
				.setValue(this.plugin.settings.boardFileName)
				.onChange(async (value) => {
					this.plugin.settings.boardFileName = value || 'Board.md';
					await this.plugin.saveSettings();
				}));

		// Custom columns section
		new Setting(containerEl).setHeading().setName('Column customization');
		containerEl.createEl('p', {
			text: 'Define custom columns for different folder patterns. Use folder names (e.g., "learn", "entertainment", "game") as keys.',
			cls: 'setting-item-description'
		});

		Object.entries(this.plugin.settings.customColumns).forEach(([pattern, columns]) => {
			new Setting(containerEl)
				.setName(`Columns for "${pattern}"`)
				.setDesc('Separate columns with commas')
				.addText(text => text
					.setPlaceholder('To Do, In Progress, Done')
					.setValue(columns.join(', '))
					.onChange(async (value) => {
						const newColumns = value.split(',').map(c => c.trim()).filter(c => c);
						if (newColumns.length > 0) {
							this.plugin.settings.customColumns[pattern] = newColumns;
							await this.plugin.saveSettings();
						}
					}));

			new Setting(containerEl)
				.addButton(btn => btn
					.setButtonText('Remove')
					.onClick(async () => {
						delete this.plugin.settings.customColumns[pattern];
						await this.plugin.saveSettings();
						this.display();
					}));
		});

		// Add new column pattern
	let patternInputEl: HTMLInputElement | undefined;
	let columnsInputEl: HTMLInputElement | undefined;
	new Setting(containerEl)
		.setName('Add new folder pattern')
		.addText(text => {
			patternInputEl = text.inputEl;
			return text.setPlaceholder('e.g., "project"');
		})
		.addText(text => {
			columnsInputEl = text.inputEl;
			return text.setPlaceholder('e.g., "Backlog, Active, Review, Done"');
		})
		.addButton(btn => btn
			.setButtonText('Add')
			.onClick(async () => {
				const pattern = patternInputEl?.value?.trim();
				const columns = columnsInputEl?.value?.trim();

				if (pattern && columns) {
					const columnsList = columns.split(',').map((c: string) => c.trim()).filter((c: string) => c);
					if (columnsList.length > 0) {
						this.plugin.settings.customColumns[pattern] = columnsList;
						await this.plugin.saveSettings();
						if (patternInputEl) patternInputEl.value = '';
						if (columnsInputEl) columnsInputEl.value = '';
						void this.display();
					}
				}
			}));
		// Tag colors section
		new Setting(containerEl).setHeading().setName('Tag color customization');
		
		// Get active board
		const activeLeaf = this.app.workspace.getActiveViewOfType(FolderKanbanView) as FolderKanbanView | null;
		const activeBoardPath = activeLeaf?.boardFile?.path;
		
		if (activeBoardPath) {
			containerEl.createEl('p', {
				text: `Setting colors for board: ${activeBoardPath}`,
				cls: 'setting-item-description'
			});
			
			// Initialize board colors if not exists
			if (!this.plugin.settings.tagColors[activeBoardPath]) {
				this.plugin.settings.tagColors[activeBoardPath] = {
					'frontend': '#06b6d4',
					'backend': '#8b5cf6',
					'database': '#f59e0b',
					'design': '#ec4899',
					'default': '#3b82f6'
				};
			}
			
			const boardColors = this.plugin.settings.tagColors[activeBoardPath];

			Object.entries(boardColors).forEach(([tag, color]) => {
				new Setting(containerEl)
					.setName(`Color for "${tag}" tag`)
					.addText(text => text
						.setPlaceholder('#3b82f6')
						.setValue(color)
						.onChange(async (value) => {
							// Validate hex color
							if (/^#[0-9A-F]{6}$/i.test(value)) {
								this.plugin.settings.tagColors[activeBoardPath][tag] = value;
								await this.plugin.saveSettings();
							}
						}))
					.addButton(btn => {
						if (tag !== 'default') {
							btn.setButtonText('Remove')
								.onClick(async () => {
									delete this.plugin.settings.tagColors[activeBoardPath][tag];
									await this.plugin.saveSettings();
								void this.display();
								});
						}
					});
			});

			// Add new tag color
			let tagInputEl: HTMLInputElement | undefined;
			let colorInputEl: HTMLInputElement | undefined;
			new Setting(containerEl)
				.setName('Add custom tag color')
				.addText(text => {
					tagInputEl = text.inputEl;
					return text.setPlaceholder('Tag name');
				})
				.addText(text => {
					colorInputEl = text.inputEl;
					return text.setPlaceholder('#3b82f6');
				})
				.addButton(btn => btn
					.setButtonText('Add')
					.onClick(async () => {
						const tag = tagInputEl?.value?.trim();
						const color = colorInputEl?.value?.trim();

						if (tag && color && /^#[0-9A-F]{6}$/i.test(color)) {
							this.plugin.settings.tagColors[activeBoardPath][tag] = color;
							await this.plugin.saveSettings();
							if (tagInputEl) tagInputEl.value = '';
							if (colorInputEl) colorInputEl.value = '';
							void this.display();
						}
					}));
		} else {
			containerEl.createEl('p', {
				text: 'Open a Kanban board to customize tag colors for that board.',
				cls: 'setting-item-description'
			});
		}
	}
}

class BoardCustomizeModal extends Modal {
	plugin: FolderKanbanPlugin;
	folderName: string;
	boardPath: string;
	boardFile: TFile | null;
	cards: CardData[];
	onSave: () => void;
	tempColumns: string[];
	tempTagColors: {[key: string]: string};
	boardContent = '';

	constructor(app: App, plugin: FolderKanbanPlugin, folderName: string, boardPath: string, boardFile: TFile | null, cards: CardData[], onSave: () => void) {
		super(app);
		this.plugin = plugin;
		this.folderName = folderName;
		this.boardPath = boardPath;
		this.boardFile = boardFile;
		this.cards = cards;
		this.onSave = onSave;
		
		// Initialize columns from board file (will be populated in onOpen)
		this.tempColumns = ['To Do', 'In Progress', 'Done'];
		
		// Get board-specific colors or initialize with defaults
		if (!plugin.settings.tagColors[boardPath]) {
			plugin.settings.tagColors[boardPath] = {
				'frontend': '#06b6d4',
				'backend': '#8b5cf6',
				'database': '#f59e0b',
				'design': '#ec4899',
				'default': '#3b82f6'
			};
		}
		this.tempTagColors = JSON.parse(JSON.stringify(plugin.settings.tagColors[boardPath]));
	}

	async onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		new Setting(contentEl).setName(`Customize ${this.folderName} board`).setHeading();

		// Load board content to get current columns
		if (this.boardFile) {
			this.boardContent = await this.app.vault.read(this.boardFile);
			const columnMatch = this.boardContent.match(/##\s+Columns\s*\n([^\n]*)/i);
			if (columnMatch) {
				const columnLine = columnMatch[1].trim();
				const cols = columnLine.split(',').map(c => c.trim()).filter(c => c);
				if (cols.length > 0) {
					this.tempColumns = cols;
				}
			}
		}

		// Columns section
		new Setting(contentEl).setHeading().setName('Columns');
		
		const columnsContainer = contentEl.createDiv({ cls: 'customize-section' });
		
		const colsSetting = new Setting(columnsContainer)
			.setName('Board columns')
		.setDesc('Separate columns with commas');

		colsSetting.addText(text => text
			.setPlaceholder('To Do, In Progress, Done')
			.setValue(this.tempColumns.join(', '))
			.onChange(value => {
				const newCols = value.split(',').map(c => c.trim()).filter(c => c);
				if (newCols.length > 0) {
					this.tempColumns = newCols;
				}
			}));

		// Tag colors section
		new Setting(contentEl).setHeading().setName('Tag colors');
		const colorsContainer = contentEl.createDiv({ cls: 'customize-section' });

		// Get all unique tags (detected + configured)
		const allTags = new Set<string>();
		this.cards.forEach(card => {
			allTags.add(card.tag);
		});
		Object.keys(this.tempTagColors).forEach(tag => {
			allTags.add(tag);
		});

		// Create grid container for tags
		const tagGrid = colorsContainer.createDiv({ cls: 'tag-colors-grid' });

		// Show all tags with color pickers using custom component
		Array.from(allTags).forEach(tag => {
			if (tag === 'default') return; // Skip default
			
			const color = this.tempTagColors[tag] || '#3b82f6';
			const tagItem = document.createElement('tag-color-edit-item') as TagColorEditItem;
			tagItem.setAttribute('tagName', tag);
			tagItem.setAttribute('color', color);
			
			tagItem.addEventListener('colorchange', (e: CustomEvent<{ color: string }>) => {
				this.tempTagColors[tag] = e.detail.color;
			});
			
			tagItem.addEventListener('remove', () => {
				delete this.tempTagColors[tag];
				void this.onOpen();
			});
			
			tagGrid.appendChild(tagItem);
		});

		// Add new tag section
		const addCustomSection = colorsContainer.createDiv({ cls: 'add-custom-tag-section' });
		addCustomSection.createEl('div', { cls: 'customize-section-label', text: 'Add custom tag color' });
		
		const addCustomRow = addCustomSection.createDiv({ cls: 'setting' });

		let tagNameValue = '';
		let tagColorValue = '#3b82f6';

		const tagNameInput = addCustomRow.createEl('input', { 
			type: 'text',
			attr: { placeholder: 'e.g., Anatomy' } 
	});
	tagNameInput.addEventListener('change', (e: Event) => {
		const target = e.target as HTMLInputElement;
		tagNameValue = target.value;
	});

	const colorPicker = addCustomRow.createEl('input', { 
		type: 'color',
		attr: { value: tagColorValue } 
	});
	colorPicker.addEventListener('change', (e: Event) => {
		const target = e.target as HTMLInputElement;
		tagColorValue = target.value;
	});

	const addBtn = addCustomRow.createEl('button', { text: 'Add', cls: 'add-custom-btn' });		
	addBtn.addEventListener('click', () => {
		if (tagNameValue && /^#[0-9A-F]{6}$/i.test(tagColorValue)) {
			this.tempTagColors[tagNameValue] = tagColorValue;
			void this.onOpen();
		}
	});

	// Buttons
	const btnContainer = contentEl.createDiv({ cls: 'modal-button-container' });
	
	const saveBtn = btnContainer.createEl('button', { text: 'Save', cls: 'modal-save-btn' });
	saveBtn.addEventListener('click', async () => {
		// Save columns to Board.md if it exists
		if (this.boardFile) {
			const boardContent = this.boardContent;
			
			// Check if ## Columns section exists
			if (boardContent.includes('## Columns')) {
				// Empty block - columns section exists but no action needed
			}
				
				// Write the modified content back to the file
				await this.app.vault.modify(this.boardFile, boardContent);
				
				// Wait a moment to ensure file is written
				await new Promise(resolve => setTimeout(resolve, 100));
			}
			
			// Save tag colors
			this.plugin.settings.tagColors[this.boardPath] = this.tempTagColors;
			await this.plugin.saveSettings();
			new Notice('Board settings saved!');
			
			// Refresh the board to show new columns
			if (this.onSave) {
				this.onSave();
			}
			
			this.close();
		});

		const cancelBtn = btnContainer.createEl('button', { text: 'Cancel', cls: 'modal-cancel-btn' });
		cancelBtn.addEventListener('click', () => this.close());
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class ChecklistView extends ItemView {
	plugin: FolderKanbanPlugin;
	file: TFile | null = null;
	items: { text: string; checked: boolean }[] = [];
	focusNewInputNext = false;

	constructor(leaf: WorkspaceLeaf, plugin: FolderKanbanPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string { return VIEW_TYPE_CHECKLIST; }
	getDisplayText(): string { return 'Checklist'; }
	getIcon(): string { return 'check-square'; }

	async onOpen() { await this.refresh(); }

	async setState(state: Record<string, unknown>): Promise<void> {
		if (state?.file) {
			const file = this.app.vault.getAbstractFileByPath(state.file as string);
			if (file instanceof TFile) {
				this.file = file;
				await this.refresh();
			}
		}
	}

	async refresh() {
		const container = this.containerEl.children[1] as HTMLElement || this.containerEl.createDiv();
		container.empty();
		container.addClass('checklist-side-view');

		const header = container.createDiv({ cls: 'checklist-panel-header' });
		header.createSpan({ text: this.file ? `Checklist: ${this.file.basename}` : 'Checklist' });

		const list = container.createDiv({ cls: 'checklist-container' });
		if (this.file) {
			this.items = await this.plugin.getChecklist(this.file.path);
			this.items.forEach((it, index) => {
				const item = document.createElement('checklist-item') as ChecklistItem;
				item.setAttribute('text', it.text);
				if (it.checked) item.setAttribute('checked', '');
				
				item.addEventListener('toggle', (e: CustomEvent<{ checked: boolean }>) => {
					void this.toggleItem(index, e.detail.checked);
				});
				
				item.addEventListener('remove', () => {
					void this.removeItem(index);
				});
				
				list.appendChild(item);
			});
		}

		// Inline new item input row (checkbox + text input; Enter to add)
		const newRow = list.createDiv({ cls: 'checklist-item checklist-new-row' });
		const newCb = newRow.createEl('input', { type: 'checkbox' });
		const newInput = newRow.createEl('input', { type: 'text' });
		newInput.placeholder = 'Add item and press Enter';
		const tryAdd = async () => {
			const text = newInput.value.trim();
			if (text && this.file) {
				await this.addItem(text, newCb.checked);
			}
		};
		// Multiple listeners to ensure reliability in Obsidian views
		newInput.addEventListener('keydown', async (e: KeyboardEvent) => {
			if (e.key === 'Enter' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) ) {
				e.preventDefault();
				e.stopPropagation();
				(e as Event).stopImmediatePropagation?.();
				await tryAdd();
			}
		}, true);
		newInput.addEventListener('keypress', async (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				e.stopPropagation();
				(e as Event).stopImmediatePropagation?.();
				await tryAdd();
			}
		}, true);
		newInput.addEventListener('keyup', async (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				e.stopPropagation();
				(e as Event).stopImmediatePropagation?.();
				await tryAdd();
			}
		}, true);

		const progress = container.createDiv({ cls: 'checklist-progress' });
		const total = this.items.length;
		const checked = this.items.filter(i => i.checked).length;
		progress.textContent = `${checked}/${total} completed`;

		if (this.focusNewInputNext) {
			newInput.focus();
			this.focusNewInputNext = false;
		}
	}

	async addItem(text: string, checked: boolean) {
		if (!this.file) return;
		const items = await this.plugin.getChecklist(this.file.path);
		items.push({ text, checked });
		await this.plugin.setChecklist(this.file.path, items);
		this.focusNewInputNext = true;
		this.plugin.refreshAllKanbanViews();
		await this.refresh();
	}

	async toggleItem(index: number, checked: boolean) {
		if (!this.file) return;
		const items = await this.plugin.getChecklist(this.file.path);
		if (items[index]) {
			items[index].checked = checked;
			await this.plugin.setChecklist(this.file.path, items);
			this.plugin.refreshAllKanbanViews();
			await this.refresh();
		}
	}

	async removeItem(index: number) {
		if (!this.file) return;
		const items = await this.plugin.getChecklist(this.file.path);
		items.splice(index, 1);
		await this.plugin.setChecklist(this.file.path, items);
		this.plugin.refreshAllKanbanViews();
		await this.refresh();
	}
}












