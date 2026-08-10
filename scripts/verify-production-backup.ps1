param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$BackupPath
)

$ErrorActionPreference = "Stop"
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$backupFile = [System.IO.Path]::GetFullPath($BackupPath)
$tempRoot = Join-Path $repoRoot (".cache\backup-restore-" + [guid]::NewGuid().ToString("N"))
$archivePath = Join-Path $tempRoot "backup.zip"
$extractPath = Join-Path $tempRoot "contents"
$databaseName = "language_tracker_restore_test"
$restoreDatabaseCreated = $false
$sourceConnectionsDisabled = $false

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

function Find-Docker {
  $command = Get-Command docker -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $candidates = @(
    "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin\docker.exe",
    "$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe"
  )

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  throw "Docker CLI was not found. Start Docker Desktop and try again."
}

function Invoke-PsqlFile(
  [string]$DockerPath,
  [string]$Container,
  [string]$Database,
  [string]$SqlPath,
  [string]$DatabaseUser = "postgres",
  [bool]$DisableTriggers = $false
) {
  $dockerArguments = @("exec")
  if ($DisableTriggers) {
    $dockerArguments += @("-e", "PGOPTIONS=-c session_replication_role=replica")
  }
  $dockerArguments += @(
    "-i", $Container, "psql", "-X", "-q", "-U", $DatabaseUser, "-d", $Database,
    "-v", "ON_ERROR_STOP=1"
  )

  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    Get-Content -LiteralPath $SqlPath -ReadCount 1000 |
      & $DockerPath @dockerArguments
    $exitCode = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $previousPreference
  }
  if ($exitCode -ne 0) {
    throw "Restore failed for $SqlPath with exit code $exitCode."
  }
}

if (-not (Test-Path -LiteralPath $backupFile)) {
  throw "Backup file does not exist: $backupFile"
}

$node = (Get-Command node -ErrorAction Stop).Source
$supabaseRunner = Join-Path $repoRoot "scripts\run-supabase.mjs"
$cryptoRunner = Join-Path $repoRoot "scripts\backup-crypto.mjs"
$docker = Find-Docker
$ownsPassphrase = [string]::IsNullOrEmpty($env:LANGUAGE_TRACKER_BACKUP_PASSPHRASE)

if ($ownsPassphrase) {
  $securePassphrase = Read-Host "Backup passphrase" -AsSecureString
  $env:LANGUAGE_TRACKER_BACKUP_PASSPHRASE = ConvertTo-PlainText $securePassphrase
}

New-Item -ItemType Directory -Path $extractPath -Force | Out-Null

