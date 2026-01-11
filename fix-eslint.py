import re

with open('main.ts', 'r', encoding='utf-8') as f:
    content = f.read()

fixes = []

# Fix 1: let -> const for 'leaves' at line 233
old = '\t\t\tlet leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CHECKLIST);'
new = '\t\t\tconst leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CHECKLIST);'
if old in content:
    content = content.replace(old, new)
    fixes.append('let -> const for leaves')

# Fix 2 & 3: Remove type annotations for boardContent and folderPath in FolderKanbanView
old = '\tboardFile: TFile | null = null;\n\tboardContent: string = \'\';\n\tfolderPath: string = \'\';'
new = '\tboardFile: TFile | null = null;\n\tboardContent = \'\';\n\tfolderPath = \'\';'
if old in content:
    content = content.replace(old, new)
    fixes.append('Remove type annotations for boardContent and folderPath in FolderKanbanView')

# Fix 4: Remove non-null assertions on line 625 - replace with optional chaining check
old = '\t\t\tnew BoardCustomizeModal(this.app, this.plugin, this.boardFile!.parent!.name, this.boardFile!.path, this.boardFile!, this.cards, () => { void this.refresh(); }).open();'
new = '\t\t\tif (this.boardFile?.parent) {\n\t\t\t\tnew BoardCustomizeModal(this.app, this.plugin, this.boardFile.parent.name, this.boardFile.path, this.boardFile, this.cards, () => { void this.refresh(); }).open();\n\t\t\t}'
if old in content:
    content = content.replace(old, new)
    fixes.append('Remove non-null assertions at line 625')

# Fix 5 & 6: Remove non-null assertions for input clearing (pattern/columns)
old = '\t\t\t\t\tpatternInputEl!.value = \'\';\n\t\t\t\t\tcolumnsInputEl!.value = \'\';'
new = '\t\t\t\t\tif (patternInputEl) patternInputEl.value = \'\';\n\t\t\t\t\tif (columnsInputEl) columnsInputEl.value = \'\';'
if old in content:
    content = content.replace(old, new)
    fixes.append('Remove non-null assertions for pattern/columns input clearing')

# Fix 7 & 8: Remove non-null assertions for input clearing (tag/color)
old = '\t\t\t\t\t\ttagInputEl!.value = \'\';\n\t\t\t\t\t\tcolorInputEl!.value = \'\';'
new = '\t\t\t\t\t\tif (tagInputEl) tagInputEl.value = \'\';\n\t\t\t\t\t\tif (colorInputEl) colorInputEl.value = \'\';'
if old in content:
    content = content.replace(old, new)
    fixes.append('Remove non-null assertions for tag/color input clearing')

# Fix 9: Remove type annotation for boardContent in BoardCustomizeModal
old = '\ttempColumns: string[];\n\ttempTagColors: {[key: string]: string};\n\tboardContent: string = \'\';'
new = '\ttempColumns: string[];\n\ttempTagColors: {[key: string]: string};\n\tboardContent = \'\';'
if old in content:
    content = content.replace(old, new)
    fixes.append('Remove type annotation for boardContent in BoardCustomizeModal')

# Fix 10: let -> const for boardContent and remove unused columnLine
old = '\t\t\tlet boardContent = this.boardContent;\n\t\t\tconst columnLine = this.tempColumns.join(\', \');\n\t\t\t\n\t\t\t// Check if ## Columns section exists\n\t\t\tif (boardContent.includes(\'## Columns\')) {\n\t\t\t\t}'
new = '\t\t\tconst boardContent = this.boardContent;\n\t\t\t\n\t\t\t// Check if ## Columns section exists\n\t\t\tif (boardContent.includes(\'## Columns\')) {\n\t\t\t\t// Empty block - columns section exists but no action needed\n\t\t\t}'
if old in content:
    content = content.replace(old, new)
    fixes.append('Fix let->const for boardContent, remove unused columnLine, add comment to empty block')

# Fix 11: Remove type annotation for focusNewInputNext
old = '\titems: { text: string; checked: boolean }[] = [];\n\tfocusNewInputNext: boolean = false;'
new = '\titems: { text: string; checked: boolean }[] = [];\n\tfocusNewInputNext = false;'
if old in content:
    content = content.replace(old, new)
    fixes.append('Remove type annotation for focusNewInputNext')

with open('main.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✓ Applied {len(fixes)} fixes:")
for fix in fixes:
    print(f"  - {fix}")
