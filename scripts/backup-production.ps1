param(
  [string]$ProjectRef = "fbkwirzlvyaykrimpqhy",
  [string]$OutputDirectory = "backups"
)

$ErrorActionPreference = "Stop"
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$outputRoot = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $OutputDirectory))
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$tempRoot = Join-Path $repoRoot ".cache\production-backup-$timestamp"
$archivePath = Join-Path $tempRoot "backup.zip"
$encryptedPath = Join-Path $outputRoot "language-tracker-production-$timestamp.ltbak"
$checksumPath = "$encryptedPath.sha256"
$linked = $false
$completed = $false

function ConvertTo-PlainText([Security.SecureString]$SecureValue) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

function Invoke-External([string]$FilePath, [string[]]$Arguments) {
  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    & $FilePath @Arguments
    $exitCode = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $previousPreference
  }
  if ($exitCode -ne 0) {
    throw "Command failed with exit code $exitCode`: $FilePath $($Arguments -join ' ')"
  }
}

$node = (Get-Command node -ErrorAction Stop).Source
$supabaseRunner = Join-Path $repoRoot "scripts\run-supabase.mjs"
$cryptoRunner = Join-Path $repoRoot "scripts\backup-crypto.mjs"
$verifyScript = Join-Path $repoRoot "scripts\verify-production-backup.ps1"

$passphrase = $env:LANGUAGE_TRACKER_BACKUP_PASSPHRASE
if ([string]::IsNullOrEmpty($passphrase)) {
  $securePassphrase = Read-Host "Create a backup passphrase (minimum 16 characters)" -AsSecureString
  $secureConfirmation = Read-Host "Confirm the backup passphrase" -AsSecureString
  $passphrase = ConvertTo-PlainText $securePassphrase
  $confirmation = ConvertTo-PlainText $secureConfirmation

  if ($passphrase -cne $confirmation) {
    throw "Backup passphrases do not match."
  }
  $confirmation = $null
}

if ($passphrase.Length -lt 16) {
  throw "Backup passphrase must contain at least 16 characters."
}

$env:LANGUAGE_TRACKER_BACKUP_PASSPHRASE = $passphrase
$passphrase = $null
New-Item -ItemType Directory -Path $tempRoot, $outputRoot -Force | Out-Null

try {
  Invoke-External $node @($supabaseRunner, "link", "--project-ref", $ProjectRef)
  $linked = $true

  Invoke-External $node @(
    $supabaseRunner, "db", "dump", "--linked", "--role-only",
    "--file", (Join-Path $tempRoot "roles.sql")
  )
  Invoke-External $node @(
    $supabaseRunner, "db", "dump", "--linked",
    "--file", (Join-Path $tempRoot "schema.sql")
  )
  Invoke-External $node @(
    $supabaseRunner, "db", "dump", "--linked", "--data-only", "--use-copy",
    "--exclude", "storage.buckets_vectors", "--exclude", "storage.vector_indexes",
    "--file", (Join-Path $tempRoot "data.sql")
  )

  $files = @("roles.sql", "schema.sql", "data.sql") | ForEach-Object {
    $path = Join-Path $tempRoot $_
    [ordered]@{
      name = $_
      bytes = (Get-Item -LiteralPath $path).Length
      sha256 = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
    }
  }
  $manifest = [ordered]@{
    formatVersion = 1
    projectRef = $ProjectRef
    createdAtUtc = (Get-Date).ToUniversalTime().ToString("o")
    gitCommit = (& git -C $repoRoot rev-parse HEAD).Trim()
    files = $files
  }
  $manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $tempRoot "manifest.json") -Encoding UTF8

  Invoke-External "tar.exe" @("-a", "-cf", $archivePath, "-C", $tempRoot, "roles.sql", "schema.sql", "data.sql", "manifest.json")
  Invoke-External $node @($cryptoRunner, "encrypt", $archivePath, $encryptedPath)

  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & powershell -NoProfile -ExecutionPolicy Bypass -File $verifyScript -BackupPath $encryptedPath
  $verifyExitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousPreference
  if ($verifyExitCode -ne 0) {
    throw "The encrypted backup failed its restore rehearsal."
  }

  $encryptedHash = (Get-FileHash -LiteralPath $encryptedPath -Algorithm SHA256).Hash.ToLowerInvariant()
  "$encryptedHash  $([IO.Path]::GetFileName($encryptedPath))" |
    Set-Content -LiteralPath $checksumPath -Encoding ASCII

  Write-Host "Encrypted production backup created and restore-tested:" -ForegroundColor Green
  Write-Host $encryptedPath
  Write-Host $checksumPath
  $completed = $true
}
finally {
  if ($linked) {
    $ErrorActionPreference = "Continue"
    & $node $supabaseRunner unlink *> $null
    $ErrorActionPreference = "Stop"
  }
  Remove-Item Env:\LANGUAGE_TRACKER_BACKUP_PASSPHRASE -ErrorAction SilentlyContinue
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
  if (-not $completed) {
    Remove-Item -LiteralPath $encryptedPath, $checksumPath -Force -ErrorAction SilentlyContinue
  }
}