try {
  Invoke-External $node @($cryptoRunner, "decrypt", $backupFile, $archivePath)
  Invoke-External "tar.exe" @("-xf", $archivePath, "-C", $extractPath)

  $manifestPath = Join-Path $extractPath "manifest.json"
  if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Backup manifest is missing."
  }

  $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
  foreach ($file in $manifest.files) {
    $path = Join-Path $extractPath $file.name
    if (-not (Test-Path -LiteralPath $path)) {
      throw "Backup member is missing: $($file.name)"
    }

    $actualHash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne $file.sha256) {
      throw "Checksum mismatch for $($file.name)."
    }
  }

  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $node $supabaseRunner status --output json *> $null
  $statusExitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousPreference
  if ($statusExitCode -ne 0) {
    Invoke-External $node @($supabaseRunner, "start")
  }

  $container = (& $docker ps --filter "name=supabase_db_language-tracker" --format "{{.Names}}" |
    Select-Object -First 1).Trim()
  if ([string]::IsNullOrEmpty($container)) {
    throw "The local Supabase database container is not running."
  }

  Invoke-External $docker @(
    "exec", $container, "psql", "-X", "-U", "supabase_admin", "-d", "template1",
    "-v", "ON_ERROR_STOP=1", "-c", "drop database if exists $databaseName with (force);"
  )

  Invoke-External $docker @(
    "exec", $container, "psql", "-X", "-U", "supabase_admin", "-d", "template1",
    "-v", "ON_ERROR_STOP=1", "-c", "alter database postgres with allow_connections false;"
  )
  $sourceConnectionsDisabled = $true
  Invoke-External $docker @(
    "exec", $container, "psql", "-X", "-U", "supabase_admin", "-d", "template1",
    "-v", "ON_ERROR_STOP=1", "-c",
    "select pg_terminate_backend(pid) from pg_stat_activity where datname = 'postgres';"
  )
  Invoke-External $docker @(
    "exec", $container, "psql", "-X", "-U", "supabase_admin", "-d", "template1",
    "-v", "ON_ERROR_STOP=1", "-c",
    "create database $databaseName with template postgres owner postgres;"
  )
  $restoreDatabaseCreated = $true
  Invoke-External $docker @(
    "exec", $container, "psql", "-X", "-U", "supabase_admin", "-d", "template1",
    "-v", "ON_ERROR_STOP=1", "-c", "alter database postgres with allow_connections true;"
  )
  $sourceConnectionsDisabled = $false

  Invoke-External $docker @(
    "exec", $container, "psql", "-X", "-U", "postgres", "-d", $databaseName,
    "-v", "ON_ERROR_STOP=1", "-c",
    "drop schema public cascade; create schema public authorization postgres;"
  )

  Invoke-PsqlFile $docker $container $databaseName (Join-Path $extractPath "schema.sql")

  $copyTargets = Select-String -Path (Join-Path $extractPath "data.sql") -Pattern '^COPY ' |
    ForEach-Object {
      if ($_.Line -match '^COPY\s+([^\s(]+)') {
        $matches[1]
      }
    } | Sort-Object -Unique
  if ($copyTargets.Count -eq 0) {
    throw "The data dump contains no COPY targets."
  }
  $truncateSql = "truncate table " + ($copyTargets -join ", ") + " restart identity cascade;"
  Invoke-External $docker @(
    "exec", $container, "psql", "-X", "-U", "supabase_admin", "-d", $databaseName,
    "-v", "ON_ERROR_STOP=1", "-c", $truncateSql
  )

  Invoke-PsqlFile `
    $docker `
    $container `
    $databaseName `
    (Join-Path $extractPath "data.sql") `
    "supabase_admin" `
    $true

  $verificationQuery = @"
select json_build_object(
  'auth_users', (select count(*) from auth.users),
  'profiles', (select count(*) from public.profiles),
  'language_boards', (select count(*) from public.language_boards),
  'activity_types', (select count(*) from public.activity_types),
  'study_entries', (select count(*) from public.study_entries),
  'vocabulary_daily_totals', (select count(*) from public.vocabulary_daily_totals),
  'cefr_level_events', (select count(*) from public.cefr_level_events)
);
"@
  Invoke-External $docker @(
    "exec", $container, "psql", "-X", "-U", "supabase_admin", "-d", $databaseName,
    "-v", "ON_ERROR_STOP=1", "-tAc", $verificationQuery
  )

  Write-Host "Backup checksums and isolated local database restore passed." -ForegroundColor Green
}
finally {
  if ($sourceConnectionsDisabled) {
    $ErrorActionPreference = "Continue"
    & $docker exec $container psql -X -U supabase_admin -d template1 -v ON_ERROR_STOP=1 `
      -c "alter database postgres with allow_connections true;" *> $null
    $ErrorActionPreference = "Stop"
  }
  if ($restoreDatabaseCreated) {
    $ErrorActionPreference = "Continue"
    & $docker exec $container psql -X -U supabase_admin -d template1 -v ON_ERROR_STOP=1 `
      -c "drop database if exists $databaseName with (force);" *> $null
    $ErrorActionPreference = "Stop"
  }
  if ($ownsPassphrase) {
    Remove-Item Env:\LANGUAGE_TRACKER_BACKUP_PASSPHRASE -ErrorAction SilentlyContinue
  }
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}
