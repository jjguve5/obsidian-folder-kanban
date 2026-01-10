/**
 * Custom Kanban Card Component
 */
export class KanbanCard extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
	
		const title = this.getAttribute('title') || 'Untitled';
		const tag = this.getAttribute('tag') || 'default';
		const tagColor = this.getAttribute('tagColor') || '#3b82f6';
		const checked = parseInt(this.getAttribute('checked') || '0');
		const total = parseInt(this.getAttribute('total') || '0');
		const nextTask = this.getAttribute('nextTask') || '';
		const hasProgress = total > 0;

		const style = document.createElement('style');
		style.textContent = `
			:host {
				display: block;
				--tag-color: ${tagColor};
			}
			:host(.dragging) {
				opacity: 0.5;
			}
			.kanban-card {
				background-color: var(--background-primary, #1e1e1e);
				border: 2px solid var(--background-modifier-border, #3f3f3f);
				border-radius: 8px;
				padding: 12px;
				margin-bottom: 8px;
				cursor: grab;
				transition: all 0.2s ease;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
				position: relative;

			}
			.kanban-card::before {
				content: '';
				position: absolute;
				left: 0;
				top: 0;
				bottom: 0;
				width: 3px;
				background: linear-gradient(to bottom, var(--tag-color), rgba(0,0,0,0.2));
			}
			.kanban-card:hover {
				border-color: var(--tag-color);
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
				transform: translateY(-2px);
				cursor: grab;
			}
			.kanban-card:active {
				cursor: grabbing;
			}
			.card-content {
				display: flex;
				flex-direction: column;
				gap: 8px;
				padding-left: 6px;
			}
			.card-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				gap: 8px;
			}
			.kanban-card-title {
				font-weight: 600;
				color: var(--text-normal, #ececec);
				word-wrap: break-word;
				line-height: 1.4;
				font-size: 0.95em;
				flex: 1;
			}
			.kanban-card-tag {
				display: flex;
				gap: 6px;
				flex-wrap: wrap;
				flex-shrink: 0;
			}
			.tag {
				display: inline-block;
				padding: 3px 10px;
				background: linear-gradient(135deg, var(--tag-color), rgba(255,255,255,0.1));
				color: white;
				border-radius: 14px;
				font-size: 0.75em;
				font-weight: 600;
				border: 1px solid rgba(255,255,255,0.15);
				box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
			}
			.next-task {
				font-size: 0.85em;
				color: var(--text-muted, #999);
				font-style: italic;
				padding: 8px 0 4px 0;
				line-height: 1.3;
				border-top: 1px solid var(--background-modifier-border, #3f3f3f);
				margin-top: 6px;
				padding-top: 8px;
			}
			.next-task::before {
				content: '→ ';
				color: var(--tag-color);
				font-weight: bold;
				margin-right: 4px;
			}
		`;

		const container = document.createElement('div');
		container.className = 'kanban-card';

		const contentDiv = document.createElement('div');
		contentDiv.className = 'card-content';

		const headerDiv = document.createElement('div');
		headerDiv.className = 'card-header';

		const titleEl = document.createElement('div');
		titleEl.className = 'kanban-card-title';
		titleEl.textContent = title;

		const tagEl = document.createElement('div');
		tagEl.className = 'kanban-card-tag';
		const tagSpan = document.createElement('span');
		tagSpan.className = 'tag';
		tagSpan.textContent = `#${tag}`;
		tagEl.appendChild(tagSpan);

		headerDiv.appendChild(titleEl);
		headerDiv.appendChild(tagEl);
		contentDiv.appendChild(headerDiv);

		const progressComponent = document.createElement('kanban-progress') as any;
		progressComponent.setAttribute('checked', checked.toString());
		progressComponent.setAttribute('total', total.toString());
		progressComponent.setAttribute('tagColor', tagColor);
		progressComponent.style.display = hasProgress ? 'block' : 'none';
		contentDiv.appendChild(progressComponent);

		// Create next task element (hidden by default, shown when attribute is set)
		const nextTaskEl = document.createElement('div');
		nextTaskEl.className = 'next-task';
		nextTaskEl.style.display = nextTask ? 'block' : 'none';
		if (nextTask) {
			nextTaskEl.textContent = nextTask;
		}
		contentDiv.appendChild(nextTaskEl);

		container.appendChild(contentDiv);

		this.shadowRoot?.appendChild(style);
		this.shadowRoot?.appendChild(container);

		// Make element draggable and bubble events
		this.setAttribute('draggable', 'true');
	}

	attributeChangedCallback(name: string) {
		if ((name === 'checked' || name === 'total') && this.shadowRoot) {
			const progressEl = this.shadowRoot.querySelector('kanban-progress') as any;
			if (progressEl) {
				progressEl.setAttribute(name, this.getAttribute(name) || '0');
				// Show/hide progress based on total value
				const total = parseInt(this.getAttribute('total') || '0');
				progressEl.style.display = total > 0 ? 'block' : 'none';
			}
		}
	}

	static get observedAttributes() {
		return ['checked', 'total'];
	}

	private lightenColor(color: string): string {
		const num = parseInt(color.replace('#', ''), 16);
		const amt = 40;
		const usePound = true;
		const R = Math.min(255, (num >> 16) + amt);
		const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
		const B = Math.min(255, (num & 0x0000FF) + amt);
		return (usePound ? '#' : '') + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
	}
}

