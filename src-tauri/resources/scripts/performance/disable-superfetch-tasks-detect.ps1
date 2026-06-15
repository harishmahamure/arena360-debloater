$tasks = @(
    '\Microsoft\Windows\SysMain\HybridDriveCachePrepopulate',
    '\Microsoft\Windows\SysMain\ResPriStaticDbSync',
    '\Microsoft\Windows\SysMain\WsSwapAssessmentTask'
)
$allDisabled = $true
foreach ($path in $tasks) {
    $parts = $path -split '\\'
    $name = $parts[-1]
    $taskPath = ($parts[0..($parts.Length - 2)] -join '\') + '\'
    $t = Get-ScheduledTask -TaskPath $taskPath -TaskName $name -ErrorAction SilentlyContinue
    if ($t -and $t.State -ne 'Disabled') { $allDisabled = $false; break }
}
if ($allDisabled) { Write-Output 'applied' } else { Write-Output 'not_applied' }
