const fs = require('fs');
const path = require('path');
const net = require('net');

const ROOT = path.resolve(__dirname, '..', '..');
const APPS_DIR = path.join(ROOT, 'apps');
const CAPTURES_DIR = path.join(ROOT, 'captures');
const BACKUP_CONFIG = path.join(ROOT, 'backup.config.json');
const BACKUPS_DIR = path.join(ROOT, 'backups');
const AUTH_DIR = path.join(ROOT, 'scripts', 'auth');

function listApps(){
  if(!fs.existsSync(APPS_DIR)) return [];
  return fs.readdirSync(APPS_DIR).filter(d=>{
    const p = path.join(APPS_DIR,d);
    return fs.statSync(p).isDirectory();
  });
}

function readPackageJson(app){
  const p = path.join(APPS_DIR, app, 'package.json');
  if(!fs.existsSync(p)) return null;
  try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){ return null; }
}

function parsePortFromDevScript(script){
  if(!script) return null;
  const m = script.match(/-p\s*(\d{3,5})/);
  return m ? parseInt(m[1],10) : null;
}

function checkPortOpen(port){
  return new Promise(resolve=>{
    if(!port) return resolve(false);
    const s = net.createConnection({port, host:'127.0.0.1'}, ()=>{ s.destroy(); resolve(true); });
    s.on('error', ()=> resolve(false));
    setTimeout(()=>resolve(false),2000);
  });
}

function dirStats(dir){
  if(!fs.existsSync(dir)) return {count:0, size:0};
  const files = fs.readdirSync(dir).map(f=>path.join(dir,f)).filter(p=>fs.existsSync(p)).map(p=>({p, stat: fs.statSync(p)}));
  const size = files.reduce((s,f)=>s+ (f.stat.isFile()?f.stat.size:0),0);
  return { count: files.length, size };
}

async function run(){
  const apps = listApps();
  const appReports = [];

  for(const app of apps){
    const pkg = readPackageJson(app);
    const dev = pkg?.scripts?.dev || null;
    const port = parsePortFromDevScript(dev) || null;
    const portOpen = await checkPortOpen(port);
    const authSnapshot = path.join(AUTH_DIR, `${app}_auth.json`);
    appReports.push({ app, pkgExists: !!pkg, devScript: dev, expectedPort: port, portOpen, authSnapshotExists: fs.existsSync(authSnapshot) });
  }

  const captures = dirStats(CAPTURES_DIR);
  const backupsExist = fs.existsSync(BACKUPS_DIR);
  const backupConfigExists = fs.existsSync(BACKUP_CONFIG);
  const maintenanceScript = fs.existsSync(path.join(ROOT,'scripts','maintenance','cleanup_organize.cjs'));

  const report = {
    timestamp: new Date().toISOString(),
    root: ROOT,
    apps: appReports,
    captures,
    backupsExist,
    backupConfigExists,
    maintenanceScript,
    authDirExists: fs.existsSync(AUTH_DIR),
  };

  const outDir = path.join(ROOT, 'docs', 'diagnostics');
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `system_audit_${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report,null,2));
  console.log('System audit written to', outPath);
  console.log('Summary:');
  console.log(' Apps:', apps.length);
  for(const a of appReports) console.log(` - ${a.app}: pkg=${a.pkgExists} port=${a.expectedPort} open=${a.portOpen} auth=${a.authSnapshotExists}`);
  console.log(' Captures:', captures.count, 'files —', Math.round(captures.size/1024),'KB');
  console.log(' Backups dir exists:', backupsExist, ' backup.config:', backupConfigExists);
  console.log(' Maintenance script present:', maintenanceScript);
}

run().catch(e=>{ console.error(e); process.exit(1); });