/**
 * Custom Checklist Item Component
 */
export class ChecklistItem extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		const text = this.getAttribute('text') || 'Item';
		const checked = this.hasAttribute('checked');

		const style = document.createElement('style');
		style.textContent = `
			:host {
				display: block;
			}
			.checklist-item {
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 8px 4px;
				border-bottom: 1px solid var(--background-modifier-border, #3f3f3f);
			}
			.checklist-item:last-child {
				border-bottom: none;
			}
			input[type="checkbox"] {
				cursor: pointer;
				width: 16px;
				height: 16px;
				flex-shrink: 0;
				accent-color: var(--interactive-accent, #3b82f6);
			}
			.checklist-label {
				cursor: pointer;
				flex: 1;
				min-width: 0;
				display: block;
				font-size: 13px;
				color: var(--text-normal, #ececec);
				user-select: none;
				line-height: 1.4;
				word-break: break-word;
			}
			input[type="checkbox"]:checked + .checklist-label {
				color: var(--text-muted, #999);
				text-decoration: line-through;
			}
			.checklist-remove-btn {
				margin-left: 4px;
				width: 28px;
				height: 28px;
				display: grid;
				place-items: center;
				border: 1px solid var(--background-modifier-border, #3f3f3f);
				border-radius: 6px;
				background: var(--background-modifier-hover, #2d2d2d);
				color: var(--text-muted, #999);
				cursor: pointer;
				flex-shrink: 0;
				padding: 0;
				font-size: 16px;
				transition: all 0.2s;
			}
			.checklist-remove-btn:hover {
				color: var(--text-normal, #ececec);
				border-color: var(--interactive-accent, #3b82f6);
			}
		`;

		const container = document.createElement('div');
		container.className = 'checklist-item';

		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.checked = checked;

		const label = document.createElement('span');
		label.className = 'checklist-label';
		label.textContent = text;

		const removeBtn = document.createElement('button');
		removeBtn.className = 'checklist-remove-btn';
		removeBtn.setAttribute('aria-label', 'Remove item');
		removeBtn.setAttribute('type', 'button');
		removeBtn.innerHTML = '🗑️'; // Trash emoji as fallback; can be replaced with setIcon

		container.appendChild(checkbox);
		container.appendChild(label);
		container.appendChild(removeBtn);

		this.shadowRoot?.appendChild(style);
		this.shadowRoot?.appendChild(container);

		// Emit events
		checkbox.addEventListener('change', () => {
			this.dispatchEvent(new CustomEvent('toggle', { detail: { checked: checkbox.checked } }));
		});

		removeBtn.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('remove'));
		});
	}
}

/**
 * Custom Progress Bar Component
 */
