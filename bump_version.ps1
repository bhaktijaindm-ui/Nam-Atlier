$dir = 'c:\Users\Bhakti Jain\Documents\Nam atlier'
$files = Get-ChildItem -Path $dir -Filter '*.html' -Recurse
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'v=4\.2') {
        $updated = $content -replace 'v=4\.2', 'v=4.3'
        Set-Content $file.FullName $updated -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}
Write-Host "Done!"
