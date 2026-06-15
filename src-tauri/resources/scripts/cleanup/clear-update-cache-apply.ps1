Stop-Service wuauserv -Force -ErrorAction SilentlyContinue
Remove-Item C:\Windows\SoftwareDistribution\Download\* -Recurse -Force -ErrorAction SilentlyContinue
Start-Service wuauserv -ErrorAction SilentlyContinue
Write-Output 'success'