export class KanbanProgress extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
	
		const checked = parseInt(this.getAttribute('checked') || '0');
		const total = parseInt(this.getAttribute('total') || '0');
		const tagColor = this.getAttribute('tagColor') || '#3b82f6';
		const percent = total > 0 ? Math.min(100, Math.max(0, (checked / total) * 100)) : 0;

		const style = document.createElement('style');
		style.textContent = `
			:host {
				display: block;
			}
			.progress-container {
				display: flex;
				align-items: center;
				gap: 8px;
				width: 100%;
			}
			.progress-bar {
				flex: 1;
				height: 16px;
				background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
				border: 1px solid rgba(255,255,255,0.15);
				border-radius: 8px;
				overflow: hidden;
				box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
				position: relative;
			}
			.progress-fill {
				height: 100%;
				background: linear-gradient(90deg, ${tagColor} 0%, ${this.lightenColor(tagColor)} 100%);
				border-radius: 8px;
				transition: width 0.3s ease;
				box-shadow: inset -1px 0 0 rgba(255,255,255,0.15), 0 0 8px rgba(0,0,0,0.2);
				position: relative;
				width: 0;
			}
			.progress-fill::after {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%);
				border-radius: 8px;
			}
			.progress-text {
				font-size: 11px;
				color: var(--text-normal, #ececec);
				font-weight: 600;
				min-width: 40px;
				text-align: right;
				opacity: 0.8;
				letter-spacing: 0.3px;
			}
		`;

		const container = document.createElement('div');
		container.className = 'progress-container';

		const progressBar = document.createElement('div');
		progressBar.className = 'progress-bar';

		const progressFill = document.createElement('div');
		progressFill.className = 'progress-fill';
		progressFill.style.width = `${percent}%`;

		progressBar.appendChild(progressFill);

		const progressText = document.createElement('div');
		progressText.className = 'progress-text';
		progressText.textContent = `${checked}/${total}`;

		container.appendChild(progressBar);
		container.appendChild(progressText);

		this.shadowRoot?.appendChild(style);
		this.shadowRoot?.appendChild(container);
	}

	attributeChangedCallback(name: string) {
		if ((name === 'checked' || name === 'total' || name === 'tagColor') && this.shadowRoot) {
			this.shadowRoot.innerHTML = '';
			this.render();
		}
	}

	static get observedAttributes() {
		return ['checked', 'total', 'tagColor'];
	}

	private render() {
		const checked = parseInt(this.getAttribute('checked') || '0');
		const total = parseInt(this.getAttribute('total') || '0');
		const tagColor = this.getAttribute('tagColor') || '#3b82f6';
		const percent = total > 0 ? Math.min(100, Math.max(0, (checked / total) * 100)) : 0;

		const style = document.createElement('style');
		style.textContent = `
			:host {
				display: block;
			}
			.progress-container {
				display: flex;
				align-items: center;
				gap: 8px;
				width: 100%;
			}
			.progress-bar {
				flex: 1;
				height: 16px;
				background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
				border: 1px solid rgba(255,255,255,0.15);
				border-radius: 8px;
				overflow: hidden;
				box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
				position: relative;
			}
			.progress-fill {
				height: 100%;
				background: linear-gradient(90deg, ${tagColor} 0%, ${this.lightenColor(tagColor)} 100%);
				border-radius: 8px;
				transition: width 0.3s ease;
				box-shadow: inset -1px 0 0 rgba(255,255,255,0.15), 0 0 8px rgba(0,0,0,0.2);
				position: relative;
				width: 0;
			}
			.progress-fill::after {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%);
				border-radius: 8px;
			}
			.progress-text {
				font-size: 11px;
				color: var(--text-normal, #ececec);
				font-weight: 600;
				min-width: 40px;
				text-align: right;
				opacity: 0.8;
				letter-spacing: 0.3px;
			}
		`;

		const container = document.createElement('div');
		container.className = 'progress-container';

		const progressBar = document.createElement('div');
		progressBar.className = 'progress-bar';

		const progressFill = document.createElement('div');
		progressFill.className = 'progress-fill';
		progressFill.style.width = `${percent}%`;

		progressBar.appendChild(progressFill);

		const progressText = document.createElement('div');
		progressText.className = 'progress-text';
		progressText.textContent = `${checked}/${total}`;

		container.appendChild(progressBar);
		container.appendChild(progressText);

		this.shadowRoot?.appendChild(style);
		this.shadowRoot?.appendChild(container);
	}

	private lightenColor(hex: string): string {
		const num = parseInt(hex.replace('#', ''), 16);
		const r = Math.min(255, (num >> 16) + 60);
		const g = Math.min(255, ((num >> 8) & 0x00ff) + 60);
		const b = Math.min(255, (num & 0x0000ff) + 60);
		return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).substring(1);
	}
}

