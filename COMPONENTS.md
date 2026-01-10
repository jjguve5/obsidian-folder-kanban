# Kanban Card Component

## Card Structure

```html
<div class="kanban-card" draggable="true">
  <div class="kanban-card-title">
    <span>Card Title</span>
  </div>
  
  <div class="kanban-card-tag">
    <span class="tag" style="background-color: #3b82f6;">#Category</span>
  </div>
  
  <div class="card-progress">
    <progress max="5" value="2" style="accent-color: #3b82f6;"></progress>
    <div class="card-progress-stats">2/5</div>
  </div>
</div>
```

## Card Styles

```css
.kanban-card {
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.kanban-card:hover {
    border-color: var(--interactive-accent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
}

.kanban-card-title {
    font-weight: 500;
    margin-bottom: 8px;
    color: var(--text-normal);
    word-wrap: break-word;
}

.kanban-card-tag {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 8px;
}

.kanban-card-tag .tag {
    display: inline-block;
    padding: 2px 8px;
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    border-radius: 12px;
    font-size: 0.85em;
    font-weight: 500;
}

.card-progress {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.card-progress progress {
    width: 100%;
    height: 14px;
    appearance: none;
    -webkit-appearance: none;
    background: linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.12));
    border: 1px solid rgba(255,255,255,0.20);
    border-radius: 999px;
    overflow: hidden;
    accent-color: var(--interactive-accent);
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.35);
}

.card-progress progress::-webkit-progress-bar {
    background: transparent;
}

.card-progress progress::-webkit-progress-value {
    background: linear-gradient(90deg, var(--interactive-accent) 0%, var(--interactive-accent-hover) 100%);
    box-shadow: inset 0 0 3px rgba(0,0,0,0.25);
}

.card-progress progress::-moz-progress-bar {
    background: linear-gradient(90deg, var(--interactive-accent) 0%, var(--interactive-accent-hover) 100%);
    box-shadow: inset 0 0 3px rgba(0,0,0,0.25);
}

.card-progress-stats {
    font-size: 12px;
    color: var(--text-normal);
    line-height: 1.3;
    opacity: 0.8;
}
```

---

# Checklist Item Component

## Item Structure

```html
<div class="checklist-item">
  <input type="checkbox" checked />
  <span class="checklist-label">Item text here with full width support</span>
  <button class="checklist-remove-btn" aria-label="Remove item" type="button">
    <!-- trash icon rendered via setIcon -->
  </button>
</div>
```

## Item Styles

```css
.checklist-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 4px;
    border-bottom: 1px solid var(--background-modifier-border);
}

.checklist-item:last-child {
    border-bottom: none;
}

.checklist-item input[type="checkbox"] {
    cursor: pointer;
    margin-right: 10px;
    width: 16px;
    height: 16px;
    accent-color: var(--interactive-accent);
    flex-shrink: 0;
}

.checklist-label {
    cursor: pointer;
    flex: 1;
    min-width: 0;
    display: block;
    font-size: 13px;
    color: var(--text-normal);
    user-select: none;
    line-height: 1.4;
    word-break: break-word;
}

.checklist-item input[type="checkbox"]:checked + .checklist-label {
    color: var(--text-muted);
    text-decoration: line-through;
}

.checklist-remove-btn {
    margin-left: 4px;
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    background: var(--background-modifier-hover);
    color: var(--text-muted);
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
}

.checklist-remove-btn:hover {
    color: var(--text-normal);
    border-color: var(--interactive-accent);
}

.checklist-container input[type="text"] {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
}

.checklist-new-row input[type="text"] {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    background: var(--background-primary);
    color: var(--text-normal);
}
```

---

## Component Usage Notes

- **Card**: Use in `.kanban-column-content` with drag-drop event handlers
- **Checklist Item**: Use in `.checklist-container` with event listeners for checkbox toggle and remove button
- **Colors**: Progress bar inherits tag color via `style.accentColor = tagColor`
- **Icons**: Remove button uses Obsidian's `setIcon(btn, 'trash')` API
- **Responsive**: Both components use flex layout with proper overflow handling
