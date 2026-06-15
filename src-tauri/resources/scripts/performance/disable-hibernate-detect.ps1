$out = powercfg /a 2>&1 | Out-String
if ($out -match 'Hibernate' -and $out -notmatch 'Hibernate has not been enabled') {
    Write-Output 'not_applied'
} else {
    Write-Output 'applied'
}
