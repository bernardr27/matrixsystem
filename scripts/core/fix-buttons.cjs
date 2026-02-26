const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        if (fs.statSync(dirFile).isDirectory()) {
            filelist = walkSync(dirFile, filelist);
        } else if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
            filelist.push(dirFile);
        }
    });
    return filelist;
};

const files = walkSync('g:\\matrix\\apps\\nexus\\src');
let fixedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix button types: match <button... without type=... that has onClick
    content = content.replace(/<button(?![^>]*type=["'][^"']*["'])((?:[^>]*?\n)?[^>]*?onClick[\s\S]*?>)/g, '<button type="button"$1');

    // Also simply fix <button onClick => <button type="button" onClick
    // Just to be aggressive if the regex fails across newlines
    content = content.replace(/<(button)([\s\n]+onClick)/g, '<$1 type="button"$2');
    content = content.replace(/<(button)([\s\n]+className=[^>]+?onClick)/g, '<$1 type="button"$2');
    content = content.replace(/<(button)([\s\n]+disabled=[^>]+?onClick)/g, '<$1 type="button"$2');

    // Fix new Date() -> new Date(Date.now()) where appropriate
    // EVOLVE regex: /(?:const|let|var)\s+\w+\s*=\s*new Date\(\)/g
    content = content.replace(/(const|let|var)(\s+\w+\s*=\s*)new Date\(\)/g, '$1$2new Date(Date.now())');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        fixedCount++;
        console.log('Fixed', file);
    }
}
console.log('Total files patched:', fixedCount);
