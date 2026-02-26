const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function run() {
    console.log('Scanning ports 3000-3005...');
    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-gpu'],
    });

    try {
        const page = await browser.newPage();
        for (let port = 3000; port <= 3005; port++) {
            try {
                await page.goto(`http://localhost:${port}`, { waitUntil: 'domcontentloaded', timeout: 3000 });
                const title = await page.title();
                console.log(`Port ${port}: ${title}`);
            } catch (e) {
                // console.log(`Port ${port}: closed or timeout`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

run();
