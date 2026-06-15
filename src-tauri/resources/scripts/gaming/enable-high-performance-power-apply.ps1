$highPerf = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'
$ultimate = 'e9a42b02-d5df-448d-aa00-03fa14749eb6'
$duplicates = powercfg /duplicatescheme $ultimate 2>$null
if ($LASTEXITCODE -eq 0) {
    powercfg /setactive $ultimate | Out-Null
} else {
    powercfg /setactive $highPerf | Out-Null
}
Write-Output 'success'
