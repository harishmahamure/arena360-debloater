param([string]$EntryJson)

$ErrorActionPreference = 'Stop'
$entry = $EntryJson | ConvertFrom-Json

if ($entry.packageName) {
    Get-AppxPackage -Name $entry.packageName -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
    Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like "*$($entry.packageName)*" | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue
    Write-Output "uninstalled_appx:$($entry.packageName)"
    exit 0
}

$uninstallRoots = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
)

foreach ($root in $uninstallRoots) {
    $keys = Get-ItemProperty $root -ErrorAction SilentlyContinue
    foreach ($key in $keys) {
        $displayName = $key.DisplayName
        $uninstall = $key.UninstallString
        if (-not $uninstall) { continue }
        if ($displayName -eq $entry.displayName -or $displayName -eq $entry.processName) {
            if ($uninstall -match 'msiexec') {
                Start-Process 'msiexec.exe' -ArgumentList '/x', ($key.PSChildName), '/qn', '/norestart' -Wait -NoNewWindow
            } else {
                Start-Process cmd.exe -ArgumentList '/c', $uninstall -Wait -NoNewWindow
            }
            Write-Output "uninstalled_win32:$displayName"
            exit 0
        }
    }
}

Write-Output 'no_uninstaller_found'
exit 1
