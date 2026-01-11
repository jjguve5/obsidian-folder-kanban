with open('main.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line 960 (index 959)
lines[959] = '\t\t\t\t\t\t\t\tvoid this.display();\n'
# Line 1106 (index 1105)
lines[1105] = '\t\t\t\tvoid this.onOpen();\n'

with open('main.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✓ Fixed lines 960 and 1106")
