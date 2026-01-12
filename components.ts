/**
 * Custom Kanban Card Component
 */
export class KanbanCard extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		const title = this.getAttribute('title') || 'Untitled';
		const tag = this.getAttribute('tag') || 'default';
		const tagColor = this.getAttribute('tagColor') || '#3b82f6';
		const checked = parseInt(this.getAttribute('checked') || '0');
		const total = parseInt(this.getAttribute('total') || '0');
		const nextTask = this.getAttribute('nextTask') || '';
		const hasProgress = total > 0;

		// Set CSS variable for tag color
		this.style.setProperty('--tag-color', tagColor);

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

		const progressComponent = document.createElement('kanban-progress') as KanbanProgress;
		progressComponent.setAttribute('checked', checked.toString());
		progressComponent.setAttribute('total', total.toString());
		progressComponent.setAttribute('tagColor', tagColor);
		progressComponent.classList.toggle('hidden', !hasProgress);
		contentDiv.appendChild(progressComponent);

		// Create next task element
		const nextTaskEl = document.createElement('div');
		nextTaskEl.className = 'next-task';
		nextTaskEl.classList.toggle('hidden', !nextTask);
		if (nextTask) {
			nextTaskEl.textContent = nextTask;
		}
		contentDiv.appendChild(nextTaskEl);

		container.appendChild(contentDiv);

		this.appendChild(container);

		// Make element draggable
		this.setAttribute('draggable', 'true');
	}

	attributeChangedCallback(name: string) {
		if (name === 'checked' || name === 'total') {
			const progressEl = this.querySelector('kanban-progress') as KanbanProgress | null;
			if (progressEl) {
				progressEl.setAttribute(name, this.getAttribute(name) || '0');
				// Show/hide progress based on total value
				const total = parseInt(this.getAttribute('total') || '0');
				progressEl.classList.toggle('hidden', total === 0);
			}
		}
	}

	static get observedAttributes() {
		return ['checked', 'total'];
	}
}

/**
 * Custom Checklist Item Component
 */
export class ChecklistItem extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		const text = this.getAttribute('text') || 'Item';
		const checked = this.hasAttribute('checked');

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
		removeBtn.textContent = '🗑️';

		container.appendChild(checkbox);
		container.appendChild(label);
		container.appendChild(removeBtn);

		this.appendChild(container);

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
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback(name: string) {
		if ((name === 'checked' || name === 'total' || name === 'tagColor')) {
			while (this.firstChild) { this.removeChild(this.firstChild); }
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

		const container = document.createElement('div');
		container.className = 'progress-container';

		const progressBar = document.createElement('div');
		progressBar.className = 'progress-bar';

		const progressFill = document.createElement('div');
		progressFill.className = 'progress-fill';
		progressFill.style.width = `${percent}%`;
		progressFill.style.setProperty('background', `linear-gradient(90deg, ${tagColor} 0%, ${this.lightenColor(tagColor)} 100%)`);

		progressBar.appendChild(progressFill);

		const progressText = document.createElement('div');
		progressText.className = 'progress-text';
		progressText.textContent = `${checked}/${total}`;

		container.appendChild(progressBar);
		container.appendChild(progressText);

		this.appendChild(container);
	}

	private lightenColor(hex: string): string {
		const num = parseInt(hex.replace('#', ''), 16);
		const r = Math.min(255, (num >> 16) + 60);
		const g = Math.min(255, ((num >> 8) & 0x00ff) + 60);
		const b = Math.min(255, (num & 0x0000ff) + 60);
		const result = (r << 16) | (g << 8) | b;
		return '#' + result.toString(16).padStart(6, '0');
	}
}

/**
 * Custom Tag Color Edit Item Component
 */
export class TagColorEditItem extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		const tagName = this.getAttribute('tagName') || 'tag';
		const color = this.getAttribute('color') || '#3b82f6';

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
		removeBtn.textContent = '✕';

		colorWrapper.appendChild(colorPicker);
		colorWrapper.appendChild(colorText);

		container.appendChild(label);
		container.appendChild(colorWrapper);
		container.appendChild(removeBtn);

		this.appendChild(container);

		// Events
		colorPicker.addEventListener('change', (e) => {
			const target = e.target as HTMLInputElement;
			const newColor = target.value;
			colorText.textContent = newColor.toUpperCase();
			this.dispatchEvent(new CustomEvent('colorchange', { detail: { color: newColor } }));
		});

		colorPicker.addEventListener('input', (e) => {
			const target = e.target as HTMLInputElement;
			const newColor = target.value;
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





