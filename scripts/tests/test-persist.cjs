const MemoryCortex = require('./core/memory-cortex.cjs');

async function testPersistence() {
    console.log('--- MemoryCortex Persistence Test ---');
    console.log('Current count:', MemoryCortex.memories.interactions.length);

    await MemoryCortex.logInteraction('test-role', 'This is a persistent test pattern at ' + new Date().toISOString());

    console.log('Count after log:', MemoryCortex.memories.interactions.length);
    console.log('Memory Path:', MemoryCortex.memoryPath);
}

testPersistence().then(() => {
    console.log('Test complete. Checking file...');
    setTimeout(() => process.exit(), 1000);
});
