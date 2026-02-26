const fs = require('fs');
const path = require('path');

// Simple maintenance script:
// - Moves old capture images and logs into a dated archive folder under `backups/cleanup-<timestamp>`
// - Keeps latest N files in each directory to avoid accidental removal
// - Safe-by-default: does not delete anything unless `--prune` is passed

const ROOT = path.resolve(__dirname, '..', '..');
const CAPTURES_DIR = path.join(ROOT, 'captures');
const BACKUPS_DIR = path.join(ROOT, 'backups');

const argv = process.argv.slice(2);
const prune = argv.includes('--prune'); // require explicit --prune to actually move files
const keepLatest = parseInt((argv.find(a=>a.startsWith('--keep='))||'--keep=100').split('=')[1],10) || 100;
const olderThanDays = parseInt((argv.find(a=>a.startsWith('--days='))||'--days=30').split('=')[1],10) || 30;

function mtimeDaysAgo(file, days){
  const stat = fs.statSync(file);
  const cutoff = Date.now() - (days*24*60*60*1000);
  return stat.mtimeMs < cutoff;
}

function safeMove(file, destDir){
  if(!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const base = path.basename(file);
  const dest = path.join(destDir, base);
  fs.renameSync(file, dest);
}

function archiveOldFiles(dir){
  if(!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f=>!f.startsWith('.')).map(f=>({
    name:f,
    full:path.join(dir,f),
    mtime:fs.statSync(path.join(dir,f)).mtimeMs
  })).sort((a,b)=>b.mtime-a.mtime);

  // keep latest N
  const toKeep = files.slice(0, keepLatest).map(x=>x.full);
  const toConsider = files.slice(keepLatest).map(x=>x.full);

  // filter by age
  const candidates = toConsider.filter(f=> mtimeDaysAgo(f, olderThanDays));
  if(candidates.length === 0) return [];

  const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
  const archiveDir = path.join(BACKUPS_DIR, `cleanup-${timestamp}`);
  if(!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

  if(!prune){
    console.log('[CLEANUP] Dry-run: would archive', candidates.length, 'files to', archiveDir);
    return candidates;
  }

  for(const f of candidates){
    try{ safeMove(f, archiveDir); }
    catch(e){ console.warn('[CLEANUP] failed to move', f, e.message); }
  }
  console.log('[CLEANUP] Archived', candidates.length, 'files to', archiveDir);
  return candidates;
}

function main(){
  console.log('[CLEANUP] Root:', ROOT);
  console.log('[CLEANUP] Captures dir:', CAPTURES_DIR);
  console.log('[CLEANUP] Keep latest:', keepLatest, 'files; Age threshold (days):', olderThanDays);
  if(!fs.existsSync(CAPTURES_DIR)){
    console.log('[CLEANUP] No captures dir found; exiting.');
    return;
  }

  // operate on captures and top-level logs
  archiveOldFiles(CAPTURES_DIR);
  // also scan for logs in root
  const logs = ['matrix_capture_full_mobile.log','matrix_capture_run.log','matrix_capture_validate_after_fix.log','matrix_capture_full_mobile_after_fix.log'];
  const rootCandidates = logs.map(l=>path.join(ROOT,l)).filter(p=>fs.existsSync(p) && mtimeDaysAgo(p, olderThanDays));
  if(rootCandidates.length===0){
    console.log('[CLEANUP] No root logs to archive.');
  } else if(!prune){
    console.log('[CLEANUP] Dry-run: would archive root logs:', rootCandidates);
  } else {
    const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
    const archiveDir = path.join(BACKUPS_DIR, `cleanup-${timestamp}`);
    if(!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
    for(const f of rootCandidates) safeMove(f, archiveDir);
    console.log('[CLEANUP] Archived', rootCandidates.length, 'root logs to', archiveDir);
  }

  console.log('[CLEANUP] Done. Use --prune to actually move files.');
}

main();
