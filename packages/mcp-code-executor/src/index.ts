#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { copyFile, mkdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, isAbsolute, resolve } from 'node:path';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

interface ExecuteCodeArgs {
  code: string;
  language: string;
  timeoutMs?: number;
}

interface ExportFileArgs {
  filePath: string;
  outputDir?: string;
}

const DEFAULT_TIMEOUT_MS = 30_000;

const LANGUAGE_COMMANDS: Record<string, { args: (code: string) => string[]; cmd: string }> = {
  bash: { args: (code) => ['-c', code], cmd: 'bash' },
  javascript: { args: (code) => ['-e', code], cmd: 'node' },
  js: { args: (code) => ['-e', code], cmd: 'node' },
  node: { args: (code) => ['-e', code], cmd: 'node' },
  python: { args: (code) => ['-c', code], cmd: 'python3' },
  python3: { args: (code) => ['-c', code], cmd: 'python3' },
  sh: { args: (code) => ['-c', code], cmd: 'bash' },
  shell: { args: (code) => ['-c', code], cmd: 'bash' },
};

function runProcess(
  cmd: string,
  args: string[],
  timeoutMs: number,
): Promise<{ exitCode: number | null; stderr: string; stdout: string; timedOut: boolean }> {
  return new Promise((resolvePromise) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolvePromise({
        exitCode: null,
        stderr: stderr + `\n[spawn error] ${err.message}`,
        stdout,
        timedOut,
      });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolvePromise({ exitCode: code, stderr, stdout, timedOut });
    });
  });
}

async function handleExecuteCode(args: ExecuteCodeArgs) {
  const { code, language } = args;
  const timeoutMs = args.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const spec = LANGUAGE_COMMANDS[language.toLowerCase()];
  if (!spec) {
    const supported = [...new Set(Object.keys(LANGUAGE_COMMANDS))].join(', ');
    throw new Error(`Unsupported language: ${language}. Supported: ${supported}`);
  }

  const result = await runProcess(spec.cmd, spec.args(code), timeoutMs);
  const summary = [
    `exitCode: ${result.exitCode}`,
    result.timedOut ? `timedOut: true (after ${timeoutMs}ms)` : null,
    '--- stdout ---',
    result.stdout || '(empty)',
    '--- stderr ---',
    result.stderr || '(empty)',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    content: [{ text: summary, type: 'text' as const }],
    isError: result.timedOut || (result.exitCode !== null && result.exitCode !== 0),
  };
}

async function handleExportFile(args: ExportFileArgs) {
  const src = isAbsolute(args.filePath) ? args.filePath : resolve(process.cwd(), args.filePath);
  const srcStat = await stat(src).catch(() => null);
  if (!srcStat || !srcStat.isFile()) {
    throw new Error(`Source file not found or not a regular file: ${src}`);
  }

  const outputDir = args.outputDir
    ? isAbsolute(args.outputDir)
      ? args.outputDir
      : resolve(process.cwd(), args.outputDir)
    : resolve(homedir(), 'Downloads');

  await mkdir(outputDir, { recursive: true });
  const dest = resolve(outputDir, basename(src));
  await copyFile(src, dest);

  return {
    content: [{ text: `Exported file to: ${dest}`, type: 'text' as const }],
  };
}

const server = new Server(
  { name: 'lobechat-mcp-code-executor', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      description:
        'Execute a snippet of code locally in the specified language. Supported languages: javascript/node, python/python3, bash/shell. Runs the process with a timeout (default 30s) and returns stdout, stderr, and exit code.',
      inputSchema: {
        properties: {
          code: { description: 'Source code to execute', type: 'string' },
          language: {
            description: 'Language runtime (javascript, python, bash, ...)',
            type: 'string',
          },
          timeoutMs: {
            description: 'Execution timeout in milliseconds (default 30000)',
            type: 'number',
          },
        },
        required: ['language', 'code'],
        type: 'object',
      },
      name: 'execute_code',
    },
    {
      description:
        'Copy a local file to an output directory (defaults to ~/Downloads) and return the resulting path. Useful for exporting generated artifacts to the user.',
      inputSchema: {
        properties: {
          filePath: { description: 'Absolute or relative path to the source file', type: 'string' },
          outputDir: {
            description: 'Destination directory (defaults to ~/Downloads)',
            type: 'string',
          },
        },
        required: ['filePath'],
        type: 'object',
      },
      name: 'export_file',
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { arguments: rawArgs, name } = request.params;
  try {
    if (name === 'execute_code') {
      return await handleExecuteCode(rawArgs as unknown as ExecuteCodeArgs);
    }
    if (name === 'export_file') {
      return await handleExportFile(rawArgs as unknown as ExportFileArgs);
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ text: `Error: ${message}`, type: 'text' as const }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Signal readiness on stderr so stdout stays clean for JSON-RPC
  console.error('[lobechat-mcp-code-executor] ready on stdio');
}

main().catch((err) => {
  console.error('[lobechat-mcp-code-executor] fatal:', err);
  process.exit(1);
});
