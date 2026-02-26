/**
 * MATRIX SUPABASE BRIDGE v1.0
 * ════════════════════════════
 * Centralized, resilient Supabase client factory.
 *
 * Solves: T-Mobile/ISP gateway blocking Cloudflare IPs intermittently.
 * Strategy:
 *   1. At startup, probe the Supabase REST endpoint with a raw https.get()
 *      to confirm TCP reachability — no Node.js fetch quirks involved.
 *   2. If the probe fails, retry with exponential backoff (up to 10 minutes).
 *   3. Once confirmed reachable, return the real createClient() instance.
 *   4. Provide a lightweight safeQuery() wrapper that auto-retries failed
 *      Supabase queries on transient network errors.
 *
 * Usage in ANY backend:
 *   const { supabase, waitForBridge } = require('./supabase-bridge.cjs');
 *   await waitForBridge(); // Wait until Supabase is reachable
 */

'use strict';

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const https = require('https');
const path = require('path');
const { EventEmitter } = require('events');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[BRIDGE] FATAL: Missing SUPABASE_URL / SUPABASE_KEY in .env');
    process.exit(1);
}

// ── Parse hostname from URL ──────────────────────────────
const { hostname: SUPABASE_HOST } = new URL(SUPABASE_URL);

// ── Events ───────────────────────────────────────────────
class SupabaseBridge extends EventEmitter {
    constructor() {
        super();
        this.client = null;
        this.isReady = false;
        this._readyPromise = null;
        this._retryCount = 0;
        this._MAX_RETRIES = 20;           // ~10 minutes total with backoff
        this._BASE_DELAY = 3000;         // 3 seconds base
        this._MAX_DELAY = 60000;        // cap at 60 seconds
    }

    // ── TCP + HTTP probe before handing out the client ────
    _probe() {
        return new Promise((resolve) => {
            const req = https.request(
                {
                    hostname: SUPABASE_HOST,
                    port: 443,
                    path: '/rest/v1/',
                    method: 'HEAD',
                    timeout: 8000,
                    headers: { apikey: SUPABASE_KEY },
                },
                (res) => {
                    res.resume();
                    resolve(res.statusCode < 600); // any HTTP response = we reached the server
                }
            );
            req.on('timeout', () => { req.destroy(); resolve(false); });
            req.on('error', () => resolve(false));
            req.end();
        });
    }

    // ── Wait until Supabase is reachable, then resolve ────
    waitForBridge() {
        if (this._readyPromise) return this._readyPromise;
        this._readyPromise = new Promise(async (resolve) => {
            while (this._retryCount < this._MAX_RETRIES) {
                const ok = await this._probe();
                if (ok) {
                    if (!this.client) {
                        this.client = createClient(SUPABASE_URL, SUPABASE_KEY);
                        this.isReady = true;
                        const status = this._retryCount > 0 ? 'RESTORED' : 'CONNECTED';
                        console.log(`[BRIDGE] Supabase link ${status} (attempt ${this._retryCount + 1})`);
                        this.emit('ready', this.client);
                    }
                    return resolve(this.client);
                }

                this._retryCount++;
                const delay = Math.min(
                    this._BASE_DELAY * Math.pow(1.5, this._retryCount),
                    this._MAX_DELAY
                );
                console.warn(`[BRIDGE] Supabase unreachable. Retry ${this._retryCount}/${this._MAX_RETRIES} in ${(delay / 1000).toFixed(0)}s…`);
                await new Promise(r => setTimeout(r, delay));
            }

            // After max retries — fall through offline (don't crash the app)
            console.error('[BRIDGE] Supabase bridge OFFLINE after max retries. Returning null client.');
            this.emit('offline');
            resolve(null);
        });
        return this._readyPromise;
    }

    // ── safeQuery: execute a Supabase operation with retry ────
    async safeQuery(fn, retries = 3) {
        if (!this.client) {
            await this.waitForBridge();
        }
        for (let i = 0; i <= retries; i++) {
            try {
                const result = await fn(this.client);
                if (!result?.error) return result;
                // Supabase logical error — don't retry
                if (result.error?.code !== 'NETWORK_ERROR') return result;
                throw new Error(result.error.message);
            } catch (err) {
                if (i === retries) {
                    console.error(`[BRIDGE] safeQuery failed after ${retries} retries: ${err.message}`);
                    return { data: null, error: err };
                }
                const delay = 1000 * (i + 1);
                console.warn(`[BRIDGE] Query error (${err.message}). Retry ${i + 1}/${retries} in ${delay}ms…`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
}

// Singleton
const bridge = new SupabaseBridge();

// Kick off probe immediately so it runs in background
bridge.waitForBridge();

module.exports = bridge;
