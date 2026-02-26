try {
    const next = require('next');
    console.log('✅ Next.js module loaded successfully');
    console.log('Next Version:', require('next/package.json').version);
} catch (e) {
    console.error('❌ Failed to load next:', e);
}
