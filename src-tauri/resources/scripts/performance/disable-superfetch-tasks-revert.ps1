$tasks = @(
    '\Microsoft\Windows\SysMain\HybridDriveCachePrepopulate',
    '\Microsoft\Windows\SysMain\ResPriStaticDbSync',
    '\Microsoft\Windows\SysMain\WsSwapAssessmentTask'
)
foreach ($path in $tasks) {
    $parts = $path -split '\\'
    $name = $parts[-1]
    $taskPath = ($parts[0..($parts.Length - 2)] -join '\') + '\'
    Enable-ScheduledTask -TaskPath $taskPath -TaskName $name -ErrorAction SilentlyContinue | Out-Null
}
Write-Output 'success'
