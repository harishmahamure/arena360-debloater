function Test-SystemAppxPackage {
    param($Package)

    if (-not $Package) { return $false }
    if ($Package.InstallLocation -and $Package.InstallLocation -match '(?i)\\Windows\\SystemApps\\') {
        return $true
    }
    if ($Package.IsFramework) { return $true }
    if ($Package.SignatureKind -eq 'System') { return $true }
    return $false
}

function Remove-SafeAppxPackage {
    param(
        [string]$PackageName,
        [switch]$AllUsers
    )

    $packages = @()
    if ($AllUsers) {
        $packages = @(Get-AppxPackage -Name $PackageName -AllUsers -ErrorAction SilentlyContinue)
    }
    if ($packages.Count -eq 0) {
        $packages = @(Get-AppxPackage -Name $PackageName -ErrorAction SilentlyContinue)
    }
    if ($packages.Count -eq 0) {
        return @{ status = 'not_installed'; removed = $true }
    }

    foreach ($pkg in $packages) {
        if (Test-SystemAppxPackage $pkg) {
            return @{ status = 'system_app_cannot_remove'; removed = $false }
        }
    }

    $removedAny = $false
    foreach ($pkg in $packages) {
        try {
            if ($AllUsers) {
                Remove-AppxPackage -Package $pkg.PackageFullName -AllUsers -ErrorAction Stop
            } else {
                Remove-AppxPackage -Package $pkg.PackageFullName -ErrorAction Stop
            }
            $removedAny = $true
        } catch {
            if ($_.Exception.HResult -eq -2147024891 -or $_.Exception.Message -match '80070032|part of Windows|cannot be uninstalled') {
                return @{ status = 'system_app_cannot_remove'; removed = $false }
            }
        }
    }

    Get-AppxProvisionedPackage -Online |
        Where-Object DisplayName -like "*$PackageName*" |
        ForEach-Object {
            try {
                Remove-AppxProvisionedPackage -Online -PackageName $_.PackageName -ErrorAction Stop
                $removedAny = $true
            } catch {}
        }

    $stillInstalled = Get-AppxPackage -Name $PackageName -ErrorAction SilentlyContinue
    if ($stillInstalled) {
        if (Test-SystemAppxPackage $stillInstalled) {
            return @{ status = 'system_app_cannot_remove'; removed = $false }
        }
        return @{ status = 'remove_failed'; removed = $false }
    }

    if ($removedAny) {
        return @{ status = 'removed'; removed = $true }
    }

    return @{ status = 'not_installed'; removed = $true }
}
