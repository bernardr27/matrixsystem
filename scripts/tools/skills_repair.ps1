param(
  [string]$RepoRoot = "",
  [string]$CodexSkillsDir = ""
)

$ErrorActionPreference = "Stop"

function Get-FrontmatterValue {
  param(
    [string]$SkillPath,
    [string]$FieldName
  )

  if (-not (Test-Path $SkillPath)) { return "" }
  $lines = Get-Content -Path $SkillPath -ErrorAction SilentlyContinue
  if ($lines.Count -lt 3) { return "" }
  if ($lines[0].Trim() -ne "---") { return "" }

  for ($i = 1; $i -lt $lines.Count; $i++) {
    $line = $lines[$i].Trim()
    if ($line -eq "---") { break }
    if ($line -match ("^{0}\s*:\s*(.+)$" -f [regex]::Escape($FieldName))) {
      return $matches[1].Trim("`"", "'", " ")
    }
  }

  return ""
}

function To-Title {
  param([string]$Text)
  if ([string]::IsNullOrWhiteSpace($Text)) { return "Skill" }
  return ($Text -split "[-_ ]+" | Where-Object { $_ -ne "" } | ForEach-Object {
      if ($_.Length -le 1) { $_.ToUpperInvariant() } else { $_.Substring(0, 1).ToUpperInvariant() + $_.Substring(1).ToLowerInvariant() }
    }) -join " "
}

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
} else {
  $RepoRoot = (Resolve-Path $RepoRoot).Path
}

if ([string]::IsNullOrWhiteSpace($CodexSkillsDir)) {
  if ($env:CODEX_HOME) {
    $CodexSkillsDir = Join-Path $env:CODEX_HOME "skills"
  } else {
    $CodexSkillsDir = Join-Path $env:USERPROFILE ".codex\skills"
  }
}

$excludeRegex = [regex]'(\\|/)(\.git|node_modules|\.next|\.turbo|dist|build)(\\|/)'
$skillFiles = Get-ChildItem -Path $RepoRoot -Recurse -File -Filter "SKILL.md" |
  Where-Object { -not $excludeRegex.IsMatch($_.FullName) }

$created = @()

foreach ($skillFile in $skillFiles) {
  $skillDir = $skillFile.Directory
  if (-not $skillDir) { continue }
  $skillName = $skillDir.Name
  if ([string]::IsNullOrWhiteSpace($skillName)) { continue }

  $agentsDir = Join-Path $skillDir.FullName "agents"
  $openaiYaml = Join-Path $agentsDir "openai.yaml"
  if (Test-Path $openaiYaml) { continue }

  New-Item -ItemType Directory -Path $agentsDir -Force | Out-Null
  $fmName = Get-FrontmatterValue -SkillPath $skillFile.FullName -FieldName "name"
  if ([string]::IsNullOrWhiteSpace($fmName)) { $fmName = $skillName }
  $fmDescription = Get-FrontmatterValue -SkillPath $skillFile.FullName -FieldName "description"
  if ([string]::IsNullOrWhiteSpace($fmDescription)) { $fmDescription = "Skill automation for $fmName." }
  $displayName = To-Title $fmName
  $shortDescription = $fmDescription
  if ($shortDescription.Length -gt 120) {
    $shortDescription = $shortDescription.Substring(0, 117).Trim() + "..."
  }

  @"
schema_version: v1
display_name: $displayName
short_description: $shortDescription
default_prompt: Use the $displayName skill for this task.
"@ | Set-Content -Path $openaiYaml

  $created += $skillDir.FullName
}

Write-Output ("[skills-repair] repo_root={0}" -f $RepoRoot)
Write-Output ("[skills-repair] codex_skills={0}" -f $CodexSkillsDir)
Write-Output ("[skills-repair] metadata_created={0}" -f $created.Count)
foreach ($path in $created) {
  Write-Output ("[skills-repair] + agents/openai.yaml <= {0}" -f $path)
}

# Always re-sync after repair to keep Codex skills current.
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "sync_codex_skills.ps1") -RepoRoot $RepoRoot -CodexSkillsDir $CodexSkillsDir -Force | Write-Output

