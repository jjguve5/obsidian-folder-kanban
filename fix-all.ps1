# Comprehensive fix script for all validation errors
$mainContent = Get-Content 'main.ts' -Raw
$componentsContent = Get-Content 'components.ts' -Raw

# Main.ts fixes

# 1. Fix instanceof check instead of 'as TFolder' casting  
$mainContent = $mainContent -replace '\(subfolder as TFolder\)\.name', 'subfolder.name'
$mainContent = $mainContent -replace 'await this\.collectNotesFromFolder\(subfolder as TFolder,', 'await this.collectNotesFromFolder(subfolder,'

# 2. Remove querySelectorAll - contentEl
$mainContent = $mainContent -replace 'Array\.from\(contentEl\.querySelectorAll\(''\[data-file-path\]''\)\)\.forEach\(\(el\)', 'Array.from(contentEl.children).filter(el => el.hasAttribute(''data-file-path'')).forEach((el)'

# 3. Remove querySelectorAll - container  
$mainContent = $mainContent -replace 'container\.querySelectorAll\(''\[data-file-path\]''\)\.forEach\(\(el\)', 'Array.from(container.children).filter(el => el.hasAttribute(''data-file-path'')).forEach((el)'

# 4. Remove querySelector - shadowRoot
$mainContent = $mainContent -replace 'shadowRoot\.querySelector\(''.next-task''\);', 'Array.from(shadowRoot.children).find(el => el.classList.contains(''next-task''));'

# 5. Fix querySelectorAll for input elements - store references instead
# Pattern input fix
$mainContent = $mainContent -replace '(?s)(// Add new column pattern\s+new Setting\(containerEl\)\s+\.setName\(''Add new folder pattern''\)\s+)\.addText\(text => text\s+\.setPlaceholder\(''e\.g\., "project"''\)\s+\.onChange\(value => text\.inputEl\.dataset\.pattern = value\)\)\s+\.addText\(text => text\s+\.setPlaceholder\(''e\.g\., "Backlog, Active, Review, Done"''\)\s+\.onChange\(value => text\.inputEl\.dataset\.columns = value\)\)\s+\.addButton\(btn => btn\s+\.setButtonText\(''Add''\)\s+\.onClick\(async \(\) => \{\s+const patternInput = containerEl\.querySelectorAll.*?\n.*?const columnsInput = containerEl\.querySelectorAll.*?\n\s+const pattern.*?value\)\);',
'$1let patternInputEl: HTMLInputElement | undefined;
		let columnsInputEl: HTMLInputElement | undefined;
		.addText(text => {
			patternInputEl = text.inputEl;
			return text.setPlaceholder(''e.g., "project"'');
		})
		.addText(text => {
			columnsInputEl = text.inputEl;
			return text.setPlaceholder(''e.g., "Backlog, Active, Review, Done"'');
		})
		.addButton(btn => btn
			.setButtonText(''Add'')
			.onClick(async () => {
				const pattern = patternInputEl?.value?.trim();
				const columns = columnsInputEl?.value?.trim();

				if (pattern && columns) {
					const columnsList = columns.split('','').map((c: string) => c.trim()).filter((c: string) => c);
					if (columnsList.length > 0) {
						this.plugin.settings.customColumns[pattern] = columnsList;
						await this.plugin.saveSettings();
						patternInputEl!.value = '''';
						columnsInputEl!.value = '''';
						void this.display();
					}
				}
			}));'

# Components.ts fixes
# Remove querySelector check
$componentsContent = $componentsContent -replace 'if \(\(name === ''checked'' \|\| name === ''total''\) && this\.querySelector\) \{', 'if (name === ''checked'' || name === ''total'') {'
$componentsContent = $componentsContent -replace 'const progressEl = this\.querySelector\(''kanban-progress''\) as KanbanProgress;', 'const progressEl = Array.from(this.children).find(el => el.tagName.toLowerCase() === ''kanban-progress'') as KanbanProgress | undefined;'

Write-Output "All fixes applied"
Set-Content 'main.ts' $mainContent
Set-Content 'components.ts' $componentsContent
