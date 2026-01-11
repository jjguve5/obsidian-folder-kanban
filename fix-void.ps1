$lines = Get-Content main.ts
$lines[959] = "`t`t`t`t`t`t`t`tvoid this.display();"
$lines[1105] = "`t`t`t`tvoid this.onOpen();"
Set-Content main.ts $lines
Write-Host "Fixed lines 960 and 1106"
