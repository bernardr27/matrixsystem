const net = require('net');
const fs = require('fs');
const path = require('path');

const APPS = [
  { name: 'reflect', port: 3000 },
  { name: 'nexus', port: 3001 },
  { name: 'citadel', port: 3005 },
  { name: 'ghost-command', port: 5173 },
  { name: 'rocket-command', port: 4000 },
];

function checkPort(port, host='127.0.0.1', timeout=2000){
  return new Promise(resolve=>{
    const s = net.createConnection({port, host}, ()=>{ s.destroy(); resolve(true); });
    s.on('error', ()=>resolve(false));
    setTimeout(()=>resolve(false), timeout);
  });
}

async function run(){
  const results = [];
  for(const a of APPS){
    const ok = await checkPort(a.port);
    results.push({ app: a.name, port: a.port, ok });
    console.log(`${a.name} : ${a.port} -> ${ok ? 'OPEN' : 'CLOSED'}`);
  }
  const outDir = path.join(process.cwd(),'docs','diagnostics');
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `health_check_${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
  fs.writeFileSync(out, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
  console.log('Health check written to', out);
}

run().catch(e=>{ console.error(e); process.exit(1); });