/**
 * Custom Tag Color Edit Item Component
 */
export class TagColorEditItem extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		const tagName = this.getAttribute('tagName') || 'tag';
		const color = this.getAttribute('color') || '#3b82f6';

		const style = document.createElement('style');
		style.textContent = `
			:host {
				display: block;
			}
			.tag-color-row {
				display: flex;
				align-items: center;
				gap: 12px;
				padding: 12px;
				background-color: var(--background-primary, #1e1e1e);
				border: 1px solid var(--background-modifier-border, #3f3f3f);
				border-radius: 6px;
				transition: all 0.2s;
			}
			.tag-color-row:hover {
				background-color: var(--background-secondary, #252525);
				border-color: var(--interactive-accent-hover, #60a5fa);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
			}
			.tag-color-label {
				flex: 0 1 auto;
				font-weight: 500;
				color: var(--text-normal, #ececec);
				font-size: 0.92em;
				font-family: monospace;
				letter-spacing: 0.3px;
				min-width: 100px;
			}
			.color-picker-wrapper {
				flex: 1;
				display: flex;
				align-items: center;
				gap: 8px;
			}
			input[type="color"] {
				cursor: pointer;
				width: 50px;
				height: 40px;
				border: 2px solid var(--background-modifier-border, #3f3f3f);
				border-radius: 6px;
				transition: all 0.2s;
				flex-shrink: 0;
				padding: 2px;
			}
			input[type="color"]:hover {
				border-color: var(--interactive-accent, #3b82f6);
				box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
			}
			.color-text {
				font-size: 12px;
				color: var(--text-muted, #999);
				font-family: monospace;
				flex-shrink: 0;
			}
			.tag-remove-btn {
				cursor: pointer;
				padding: 6px 8px;
				border: 1px solid var(--background-modifier-border, #3f3f3f);
				border-radius: 4px;
				background: none;
				color: var(--text-muted, #999);
				font-weight: 600;
				font-size: 0.95em;
				transition: all 0.2s;
				flex-shrink: 0;
				line-height: 1;
				width: 32px;
				height: 32px;
				display: flex;
				align-items: center;
				justify-content: center;
			}
			.tag-remove-btn:hover {
				color: var(--text-error, #e74c3c);
				border-color: var(--text-error, #e74c3c);
				background-color: rgba(231, 76, 60, 0.1);
			}
		`;

		const container = document.createElement('div');
		container.className = 'tag-color-row';

		const label = document.createElement('div');
		label.className = 'tag-color-label';
		label.textContent = tagName;

		const colorWrapper = document.createElement('div');
		colorWrapper.className = 'color-picker-wrapper';

		const colorPicker = document.createElement('input');
		colorPicker.type = 'color';
		colorPicker.value = color;

		const colorText = document.createElement('span');
		colorText.className = 'color-text';
		colorText.textContent = color.toUpperCase();

		const removeBtn = document.createElement('button');
		removeBtn.className = 'tag-remove-btn';
		removeBtn.setAttribute('aria-label', `Remove ${tagName} color`);
		removeBtn.setAttribute('type', 'button');
		removeBtn.innerHTML = '✕';

		colorWrapper.appendChild(colorPicker);
		colorWrapper.appendChild(colorText);

		container.appendChild(label);
		container.appendChild(colorWrapper);
		container.appendChild(removeBtn);

		this.shadowRoot?.appendChild(style);
		this.shadowRoot?.appendChild(container);

		// Events
		colorPicker.addEventListener('change', (e) => {
			const newColor = (e.target as HTMLInputElement).value;
			colorText.textContent = newColor.toUpperCase();
			this.dispatchEvent(new CustomEvent('colorchange', { detail: { color: newColor } }));
		});

		colorPicker.addEventListener('input', (e) => {
			const newColor = (e.target as HTMLInputElement).value;
			colorText.textContent = newColor.toUpperCase();
		});

		removeBtn.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('remove'));
		});
	}
}

// Register custom elements
customElements.define('kanban-card', KanbanCard);
customElements.define('checklist-item', ChecklistItem);
customElements.define('kanban-progress', KanbanProgress);
customElements.define('tag-color-edit-item', TagColorEditItem);
