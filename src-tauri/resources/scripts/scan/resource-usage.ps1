param(
    [int]$SampleSecs = 5,
    [double]$MinCpu = 0.5,
    [double]$MinRamMb = 50,
    [double]$MinGpu = 1.0,
    [double]$MinDiskMbps = 0.5,
    [int]$MinNetworkConnections = 5
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

function Get-GpuByProcessId {
    $gpuMap = @{}
    try {
        $counters = Get-Counter '\GPU Engine(*)\Utilization Percentage' -ErrorAction Stop
        foreach ($sample in $counters.CounterSamples) {
            $instance = $sample.InstanceName
            if ($instance -notmatch 'pid_(\d+)') { continue }

            $procId = [int]$Matches[1]
            $val = [double]$sample.CookedValue
            if ($val -le 0) { continue }

            $engine = 'Other'
            if ($instance -match 'engtype_([^_]+)') {
                $engine = $Matches[1]
            }

            if (-not $gpuMap.ContainsKey($procId)) {
                $gpuMap[$procId] = @{
                    total = 0.0
                    copy = 0.0
                    d3 = 0.0
                    video = 0.0
                    topEngine = 'Other'
                }
            }

            $entry = $gpuMap[$procId]
            switch -Regex ($engine) {
                '^Copy$' {
                    if ($val -gt $entry.copy) { $entry.copy = $val }
                }
                '^3D$' {
                    if ($val -gt $entry.d3) { $entry.d3 = $val }
                }
                '^(VideoDecode|VideoEncode|Video)$' {
                    if ($val -gt $entry.video) { $entry.video = $val }
                }
            }

            if ($val -gt $entry.total) {
                $entry.total = $val
                $entry.topEngine = $engine
            }
        }
    } catch {}
    return $gpuMap
}

function Get-DiskIoByProcessId {
    $readMap = @{}
    $writeMap = @{}
    try {
        foreach ($counterPath in @('\Process(*)\IO Read Bytes/sec', '\Process(*)\IO Write Bytes/sec')) {
            $counters = Get-Counter $counterPath -ErrorAction Stop
            $isRead = $counterPath -like '*Read*'
            foreach ($sample in $counters.CounterSamples) {
                if ($sample.InstanceName -notmatch '_(\d+)$') { continue }
                $procId = [int]$Matches[1]
                $mbps = [double]$sample.CookedValue / 1MB
                if ($isRead) {
                    $readMap[$procId] = $mbps
                } else {
                    $writeMap[$procId] = $mbps
                }
            }
        }
    } catch {}

    $map = @{}
    foreach ($procId in @($readMap.Keys + $writeMap.Keys | Select-Object -Unique)) {
        $read = if ($readMap.ContainsKey($procId)) { $readMap[$procId] } else { 0.0 }
        $write = if ($writeMap.ContainsKey($procId)) { $writeMap[$procId] } else { 0.0 }
        $map[$procId] = @{
            readMbps = $read
            writeMbps = $write
            totalMbps = $read + $write
        }
    }
    return $map
}

function Get-NetworkConnectionsByProcessId {
    $map = @{}
    foreach ($conn in Get-NetTCPConnection -State Established -ErrorAction SilentlyContinue) {
        $procId = [int]$conn.OwningProcess
        if ($procId -le 0) { continue }
        if (-not $map.ContainsKey($procId)) { $map[$procId] = 0 }
        $map[$procId]++
    }
    foreach ($udp in Get-NetUDPEndpoint -ErrorAction SilentlyContinue) {
        $procId = [int]$udp.OwningProcess
        if ($procId -le 0) { continue }
        if (-not $map.ContainsKey($procId)) { $map[$procId] = 0 }
        $map[$procId]++
    }
    return $map
}

function Get-ServiceMap {
    $map = @{}
    $services = Get-CimInstance Win32_Service | Where-Object { $_.State -eq 'Running' }
    foreach ($svc in $services) {
        $map[$svc.ProcessId] = @($map[$svc.ProcessId]) + @($svc.Name)
    }
    return $map
}

function Get-AppxPackageLookup {
    $lookup = @()
    try {
        foreach ($pkg in Get-AppxPackage) {
            if ($pkg.InstallLocation) {
                $lookup += [ordered]@{
                    Location = $pkg.InstallLocation.TrimEnd('\')
                    Name = $pkg.Name
                }
            }
        }
        $lookup = $lookup | Sort-Object { $_.Location.Length } -Descending
    } catch {}
    return $lookup
}

function Resolve-AppxPackageName($procPath, $lookup) {
    if (-not $procPath) { return $null }
    foreach ($item in $lookup) {
        if ($procPath.StartsWith($item.Location, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $item.Name
        }
    }
    return $null
}

$before = Get-ProcessSnapshot
Start-Sleep -Seconds $SampleSecs
$after = Get-ProcessSnapshot
$serviceMap = Get-ServiceMap
$gpuMap = Get-GpuByProcessId
$diskMap = Get-DiskIoByProcessId
$networkMap = Get-NetworkConnectionsByProcessId
$appxLookup = Get-AppxPackageLookup

$entries = @()
foreach ($procId in $after.Keys) {
    $a = $after[$procId]
    $b = $before[$procId]
    $cpuDelta = 0.0
    if ($b) { $cpuDelta = [math]::Max(0, ($a.Cpu - $b.Cpu) / $SampleSecs * 100 / [Environment]::ProcessorCount) }
    $ramMb = $a.Ram
    $procName = $a.Name

    $gpu = 0.0
    $gpuCopy = 0.0
    $gpu3d = 0.0
    $gpuVideo = 0.0
    $gpuTopEngine = $null
    if ($gpuMap.ContainsKey($procId)) {
        $g = $gpuMap[$procId]
        $gpu = $g.total
        $gpuCopy = $g.copy
        $gpu3d = $g.d3
        $gpuVideo = $g.video
        $gpuTopEngine = $g.topEngine
    }

    $diskMbps = 0.0
    $diskReadMbps = 0.0
    $diskWriteMbps = 0.0
    if ($diskMap.ContainsKey($procId)) {
        $d = $diskMap[$procId]
        $diskMbps = $d.totalMbps
        $diskReadMbps = $d.readMbps
        $diskWriteMbps = $d.writeMbps
    }

    $networkConnections = 0
    if ($networkMap.ContainsKey($procId)) { $networkConnections = $networkMap[$procId] }

    if ($cpuDelta -lt $MinCpu -and $ramMb -lt $MinRamMb -and $gpu -lt $MinGpu -and
        $diskMbps -lt $MinDiskMbps -and $networkConnections -lt $MinNetworkConnections) { continue }

    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    $path = $null
    if ($proc) { $path = $proc.Path }
    $pkg = Resolve-AppxPackageName $path $appxLookup
    $svcNames = @()
    if ($serviceMap.ContainsKey($procId)) { $svcNames = $serviceMap[$procId] }

    $entryType = 'app'
    if ($svcNames.Count -gt 0 -and $procName -eq 'svchost') { $entryType = 'service' }
    elseif ($svcNames.Count -gt 0) { $entryType = 'mixed' }

    $id = "proc:$procId"
    if ($svcNames.Count -gt 0) { $id += '|svc:' + ($svcNames -join ',') }
    if ($pkg) { $id += "|pkg:$pkg" }

    $displayName = if ($pkg) { $pkg } elseif ($svcNames.Count -gt 0) { $svcNames[0] } else { $procName }

    $entries += [ordered]@{
        id = $id
        displayName = $displayName
        entryType = $entryType
        processName = $procName
        processId = $procId
        serviceNames = $svcNames
        packageName = $pkg
        publisher = ''
        cpuPercent = [math]::Round($cpuDelta, 2)
        ramMb = [math]::Round($ramMb, 2)
        gpuPercent = [math]::Round($gpu, 2)
        gpuCopyPercent = [math]::Round($gpuCopy, 2)
        gpu3dPercent = [math]::Round($gpu3d, 2)
        gpuVideoPercent = [math]::Round($gpuVideo, 2)
        gpuTopEngine = $gpuTopEngine
        diskMbps = [math]::Round($diskMbps, 2)
        diskReadMbps = [math]::Round($diskReadMbps, 2)
        diskWriteMbps = [math]::Round($diskWriteMbps, 2)
        networkConnections = $networkConnections
        canStop = $true
        canUninstall = [bool]$pkg
        isProtected = $false
        risk = 'safe'
        warning = $null
    }
}

$entries = $entries | Sort-Object {
    ($_.cpuPercent * 2) + ($_.ramMb / 100) + $_.gpuPercent + ($_.diskMbps * 10) + ($_.networkConnections / 5)
} -Descending

[ordered]@{
    entries = @($entries)
    scannedAt = (Get-Date).ToUniversalTime().ToString('o')
    sampleSecs = $SampleSecs
} | ConvertTo-Json -Depth 6 -Compress
