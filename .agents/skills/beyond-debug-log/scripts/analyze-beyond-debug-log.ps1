param(
  [string]$ConfigPath = "gsts.config.ts",
  [string]$LogFile = "",
  [int]$Tail = 240,
  [switch]$All
)

$ErrorActionPreference = "Stop"

function Find-PlayerId {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Config file not found: $Path"
  }

  $config = Get-Content -Raw -LiteralPath $Path
  if ($config -notmatch "playerId\s*:\s*(\d+)") {
    throw "Could not find inject.playerId in $Path"
  }

  return $Matches[1]
}

function Get-LatestLogFile {
  param([string]$PlayerId)

  $logDir = Join-Path $env:USERPROFILE "AppData\LocalLow\miHoYo\原神\BeyondLocal\$PlayerId\Beyond_Debug_Log"
  if (-not (Test-Path -LiteralPath $logDir)) {
    throw "Debug log directory not found: $logDir"
  }

  $file = Get-ChildItem -LiteralPath $logDir -Filter "*.gia" -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (-not $file) {
    throw "No .gia debug logs found in: $logDir"
  }

  return $file
}

function Read-PrintableStrings {
  param([string]$Path)

  $bytes = [System.IO.File]::ReadAllBytes($Path)
  $text = [System.Text.Encoding]::UTF8.GetString($bytes)
  return [regex]::Matches($text, "[\x20-\x7E\u4e00-\u9fff]{1,120}") |
    ForEach-Object { $_.Value.Trim() } |
    Where-Object { $_.Length -gt 0 }
}

function Is-Noise {
  param([string]$Text)

  return (
    $Text -match "^\d{4}/\d{2}/\d{2}_" -or
    $Text -match "^日志_" -or
    $Text -match "^玩家_" -or
    $Text -eq "打印" -or
    $Text -eq "关于开始"
  )
}

$playerId = ""
$selectedLog = $null

if ($LogFile) {
  $selectedLog = Get-Item -LiteralPath $LogFile
  $playerId = if ($selectedLog.Name -match "_(\d+)\.gia$") { $Matches[1] } else { "(explicit log file)" }
} else {
  $playerId = Find-PlayerId -Path $ConfigPath
  $selectedLog = Get-LatestLogFile -PlayerId $playerId
}

$strings = @(Read-PrintableStrings -Path $selectedLog.FullName)
$events = New-Object System.Collections.Generic.List[string]
$lastMarker = ""

foreach ($s in $strings) {
  if (Is-Noise -Text $s) {
    continue
  }

  if ($s -match "^(PROBE_|CHARGE_)") {
    $events.Add($s)
    $lastMarker = $s
    continue
  }

  if ($s -match "^-?\d+(\.\d+)?$") {
    if ($All -or $lastMarker -match "^(PROBE_LEFT_CHECK|PROBE_OUT_FIRST|CHARGE_STOP_SELF)$") {
      $events.Add("$lastMarker -> $s")
    }
    continue
  }

  if ($All -and ($s -match "^[\u4e00-\u9fffA-Za-z0-9_ -]{1,40}$")) {
    $events.Add($s)
  }
}

if (-not $All -and $Tail -gt 0 -and $events.Count -gt $Tail) {
  $events = [System.Collections.Generic.List[string]]@($events | Select-Object -Last $Tail)
}

Write-Output "playerId: $playerId"
Write-Output "logFile: $($selectedLog.FullName)"
Write-Output "lastWriteTime: $($selectedLog.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))"
Write-Output "events:"

$i = 1
foreach ($event in $events) {
  Write-Output ("{0,4}. {1}" -f $i, $event)
  $i++
}
