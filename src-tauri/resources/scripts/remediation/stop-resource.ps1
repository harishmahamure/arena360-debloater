param([string]$EntryJson)

$ErrorActionPreference = 'Stop'
$entry = $EntryJson | ConvertFrom-Json
$snapshot = [ordered]@{
    services = @()
    startup = @()
    processId = $entry.processId
}

# Stop process (skip svchost — disable services instead)
if ($entry.processName -ne 'svchost' -and $entry.processId) {
    Stop-Process -Id $entry.processId -Force -ErrorAction SilentlyContinue
}

foreach ($svcName in $entry.serviceNames) {
    $svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
    if ($svc) {
        $snapshot.services += [ordered]@{
            name = $svcName
            startType = $svc.StartType.ToString()
        }
        Stop-Service -Name $svcName -Force -ErrorAction SilentlyContinue
        Set-Service -Name $svcName -StartupType Disabled -ErrorAction SilentlyContinue
    }
}

$runKeys = @(
    'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run',
    'HKLM:\Software\Microsoft\Windows\CurrentVersion\Run'
)
foreach ($key in $runKeys) {
    if (-not (Test-Path $key)) { continue }
    Get-ItemProperty $key | Get-Member -MemberType NoteProperty | Where-Object { $_.Name -notmatch '^PS' } | ForEach-Object {
        $name = $_.Name
        $val = (Get-ItemProperty $key).$name
        if ("$val" -match [regex]::Escape($entry.processName) -or "$val" -match [regex]::Escape($entry.displayName)) {
            $snapshot.startup += [ordered]@{ key = $key; name = $name; value = "$val" }
            Remove-ItemProperty -Path $key -Name $name -ErrorAction SilentlyContinue
        }
    }
}

$snapshot | ConvertTo-Json -Depth 5 -Compress
