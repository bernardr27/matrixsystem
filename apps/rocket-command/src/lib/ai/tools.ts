import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Safety boundary: All file paths must be within this directory
const MATRIX_ROOT = 'g:\\matrix';

/**
 * Validates and resolves a path to ensure it stays within the Matrix root.
 */
function resolveSafePath(unsafePath: string): string {
    const resolved = path.resolve(MATRIX_ROOT, unsafePath.replace(/^[\/\\]+/, ''));
    if (!resolved.startsWith(MATRIX_ROOT)) {
        throw new Error(`Path Security Violation: Cannot access outside ${MATRIX_ROOT}.`);
    }
    return resolved;
}

/* ═══════════════════════════════════════════════════════
   TOOL SCHEMAS (Passed to LLM)
   ═══════════════════════════════════════════════════════ */
export const matrixToolsSchema = [
    {
        type: 'function',
        function: {
            name: 'fs_read_file',
            description: 'Read the contents of a file in the Matrix repository.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Relative path from g:\\matrix (e.g. apps/reflect/src/app/page.tsx)' }
                },
                required: ['path']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'fs_write_file',
            description: 'Write or overwrite a file in the Matrix repository. Use with extreme caution.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Relative path from g:\\matrix' },
                    content: { type: 'string', description: 'The complete file content to write. Do not truncate.' }
                },
                required: ['path', 'content']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'fs_list_dir',
            description: 'List contents of a directory in the Matrix repository.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Relative directory path from g:\\matrix (e.g. apps/rocket-command)' }
                },
                required: ['path']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'sys_execute_command',
            description: 'Execute a system command on the Windows host (PowerShell/CMD). Can be used to build apps, run scripts, or audit the system.',
            parameters: {
                type: 'object',
                properties: {
                    command: { type: 'string', description: 'The command to run (e.g., npm run build, npx eslint, node scripts/matrix-triage.js)' },
                    cwd: { type: 'string', description: 'Optional relative working directory from g:\\matrix. Defaults to root.' }
                },
                required: ['command']
            }
        }
    }
];

/* ═══════════════════════════════════════════════════════
   TOOL EXECUTOR
   ═══════════════════════════════════════════════════════ */
export async function executeMatrixTool(name: string, args: Record<string, any>): Promise<string> {
    try {
        switch (name) {
            case 'fs_read_file': {
                const target = resolveSafePath(args.path);
                if (!fs.existsSync(target)) return `File not found: ${args.path}`;
                const content = await fs.promises.readFile(target, 'utf8');
                return content.length > 8000 ? content.substring(0, 8000) + '\n...[TRUNCATED due to length]' : content;
            }

            case 'fs_write_file': {
                const target = resolveSafePath(args.path);
                const dir = path.dirname(target);
                if (!fs.existsSync(dir)) {
                    await fs.promises.mkdir(dir, { recursive: true });
                }
                await fs.promises.writeFile(target, args.content, 'utf8');
                return `Successfully wrote to ${args.path}`;
            }

            case 'fs_list_dir': {
                const target = resolveSafePath(args.path);
                if (!fs.existsSync(target)) return `Directory not found: ${args.path}`;
                const stat = await fs.promises.stat(target);
                if (!stat.isDirectory()) return `${args.path} is a file, not a directory. Use fs_read_file.`;

                const files = await fs.promises.readdir(target, { withFileTypes: true });
                const list = files.map(f => `${f.isDirectory() ? '[DIR] ' : '[FILE]'} ${f.name}`).join('\n');
                return `Contents of ${args.path}:\n${list}`;
            }

            case 'sys_execute_command': {
                const cwdPath = args.cwd ? resolveSafePath(args.cwd) : MATRIX_ROOT;
                try {
                    const { stdout, stderr } = await execAsync(args.command, { cwd: cwdPath, timeout: 30000 });
                    let res = '';
                    if (stdout) res += `STDOUT:\n${stdout}\n`;
                    if (stderr) res += `STDERR:\n${stderr}\n`;
                    if (!res) return 'Command executed successfully with no output.';
                    return res.length > 8000 ? res.substring(0, 8000) + '\n...[TRUNCATED output]' : res;
                } catch (e: any) {
                    return `Command failed:\n${e.message}\nSTDOUT: ${e.stdout || 'none'}\nSTDERR: ${e.stderr || 'none'}`;
                }
            }

            default:
                return `Error: Unknown tool ${name}`;
        }
    } catch (err: unknown) {
        return `Tool Execution Error: ${err instanceof Error ? err.message : String(err)}`;
    }
}
