import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { existsSync } from 'node:fs';

const execFileAsync = promisify(execFile);

function resolveEnginePath(): string {
  const candidates = [
    path.resolve(process.cwd(), '../ghost-command/core/capability-engine.cjs'),
    path.resolve(process.cwd(), '../../ghost-command/core/capability-engine.cjs'),
    path.resolve(process.cwd(), 'apps/ghost-command/core/capability-engine.cjs'),
    path.resolve(process.cwd(), '../../apps/ghost-command/core/capability-engine.cjs')
  ];

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error('capability-engine.cjs not found from Reflect workspace');
  }

  return found;
}

function parseJsonOutput(raw: string): any {
  const text = raw.trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error(`Unable to parse capability engine output: ${text.slice(0, 400)}`);
  }
}

export async function runCapabilityEngine(args: string[]) {
  const enginePath = resolveEnginePath();
  const { stdout, stderr } = await execFileAsync(process.execPath, [enginePath, ...args], {
    timeout: 300_000,
    maxBuffer: 10 * 1024 * 1024
  });

  const parsed = parseJsonOutput(stdout);
  return {
    enginePath,
    parsed,
    stderr: stderr?.trim() || null
  };
}
