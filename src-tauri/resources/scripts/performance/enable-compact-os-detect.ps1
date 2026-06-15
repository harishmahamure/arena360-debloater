$out = compact /QueryOs 2>&1 | Out-String
if ($out -match 'is compacted|already compacted|Compact state for OS volume:.*1') {
    Write-Output 'applied'
} else {
    Write-Output 'not_applied'
}
