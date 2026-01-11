import re

with open('main.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = '''\t\t\t});

\t\t\t// Add new tag color
\t\t\tnew Setting(containerEl)
\t\t\t\t.setName('Add custom tag color')
\t\t\t\t.addText(text => text
\t\t\t\t\t.setPlaceholder('Tag name')
\t\t\t\t\t.onChange(value => text.inputEl.dataset.tag = value))
\t\t\t\t.addText(text => text
\t\t\t\t\t.setPlaceholder('#3b82f6')
\t\t\t\t\t.onChange(value => text.inputEl.dataset.color = value))
\t\t\t\t.addButton(btn => btn
\t\t\t\t\t.setButtonText('Add')
\t\t\t\t\t.onClick(async () => {
\t\t\t\t\t\tconst inputs = containerEl.querySelectorAll('.setting-item:last-of-type input');
\t\t\t\t\t\tconst tagInput = inputs[0] as HTMLInputElement;
\t\t\t\t\t\tconst colorInput = inputs[1] as HTMLInputElement;
\t\t\t\t\t\t
\t\t\t\t\t\tconst tag = tagInput?.value?.trim();
\t\t\t\t\t\tconst color = colorInput?.value?.trim();

\t\t\t\t\t\tif (tag && /^#[0-9A-F]{6}$/i.test(color)) {
\t\t\t\t\t\t\tthis.plugin.settings.tagColors[activeBoardPath][tag] = color;
\t\t\t\t\t\t\tawait this.plugin.saveSettings();
\t\t\t\t\t\t\ttagInput.value = '';
\t\t\t\t\t\t\tcolorInput.value = '';
\t\t\t\t\t\t\tthis.display();
\t\t\t\t\t\t}
\t\t\t\t\t}));
\t\t} else {'''

new_code = '''\t\t\t});

\t\t\t// Add new tag color
\t\t\tlet tagInputEl: HTMLInputElement | undefined;
\t\t\tlet colorInputEl: HTMLInputElement | undefined;
\t\t\tnew Setting(containerEl)
\t\t\t\t.setName('Add custom tag color')
\t\t\t\t.addText(text => {
\t\t\t\t\ttagInputEl = text.inputEl;
\t\t\t\t\treturn text.setPlaceholder('Tag name');
\t\t\t\t})
\t\t\t\t.addText(text => {
\t\t\t\t\tcolorInputEl = text.inputEl;
\t\t\t\t\treturn text.setPlaceholder('#3b82f6');
\t\t\t\t})
\t\t\t\t.addButton(btn => btn
\t\t\t\t\t.setButtonText('Add')
\t\t\t\t\t.onClick(async () => {
\t\t\t\t\t\tconst tag = tagInputEl?.value?.trim();
\t\t\t\t\t\tconst color = colorInputEl?.value?.trim();

\t\t\t\t\t\tif (tag && color && /^#[0-9A-F]{6}$/i.test(color)) {
\t\t\t\t\t\t\tthis.plugin.settings.tagColors[activeBoardPath][tag] = color;
\t\t\t\t\t\t\tawait this.plugin.saveSettings();
\t\t\t\t\t\t\ttagInputEl!.value = '';
\t\t\t\t\t\t\tcolorInputEl!.value = '';
\t\t\t\t\t\t\tvoid this.display();
\t\t\t\t\t\t}
\t\t\t\t\t}));
\t\t} else {'''

if old_code in content:
    content = content.replace(old_code, new_code)
    with open('main.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("✓ Fixed querySelector at line 976")
else:
    print("✗ Could not find old code")
