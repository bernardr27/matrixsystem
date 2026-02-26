param(
  [string]$RepoRoot = "",
  [string]$CodexSkillsDir = "",
  [switch]$Force,
  [switch]$DryRun,
  [bool]$EnsureAgentMetadata = $true
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

function Get-SkillSourcePriority {
  param([string]$PathValue)
  $p = $PathValue.ToLowerInvariant()
  if ($p -like "*\.agent\skills\*") { return 300 }
  if ($p -like "*\quarantine\ralph\skills\*") { return 200 }
  return 100
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

if (-not $DryRun) {
  New-Item -ItemType Directory -Path $CodexSkillsDir -Force | Out-Null
}

$excludeRegex = [regex]'(\\|/)(\.git|node_modules|\.next|\.turbo|dist|build)(\\|/)'
$skillFiles = Get-ChildItem -Path $RepoRoot -Recurse -File -Filter "SKILL.md" |
  Where-Object { -not $excludeRegex.IsMatch($_.FullName) }

$skillCandidates = @()
foreach ($skillFile in $skillFiles) {
  $skillDir = $skillFile.Directory
  if (-not $skillDir) { continue }
  $skillName = $skillDir.Name
  if ([string]::IsNullOrWhiteSpace($skillName)) { continue }
  $skillCandidates += [pscustomobject]@{
    skillFile = $skillFile
    skillDir = $skillDir
    skillName = $skillName
    priority = Get-SkillSourcePriority -PathValue $skillDir.FullName
  }
}

$skillEntries = $skillCandidates |
  Group-Object -Property skillName |
  ForEach-Object {
    $_.Group |
      Sort-Object -Property @{ Expression = "priority"; Descending = $true }, @{ Expression = { $_.skillDir.FullName.Length }; Descending = $false } |
      Select-Object -First 1
  }

$installed = @()
$skipped = @()
$metadataCreated = @()
$planned = @()

foreach ($entry in $skillEntries) {
  $skillDir = $entry.skillDir
  $skillName = $entry.skillName

  $targetDir = Join-Path $CodexSkillsDir $skillName
  $exists = Test-Path $targetDir
  $willCopy = (-not $exists) -or $Force
  $planned += [pscustomobject]@{ name = $skillName; source = $skillDir.FullName; target = $targetDir; copy = $willCopy }

  if (-not $willCopy) {
    $skipped += $skillName
    continue
  }

  if ($DryRun) {
    continue
  }

  New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
  Copy-Item -Path (Join-Path $skillDir.FullName "*") -Destination $targetDir -Recurse -Force

  if ($EnsureAgentMetadata) {
    $agentsDir = Join-Path $targetDir "agents"
    $openaiYaml = Join-Path $agentsDir "openai.yaml"
    if (-not (Test-Path $openaiYaml)) {
      New-Item -ItemType Directory -Path $agentsDir -Force | Out-Null
      $fmName = Get-FrontmatterValue -SkillPath (Join-Path $targetDir "SKILL.md") -FieldName "name"
      if ([string]::IsNullOrWhiteSpace($fmName)) { $fmName = $skillName }
      $fmDescription = Get-FrontmatterValue -SkillPath (Join-Path $targetDir "SKILL.md") -FieldName "description"
      if ([string]::IsNullOrWhiteSpace($fmDescription)) { $fmDescription = "Skill automation for $fmName." }
      $displayName = To-Title $fmName
      $shortDescription = $fmDescription
      if ($shortDescription.Length -gt 120) {
        $shortDescription = $shortDescription.Substring(0, 117).Trim() + "..."
      }
      $defaultPrompt = "Use the $displayName skill for this task."
      @"
schema_version: v1
display_name: $displayName
short_description: $shortDescription
default_prompt: $defaultPrompt
"@ | Set-Content -Path $openaiYaml
      $metadataCreated += $skillName
    }
  }

  $installed += [pscustomobject]@{
    name = $skillName
    source = $skillDir.FullName
    target = $targetDir
  }
}

Write-Output ("[skills-sync] repo_root={0}" -f $RepoRoot)
Write-Output ("[skills-sync] codex_skills={0}" -f $CodexSkillsDir)
Write-Output ("[skills-sync] discovered={0}" -f $skillFiles.Count)
Write-Output ("[skills-sync] unique_skills={0}" -f $skillEntries.Count)
Write-Output ("[skills-sync] dry_run={0}" -f ([bool]$DryRun))
Write-Output ("[skills-sync] planned_copy={0}" -f (($planned | Where-Object { $_.copy }).Count))
Write-Output ("[skills-sync] installed_or_updated={0}" -f $installed.Count)
Write-Output ("[skills-sync] skipped_existing={0}" -f $skipped.Count)
Write-Output ("[skills-sync] metadata_created={0}" -f $metadataCreated.Count)

if ($DryRun) {
  foreach ($row in $planned) {
    if ($row.copy) {
      Write-Output ("[skills-sync] ~ {0} <= {1}" -f $row.name, $row.source)
    }
  }
} else {
  foreach ($row in $installed) {
    Write-Output ("[skills-sync] + {0} <= {1}" -f $row.name, $row.source)
  }
}

if ($metadataCreated.Count -gt 0) {
  Write-Output ("[skills-sync] metadata for: {0}" -f ($metadataCreated -join ", "))
}

if ($skipped.Count -gt 0) {
  Write-Output ("[skills-sync] skipped: {0}" -f ($skipped -join ", "))
  Write-Output "[skills-sync] Use -Force to overwrite existing skills."
}
