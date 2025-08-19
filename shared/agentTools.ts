import { readFile as fsReadFile, writeFile as fsWriteFile, mkdir as fsMkdir, rename as fsRename, readdir } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(process.env.AGENT_ROOT ?? process.cwd());

function safe(p: string) {
  const full = path.resolve(ROOT, p);
  if (!full.startsWith(ROOT)) throw new Error('Path outside sandbox');
  return full;
}

export async function readFile({ filepath, path: altPath }: { filepath?: string, path?: string }) {
  const target = filepath || altPath;
  if (!target) throw new Error('filepath is required');
  return await fsReadFile(safe(target), 'utf8');
}

export async function listFiles({ dirpath }: { dirpath: string }) {
  const full = safe(dirpath);
  const entries = await readdir(full, { withFileTypes: true });
  return entries.map(e => e.name);
}

export async function writeFile({ filepath, content }: { filepath: string, content: string }) {
  const full = safe(filepath);
  await fsMkdir(path.dirname(full), { recursive: true });
  await fsWriteFile(full, content, 'utf8');
  return 'ok';
}

export async function mkdir({ dirpath }: { dirpath: string }) {
  await fsMkdir(safe(dirpath), { recursive: true });
  return 'ok';
}

export async function move({ from, to }: { from: string, to: string }) {
  await fsRename(safe(from), safe(to));
  return 'ok';
}

export async function run({ cmd, args = [] }: { cmd: string, args?: string[] }) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: ROOT, shell: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = '';
    child.stdout?.on('data', d => stdout += d.toString());
    child.stderr?.on('data', d => stderr += d.toString());
    child.on('close', code => resolve({ code, stdout, stderr }));
    child.on('error', err => resolve({ code: -1, stdout: '', stderr: (err as any).message }));
  });
}

export const tools = { readFile, listFiles, writeFile, mkdir, move, run } as const;

export const toolDefs = [
  {
    type: 'function' as const,
    function: {
      name: 'readFile',
      description: 'Read file contents',
      parameters: {
        type: 'object',
        properties: {
          filepath: { type: 'string', description: 'Path to file to read' }
        },
        required: ['filepath']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'listFiles',
      description: 'List files in a directory',
      parameters: {
        type: 'object',
        properties: {
          dirpath: { type: 'string', description: 'Directory path to list' }
        },
        required: ['dirpath']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'writeFile',
      description: 'Write content to a file',
      parameters: {
        type: 'object',
        properties: {
          filepath: { type: 'string', description: 'Path to file to write' },
          content: { type: 'string', description: 'Content to write' }
        },
        required: ['filepath', 'content']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'mkdir',
      description: 'Create a directory',
      parameters: {
        type: 'object',
        properties: {
          dirpath: { type: 'string', description: 'Directory path to create' }
        },
        required: ['dirpath']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'move',
      description: 'Move or rename a file',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Source path' },
          to: { type: 'string', description: 'Destination path' }
        },
        required: ['from', 'to']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'run',
      description: 'Execute a shell command',
      parameters: {
        type: 'object',
        properties: {
          cmd: { type: 'string', description: 'Command to run' },
          args: {
            type: 'array',
            items: { type: 'string' },
            description: 'Command arguments'
          }
        },
        required: ['cmd']
      }
    }
  }
] as const;

