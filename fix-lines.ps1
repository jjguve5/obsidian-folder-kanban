$lines = Get-Content main.ts
$lines[987] = "`t`t`t`t`t`t`tif (tagInputEl) tagInputEl.value = '';"
$lines[988] = "`t`t`t`t`t`t`tif (colorInputEl) colorInputEl.value = '';"
Set-Content main.ts $lines
Write-Host "Fixed lines 988-989"
