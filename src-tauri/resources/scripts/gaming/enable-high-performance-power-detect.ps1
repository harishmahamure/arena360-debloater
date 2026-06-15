$highPerf = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'
$ultimate = 'e9a42b02-d5df-448d-aa00-03fa14749eb6'
$active = (powercfg /getactivescheme) -match '([0-9a-f-]{36})'
$guid = if ($Matches) { $Matches[1] } else { '' }
if ($guid -eq $highPerf -or $guid -eq $ultimate) {
    Write-Output 'applied'
} else {
    Write-Output 'not_applied'
}
