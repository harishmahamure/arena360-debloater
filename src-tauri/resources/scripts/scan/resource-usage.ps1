param(
    [int]$SampleSecs = 5,
    [double]$MinCpu = 0.5,
    [double]$MinRamMb = 50,
    [double]$MinGpu = 1.0
)

$ErrorActionPreference = 'SilentlyContinue'

function Get-ProcessSnapshot {
    $procs = Get-Process | Where-Object { $_.Id -gt 4 }
    $map = @{}
    foreach ($p in $procs) {
        $map[$p.Id] = [ordered]@{
            Name = $p.ProcessName
            Cpu = [double]$p.CPU
            Ram = [double]($p.WorkingSet64 / 1MB)
        }
    }
    return $map
}

function Get-GpuByProcessName {
    $gpuMap = @{}
    try {
        $counters = Get-Counter '\GPU Engine(*)\Utilization Percentage' -ErrorAction Stop
        foreach ($sample in $counters.CounterSamples) {
            if ($sample.InstanceName -match 'pid_(\d+)') { continue }
            if ($sample.InstanceName -match '([^_]+)_') {
                $procName = $Matches[1]
                $val = [double]$sample.CookedValue
                if (-not $gpuMap.ContainsKey($procName) -or $gpuMap[$procName] -lt $val) {
                    $gpuMap[$procName] = $val
                }
            }
        }
    } catch {}
    return $gpuMap
}

function Get-ServiceMap {
    $map = @{}
    $services = Get-CimInstance Win32_Service | Where-Object { $_.State -eq 'Running' }
    foreach ($svc in $services) {
        $map[$svc.ProcessId] = @($map[$svc.ProcessId]) + @($svc.Name)
    }
    return $map
}

function Get-Publisher($path) {
    if (-not $path -or -not (Test-Path $path)) { return '' }
    try {
        $sig = Get-AuthenticodeSignature -FilePath $path
        if ($sig.SignerCertificate) { return $sig.SignerCertificate.Subject.Split(',')[0].TrimStart('CN=') }
    } catch {}
    return ''
}

function Get-AppxPackageName($procPath) {
    if (-not $procPath) { return $null }
    try {
        $pkg = Get-AppxPackage | Where-Object {
            $_.InstallLocation -and $procPath.StartsWith($_.InstallLocation, [System.StringComparison]::OrdinalIgnoreCase)
        } | Select-Object -First 1
        if ($pkg) { return $pkg.Name }
    } catch {}
    return $null
}

$before = Get-ProcessSnapshot
Start-Sleep -Seconds $SampleSecs
$after = Get-ProcessSnapshot
$serviceMap = Get-ServiceMap
$gpuMap = Get-GpuByProcessName

$entries = @()
foreach ($pid in $after.Keys) {
    $a = $after[$pid]
    $b = $before[$pid]
    $cpuDelta = 0.0
    if ($b) { $cpuDelta = [math]::Max(0, ($a.Cpu - $b.Cpu) / $SampleSecs * 100 / [Environment]::ProcessorCount) }
    $ramMb = $a.Ram
    $procName = $a.Name
    $gpu = 0.0
    if ($gpuMap.ContainsKey($procName)) { $gpu = $gpuMap[$procName] }

    if ($cpuDelta -lt $MinCpu -and $ramMb -lt $MinRamMb -and $gpu -lt $MinGpu) { continue }

    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    $path = $null
    if ($proc) { $path = $proc.Path }
    $publisher = Get-Publisher $path
    $pkg = Get-AppxPackageName $path
    $svcNames = @()
    if ($serviceMap.ContainsKey($pid)) { $svcNames = $serviceMap[$pid] }

    $entryType = 'app'
    if ($svcNames.Count -gt 0 -and $procName -eq 'svchost') { $entryType = 'service' }
    elseif ($svcNames.Count -gt 0) { $entryType = 'mixed' }

    $id = "proc:$pid"
    if ($svcNames.Count -gt 0) { $id += '|svc:' + ($svcNames -join ',') }
    if ($pkg) { $id += "|pkg:$pkg" }

    $displayName = if ($pkg) { $pkg } elseif ($svcNames.Count -gt 0) { $svcNames[0] } else { $procName }

    $entries += [ordered]@{
        id = $id
        displayName = $displayName
        entryType = $entryType
        processName = $procName
        processId = $pid
        serviceNames = $svcNames
        packageName = $pkg
        publisher = $publisher
        cpuPercent = [math]::Round($cpuDelta, 2)
        ramMb = [math]::Round($ramMb, 2)
        gpuPercent = [math]::Round($gpu, 2)
        canStop = $true
        canUninstall = [bool]$pkg
        isProtected = $false
        risk = 'safe'
        warning = $null
    }
}

$entries = $entries | Sort-Object { ($_.cpuPercent * 2) + ($_.ramMb / 100) + $_.gpuPercent } -Descending

[ordered]@{
    entries = $entries
    scannedAt = (Get-Date).ToUniversalTime().ToString('o')
    sampleSecs = $SampleSecs
} | ConvertTo-Json -Depth 6 -Compress
