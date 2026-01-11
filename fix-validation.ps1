# Read the file
$content = Get-Content 'main.ts' -Raw

# Fix 1: Remove unused addCustomTitle
$content = $content -replace 'const addCustomTitle = addCustomSection\.createEl', 'addCustomSection.createEl'

# Fix 2: components.ts querySelector fix will be done separately

Write-Output "Fixes applied"
Set-Content 'main.ts' $content
