param([string]$SnapshotJson)

$ErrorActionPreference = 'SilentlyContinue'
$snapshot = $SnapshotJson | ConvertFrom-Json

foreach ($svc in $snapshot.services) {
    Set-Service -Name $svc.name -StartupType $svc.startType -ErrorAction SilentlyContinue
    if ($svc.startType -ne 'Disabled') {
        Start-Service -Name $svc.name -ErrorAction SilentlyContinue
    }
}

foreach ($item in $snapshot.startup) {
    if (-not (Test-Path $item.key)) {
        New-Item -Path $item.key -Force | Out-Null
    }
    Set-ItemProperty -Path $item.key -Name $item.name -Value $item.value
}

Write-Output 'reverted'
