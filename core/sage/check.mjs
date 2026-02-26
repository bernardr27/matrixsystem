/**
 * SAGE CHECK — Quick environment health scan
 * Zero API credits. Pure local checks.
 * 
 * Usage: node core/sage/check.mjs
 */

import { SageEnvironment } from './engine.mjs';

const env = new SageEnvironment();
env.printReport().then(r => {
    process.exit(r.healthy ? 0 : 1);
});
