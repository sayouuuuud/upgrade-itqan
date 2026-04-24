$adminDir = "app\api\academy\admin"
$files = Get-ChildItem -Path $adminDir -Recurse -Filter "route.ts"

$fixedCount = 0
foreach ($file in $files) {
    [string]$content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $original = $content

    # Replace requireRole check to accept both admin and academy_admin
    $newContent = $content.Replace(
        "requireRole(session, ['academy_admin'])",
        "requireRole(session, ['academy_admin', 'admin'])"
    )

    if ($newContent -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
        Write-Host "FIXED: $($file.FullName)"
        $fixedCount++
    }
}

Write-Host ""
Write-Host "Fixed $fixedCount files."
