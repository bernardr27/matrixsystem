param(
  [string]$RepoRoot = "",
  [string]$CodexSkillsDir = ""
)

$ErrorActionPreference = "Stop"

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

$skills = foreach ($f in $skillFiles) {
  $dir = $f.Directory
  if (-not $dir) { continue }
  $name = $dir.Name
  if ([string]::IsNullOrWhiteSpace($name)) { continue }
  $agentsYaml = Join-Path $dir.FullName "agents\openai.yaml"
  [pscustomobject]@{
    name = $name
    source = $dir.FullName
    has_agents_yaml = Test-Path $agentsYaml
  }
}

$dupes = $skills | Group-Object -Property name | Where-Object { $_.Count -gt 1 }
$missingMetadata = $skills | Where-Object { -not $_.has_agents_yaml }
$dupGroupCount = @($dupes).Count
$missingCount = @($missingMetadata).Count

$qmdAgent = Test-Path (Join-Path $RepoRoot ".agent\skills\qmd\SKILL.md")
$qmdRalph = Test-Path (Join-Path $RepoRoot "quarantine\ralph\skills\qmd\SKILL.md")
$qmdCodex = Test-Path (Join-Path $CodexSkillsDir "qmd\SKILL.md")

Write-Output ("[skills-doctor] repo_root={0}" -f $RepoRoot)
Write-Output ("[skills-doctor] codex_skills={0}" -f $CodexSkillsDir)
Write-Output ("[skills-doctor] discovered={0}" -f $skills.Count)
Write-Output ("[skills-doctor] duplicate_names={0}" -f $dupGroupCount)
Write-Output ("[skills-doctor] missing_agents_yaml={0}" -f $missingCount)
Write-Output ("[skills-doctor] qmd_agent={0}" -f $qmdAgent)
Write-Output ("[skills-doctor] qmd_ralph={0}" -f $qmdRalph)
Write-Output ("[skills-doctor] qmd_codex={0}" -f $qmdCodex)

if ($dupGroupCount -gt 0) {
  foreach ($d in $dupes) {
    $sources = ($d.Group | Select-Object -ExpandProperty source) -join " | "
    Write-Output ("[skills-doctor] duplicate {0}: {1}" -f $d.Name, $sources)
  }
}

if ($missingCount -gt 0) {
  foreach ($m in $missingMetadata) {
    Write-Output ("[skills-doctor] missing agents/openai.yaml: {0}" -f $m.source)
  }
}
