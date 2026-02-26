/**
 * 👁️ MATRIX CORE: APP SCANNER (v1.0)
 * Autonomously audits the Reflect app's architecture, text, and flows.
 */

const fs = require('fs');
const path = require('path');

const REFLECT_PATH = path.join(__dirname, '../apps/reflect/src');
const REPORT_PATH = path.join(__dirname, '../logs/app_scan_report.md');

const results = {
    pages: [],
    components: [],
    textStrings: new Set(),
    flows: [],
    hooks: []
};

function scanDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') {
                scanDir(fullPath);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
            analyzeFile(fullPath);
        }
    });
}

function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(REFLECT_PATH, filePath);

    // 1. Identify Pages (Routes)
    if (filePath.includes('app') && fileIsPage(filePath)) {
        results.pages.push(relativePath);
    }

    // 2. Identify Components
    if (filePath.includes('components')) {
        results.components.push(relativePath);
    }

    // 3. Extract Text Strings (Basic heuristic)
    const textMatches = content.match(/>([^<>{}\n]+)</g);
    if (textMatches) {
        textMatches.forEach(match => {
            const text = match.slice(1, -1).trim();
            if (text && text.length > 3) results.textStrings.add(text);
        });
    }

    // 4. Identify Flows (Navigation/Action)
    const flowKeywords = ['router.push', 'router.replace', 'redirect(', 'setStep(', 'handleNext'];
    flowKeywords.forEach(kw => {
        if (content.includes(kw)) {
            results.flows.push({ file: relativePath, type: kw });
        }
    });

    // 5. Hooks
    const hooks = content.match(/use[A-Z][a-zA-Z]+/g);
    if (hooks) {
        hooks.forEach(h => results.hooks.push({ file: relativePath, hook: h }));
    }
}

function fileIsPage(filePath) {
    return filePath.endsWith('page.tsx') || filePath.endsWith('page.js');
}

console.log('--- INITIATING MATRIX APP SCAN ---');
scanDir(REFLECT_PATH);

const report = `# 🧬 MATRIX APP SCAN REPORT
> Generated: ${new Date().toISOString()}
> Target: Reflect (Next.js App)

## 🛤️ ROUTES & PAGES (${results.pages.length})
${results.pages.map(p => `- \`${p}\``).join('\n')}

## 🧩 UI COMPONENTS (${results.components.length})
${results.components.map(c => `- \`${c}\``).join('\n')}

## 🔄 INTERACTION FLOWS (${results.flows.length})
${results.flows.map(f => `- **${f.type}** in \`${f.file}\``).join('\n')}

## 🪝 ACTIVE HOOKS (${results.hooks.length})
(Summary of state management distribution)

## ✍️ CORE TEXT STRINGS (Sample)
${Array.from(results.textStrings).slice(0, 30).map(s => `- "${s}"`).join('\n')}

---
**END OF EVOLUTIONARY DATA**
`;

if (!fs.existsSync(path.join(__dirname, '../logs'))) {
    fs.mkdirSync(path.join(__dirname, '../logs'));
}
fs.writeFileSync(REPORT_PATH, report);
console.log(`Scan complete. Report saved to: ${REPORT_PATH}`);
