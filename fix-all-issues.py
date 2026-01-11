import re

with open('main.ts', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    # Void operator fixes
    ('\t\t\t\t.onClick(async () => {\n\t\t\t\t\tdelete this.plugin.settings.customColumns[pattern];\n\t\t\t\t\tawait this.plugin.saveSettings();\n\t\t\t\t\tthis.display();\n\t\t\t\t}));',
     '\t\t\t\t.onClick(async () => {\n\t\t\t\t\tdelete this.plugin.settings.customColumns[pattern];\n\t\t\t\t\tawait this.plugin.saveSettings();\n\t\t\t\t\tvoid this.display();\n\t\t\t\t}));'),
    
    ('\t\t\t\t\t\t.onClick(async () => {\n\t\t\t\t\t\t\tdelete this.plugin.settings.tagColors[activeBoardPath][tag];\n\t\t\t\t\t\t\tawait this.plugin.saveSettings();\n\t\t\t\t\t\t\tthis.display();\n\t\t\t\t\t\t});',
     '\t\t\t\t\t\t.onClick(async () => {\n\t\t\t\t\t\t\tdelete this.plugin.settings.tagColors[activeBoardPath][tag];\n\t\t\t\t\t\t\tawait this.plugin.saveSettings();\n\t\t\t\t\t\t\tvoid this.display();\n\t\t\t\t\t\t});'),
    
    # Sentence case fixes
    ("new Setting(containerEl).setHeading().setName('Column customization');",
     "new Setting(containerEl).setHeading().setName('Column customization');"),  # Already correct
    
    (".setName('Add new folder pattern')",
     ".setName('Add new folder pattern')"),  # Already correct
    
    ("new Setting(containerEl).setHeading().setName('Tag color customization');",
     "new Setting(containerEl).setHeading().setName('Tag color customization');"),  # Already correct
    
    (".setName('Board Columns')",
     ".setName('Board columns')"),
    
    ("new Setting(contentEl).setHeading().setName('Tag colors');",
     "new Setting(contentEl).setHeading().setName('Tag colors');"),  # Already correct
]

count = 0
for old, new in replacements:
    if old != new and old in content:
        content = content.replace(old, new)
        count += 1
        print(f"✓ Replaced: {old[:50]}...")

with open('main.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✓ Applied {count} fixes")
