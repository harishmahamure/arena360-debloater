$ErrorActionPreference = 'SilentlyContinue'

$frameworkPatterns = @(
    'Microsoft.VCLibs',
    'Microsoft.UI.Xaml',
    'Microsoft.NET.',
    'Microsoft.WindowsAppRuntime',
    'Windows.WebView2',
    'Microsoft.LanguageExperience',
    'Microsoft.AsyncTextService'
)

$bloatPublishers = @('McAfee', 'Dell', 'HP Inc', 'Lenovo', 'CyberLink', 'WildTangent')
$bloatPackagePatterns = @(
    'Microsoft.Xbox', 'Microsoft.GamingApp', 'Clipchamp', 'Solitaire',
    'BingNews', 'BingWeather', 'GetHelp', 'YourPhone', 'Teams', 'Copilot'
)

function Test-FrameworkPackage($name) {
    foreach ($p in $frameworkPatterns) {
        if ($name -like "$p*") { return $true }
    }
    return $false
}

function Test-SystemAppxPackage($pkg) {
    if (-not $pkg) { return $false }
    if ($pkg.InstallLocation -and $pkg.InstallLocation -match '(?i)\\Windows\\SystemApps\\') { return $true }
    if ($pkg.IsFramework) { return $true }
    if ($pkg.SignatureKind -eq 'System') { return $true }
    return $false
}

function Test-BloatApp($name, $publisher) {
    foreach ($p in $bloatPackagePatterns) {
        if ($name -like "*$p*") { return $true }
    }
    foreach ($p in $bloatPublishers) {
        if ($publisher -like "*$p*") { return $true }
    }
    return $false
}

function Get-FolderSizeMb($path) {
    if (-not $path -or -not (Test-Path $path)) { return 0 }
    try {
        $bytes = (Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        return [math]::Round($bytes / 1MB, 2)
    } catch { return 0 }
}

$apps = @{}
$seen = @{}

# Appx packages
try {
    $appxList = Get-AppxPackage -AllUsers -ErrorAction SilentlyContinue
    if (-not $appxList) { $appxList = Get-AppxPackage -ErrorAction SilentlyContinue }
    foreach ($pkg in $appxList) {
        if (Test-FrameworkPackage $pkg.Name) { continue }
        $isSystem = Test-SystemAppxPackage $pkg
        $id = "appx:$($pkg.Name)|pkg:$($pkg.Name)"
        if ($seen.ContainsKey($id)) { continue }
        $seen[$id] = $true
        $publisher = ($pkg.Publisher -replace '^CN=', '') -replace '"', ''
        $apps[$id] = [ordered]@{
            id = $id
            displayName = if ($pkg.Name) { $pkg.Name } else { $pkg.PackageFullName }
            publisher = $publisher
            appType = 'appx'
            packageName = $pkg.Name
            uninstallKey = $null
            sizeMb = Get-FolderSizeMb $pkg.InstallLocation
            canUninstall = -not $isSystem
            isProtected = $isSystem
            isBloat = (-not $isSystem) -and (Test-BloatApp $pkg.Name $publisher)
            risk = if ($isSystem) { 'advanced' } else { 'safe' }
            warning = if ($isSystem) { 'Part of Windows — cannot be uninstalled' } else { $null }
        }
    }
} catch {}

# Win32 registry uninstall keys
$roots = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
)

foreach ($root in $roots) {
    $items = Get-ItemProperty $root -ErrorAction SilentlyContinue
    foreach ($item in $items) {
        $name = $item.DisplayName
        if (-not $name) { continue }
        if ($item.SystemComponent -eq 1) { continue }
        if (-not $item.UninstallString) { continue }
        $key = $item.PSPath
        $id = "win32:$($item.PSChildName)|key:$key"
        if ($seen.ContainsKey($id)) { continue }
        $seen[$id] = $true
        $publisher = if ($item.Publisher) { $item.Publisher } else { '' }
        $sizeMb = if ($item.EstimatedSize) { [math]::Round($item.EstimatedSize / 1024, 2) } else { 0 }
        $apps[$id] = [ordered]@{
            id = $id
            displayName = $name
            publisher = $publisher
            appType = 'win32'
            packageName = $null
            uninstallKey = $key
            sizeMb = $sizeMb
            canUninstall = $true
            isProtected = $false
            isBloat = (Test-BloatApp $name $publisher)
            risk = 'safe'
            warning = $null
        }
    }
}

$list = $apps.Values | Sort-Object displayName

[ordered]@{
    apps = @($list)
    scannedAt = (Get-Date).ToUniversalTime().ToString('o')
    totalCount = $list.Count
    bloatCount = @($list | Where-Object { $_.isBloat }).Count
} | ConvertTo-Json -Depth 6 -Compress
