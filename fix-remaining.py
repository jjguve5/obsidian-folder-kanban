import re

with open('main.ts', 'r', encoding='utf-8') as f:
    content = f.read()

fixes = []

# Fix 1: Remove async from scanFolderForCards (no await inside)
old = '\tasync scanFolderForCards() {'
new = '\tscanFolderForCards() {'
if old in content:
    content = content.replace(old, new)
    fixes.append('Remove async from scanFolderForCards')

# Fix 2 & 3: Remove unnecessary type assertions (el as HTMLElement)
old1 = '\t\t\tconst key = (el as HTMLElement).dataset.filePath?.toLowerCase();'
new1 = '\t\t\tconst key = el.dataset.filePath?.toLowerCase();'
content = content.replace(old1, new1)
fixes.append('Remove unnecessary (el as HTMLElement) assertions')

# Fix 4: Replace h2 HTML element with Setting.setHeading()
old = "\t\tcontainerEl.createEl('h2', {text: 'Folder Kanban Settings'});"
new = "\t\tnew Setting(containerEl).setName('Folder Kanban settings').setHeading();"
if old in content:
    content = content.replace(old, new)
    fixes.append('Replace h2 with Setting.setHeading() in settings')

# Fix 5: Replace h2 HTML element in modal
old = "\t\tcontentEl.createEl('h2', { text: `Customize ${this.folderName} Board` });"
new = "\t\tnew Setting(contentEl).setName(`Customize ${this.folderName} board`).setHeading();"
if old in content:
    content = content.replace(old, new)
    fixes.append('Replace h2 with Setting.setHeading() in modal')

# Fix 6: Remove unused 'e' parameter in addEventListener
old = '\ttagNameInput.addEventListener(\'change\', (e) => {\n\t\tconst target = e.target as HTMLInputElement;'
new = '\ttagNameInput.addEventListener(\'change\', (e: Event) => {\n\t\tconst target = e.target as HTMLInputElement;'
if old in content:
    content = content.replace(old, new)
    fixes.append('Add type to e parameter')

old = '\tcolorPicker.addEventListener(\'change\', (e) => {\n\t\tconst target = e.target as HTMLInputElement;'
new = '\tcolorPicker.addEventListener(\'change\', (e: Event) => {\n\t\tconst target = e.target as HTMLInputElement;'
if old in content:
    content = content.replace(old, new)
    fixes.append('Add type to e parameter for color picker')

# Fix 7-11: Sentence case for UI text
replacements = [
    ('text: \'No board file loaded. Please open a Board.md file.\'', 
     'text: \'No board file loaded. Please open a board file.\''),
    ('text: \'Customize\'', 
     'text: \'Customize\''),  # Already OK
    ('text: \'Add custom tag color\'', 
     'text: \'Add custom tag color\''),  # Already OK
    ('text: \'Add\'', 
     'text: \'Add\''),  # Already OK
    ('text: \'Save\'', 
     'text: \'Save\''),  # Already OK
    ('text: \'Cancel\'', 
     'text: \'Cancel\''),  # Already OK
]

for old_text, new_text in replacements:
    if old_text != new_text and old_text in content:
        content = content.replace(old_text, new_text)
        fixes.append(f'Fix sentence case: {old_text[:40]}')

# Fix 12-17: Add void operator to Promise-returning addEventListener handlers
# toggleItem and removeItem return promises
old = '\t\t\t\tthis.toggleItem(index, e.detail.checked);'
new = '\t\t\t\tvoid this.toggleItem(index, e.detail.checked);'
if old in content:
    content = content.replace(old, new)
    fixes.append('Add void to toggleItem call')

old = '\t\t\t\tthis.removeItem(index);'
new = '\t\t\t\tvoid this.removeItem(index);'
if old in content:
    content = content.replace(old, new)
    fixes.append('Add void to removeItem call')

with open('main.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✓ Applied {len(fixes)} fixes:")
for fix in fixes:
    print(f"  - {fix}")
