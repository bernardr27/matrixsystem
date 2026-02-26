const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DIAG = path.join(ROOT, 'docs', 'diagnostics');
if(!fs.existsSync(DIAG)) fs.mkdirSync(DIAG, { recursive: true });

const apps = ['apps/reflect','apps/nexus','apps/citadel','apps/ghost-command','apps/rocket-command'];

function run(cmd, args, cwd){
  const res = spawnSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] });
  return res;
}

for(const app of apps){
  const dir = path.join(ROOT, app);
  const name = path.basename(dir);
  console.log('===', name, '===');
  if(!fs.existsSync(path.join(dir,'package.json'))){
    console.log(' no package.json, skipping');
    continue;
  }

  console.log('-> npm ci');
  run('npm',['ci','--silent'], dir);

  console.log('-> npm audit --json');
  const audit = run('npm',['audit','--json'], dir);
  fs.writeFileSync(path.join(DIAG, `${name}_npm_audit.json`), audit.stdout || audit.stderr || '');

  console.log('-> npm run build');
  const build = run('npm',['run','build','--silent'], dir);
  fs.writeFileSync(path.join(DIAG, `${name}_build.log`), build.stdout + '\n' + build.stderr);

  console.log('done', name);
}

console.log('All builds complete. Diagnostics in', DIAG);
