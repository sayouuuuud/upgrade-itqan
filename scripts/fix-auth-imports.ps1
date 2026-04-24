$adminDir = "app\api\academy\admin"
$files = Get-ChildItem -Path $adminDir -Recurse -Filter "route.ts" | Where-Object { (Get-Content $_.FullName -Raw) -match "jwtDecode" }

Write-Host "Found $($files.Count) files to fix`n"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $original = $content

    # Pattern 1: verbose version (multi-line try/catch)
    $pattern1 = "import \{ requireRole, JWTPayload \} from '@/lib/auth'\r?\nimport \{ cookies \} from 'next/headers'\r?\nimport \{ jwtDecode \} from 'jwt-decode'\r?\n\r?\nasync function getSession\(\): Promise<JWTPayload \| null> \{\r?\n  const cookieStore = await cookies\(\)\r?\n  const sessionCookie = cookieStore\.get\('session'\)\?\.value\r?\n  if \(!sessionCookie\) return null\r?\n  try \{\r?\n    return jwtDecode<JWTPayload>\(sessionCookie\)\r?\n  \} catch \{\r?\n    return null\r?\n  \}\r?\n\}"

    # Pattern 2: compact version (single-line try/catch)
    $pattern2 = "import \{ requireRole, JWTPayload \} from '@/lib/auth'\r?\nimport \{ cookies \} from 'next/headers'\r?\nimport \{ jwtDecode \} from 'jwt-decode'\r?\n\r?\nasync function getSession\(\): Promise<JWTPayload \| null> \{\r?\n  const cookieStore = await cookies\(\)\r?\n  const sessionCookie = cookieStore\.get\('session'\)\?\.value\r?\n  if \(!sessionCookie\) return null\r?\n  try \{ return jwtDecode<JWTPayload>\(sessionCookie\) \} catch \{ return null \}\r?\n\}"

    $replacement = "import { getSession, requireRole } from '@/lib/auth'"

    $newContent = $content -replace $pattern1, $replacement
    $newContent = $newContent -replace $pattern2, $replacement

    if ($newContent -ne $original) {
        # Clean up extra blank lines that might be left
        $newContent = $newContent -replace "\r?\n\r?\n\r?\n", "`r`n`r`n"
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
        Write-Host "FIXED: $($file.FullName)"
    } else {
        Write-Host "SKIP (pattern not matched): $($file.FullName)"
    }
}

Write-Host "`nVerifying remaining jwtDecode usages..."
$remaining = Get-ChildItem -Path $adminDir -Recurse -Filter "route.ts" | Where-Object { (Get-Content $_.FullName -Raw) -match "jwtDecode" }
if ($remaining.Count -eq 0) {
    Write-Host "SUCCESS: No more jwtDecode found in admin routes!" -ForegroundColor Green
} else {
    Write-Host "WARNING: Still found jwtDecode in $($remaining.Count) files:" -ForegroundColor Yellow
    foreach ($f in $remaining) { Write-Host "  $($f.FullName)" }
}
