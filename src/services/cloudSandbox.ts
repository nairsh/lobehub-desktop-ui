import { isDesktop } from '@lobechat/const';
import { type OpenTerminalConfig } from '@lobechat/electron-client-ipc';

import { toolsClient } from '@/libs/trpc/client';
import {
  type CallToolResult,
  type ExecInSandboxInput,
  type ExportAndUploadFileInput,
  type ExportAndUploadFileResult,
} from '@/server/routers/tools/market';
import { openTerminalService } from '@/services/electron/openTerminal';

const DEFAULT_COMMAND_WAIT_SECONDS = 30;

interface CloudSandboxContext {
  topicId: string;
  userId?: string;
}

interface CloudSandboxProvider {
  callTool: (
    toolName: string,
    params: Record<string, any>,
    context: CloudSandboxContext,
  ) => Promise<CallToolResult>;
  exportAndUploadFile: (
    path: string,
    filename: string,
    topicId: string,
  ) => Promise<ExportAndUploadFileResult>;
}

interface OpenTerminalProcessOutput {
  output: string;
  stderr: string;
  stdout: string;
}

const countOccurrences = (content: string, search: string) => {
  if (!search) return 0;

  let count = 0;
  let index = 0;

  while (true) {
    const nextIndex = content.indexOf(search, index);
    if (nextIndex === -1) return count;
    count += 1;
    index = nextIndex + search.length;
  }
};

const getBaseName = (path: string) => {
  const parts = path.split('/').filter(Boolean);
  return parts.at(-1) || path;
};

const getFileType = (path: string) => {
  const filename = getBaseName(path);
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex === -1 ? '' : filename.slice(dotIndex + 1);
};

const getParentDirectory = (path: string) => {
  const normalized = path.replace(/\/+$/, '');
  const slashIndex = normalized.lastIndexOf('/');
  return slashIndex <= 0 ? '/' : normalized.slice(0, slashIndex);
};

const joinOutput = (output: unknown): OpenTerminalProcessOutput => {
  if (typeof output === 'string') {
    return { output, stderr: '', stdout: output };
  }

  if (!Array.isArray(output)) {
    return { output: '', stderr: '', stdout: '' };
  }

  const stderr: string[] = [];
  const stdout: string[] = [];

  for (const entry of output) {
    if (typeof entry === 'string') {
      stdout.push(entry);
      continue;
    }

    if (!entry || typeof entry !== 'object') continue;

    const record = entry as Record<string, unknown>;
    const text = [
      record.content,
      record.data,
      record.output,
      record.message,
      record.chunk,
      record.text,
    ].find((item) => typeof item === 'string') as string | undefined;

    if (!text) continue;

    const stream = String(record.stream ?? record.type ?? record.channel ?? '').toLowerCase();
    if (stream.includes('stderr') || stream.includes('error')) {
      stderr.push(text);
    } else {
      stdout.push(text);
    }
  }

  return {
    output: [...stdout, ...stderr].join(''),
    stderr: stderr.join(''),
    stdout: stdout.join(''),
  };
};

const stringifyTransportError = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return data.detail || data.message || JSON.stringify(data);
    }

    return await response.text();
  } catch {
    return response.statusText;
  }
};

class TrpcCloudSandboxProvider implements CloudSandboxProvider {
  async callTool(
    toolName: string,
    params: Record<string, any>,
    context: CloudSandboxContext,
  ): Promise<CallToolResult> {
    const input: ExecInSandboxInput = {
      params,
      toolName,
      topicId: context.topicId,
      userId: context.userId,
    };

    return toolsClient.market.execInSandbox.mutate(input);
  }

  async exportAndUploadFile(
    path: string,
    filename: string,
    topicId: string,
  ): Promise<ExportAndUploadFileResult> {
    const input: ExportAndUploadFileInput = {
      filename,
      path,
      topicId,
    };

    return toolsClient.market.exportAndUploadFile.mutate(input);
  }
}

export class OpenTerminalCloudSandboxProvider implements CloudSandboxProvider {
  constructor(
    private readonly loadConfig: () => Promise<OpenTerminalConfig> = () =>
      openTerminalService.getConfig(),
  ) {}

  async callTool(
    toolName: string,
    params: Record<string, any>,
    context: CloudSandboxContext,
  ): Promise<CallToolResult> {
    try {
      const config = await this.getRequiredConfig();

      switch (toolName) {
        case 'editLocalFile': {
          const file = await this.readFile(config, context, params.path);
          const replacements = countOccurrences(file.content, params.search);

          const result = await this.requestJson<{ size: number }>(
            config,
            context,
            '/files/replace',
            {
              body: JSON.stringify({
                path: params.path,
                replacements: [
                  {
                    allow_multiple: Boolean(params.all),
                    replacement: params.replace,
                    target: params.search,
                  },
                ],
              }),
              method: 'POST',
            },
          );

          return {
            result: {
              bytesWritten: result.size,
              replacements: params.all ? replacements : Math.min(replacements, 1),
            },
            success: true,
          };
        }

        case 'execScript':
        case 'executeCode': {
          const command =
            toolName === 'execScript'
              ? params.command
              : this.buildExecuteCodeCommand(params.code, params.language);
          const result = await this.runCommand(config, context, {
            command,
            timeout: DEFAULT_COMMAND_WAIT_SECONDS * 1000,
          });

          return {
            error: result.success
              ? undefined
              : { message: result.stderr || result.output || 'Code execution failed' },
            result: {
              exitCode: result.exitCode,
              output: result.output,
              stderr: result.stderr,
            },
            success: result.success,
          };
        }

        case 'getCommandOutput': {
          const result = await this.requestJson<{
            output?: unknown;
            status?: string;
          }>(config, context, `/execute/${params.commandId}/status`);
          const output = joinOutput(result.output);

          return {
            result: {
              newOutput: output.output,
              output: output.output,
              running: result.status === 'running',
            },
            success: true,
          };
        }

        case 'globLocalFiles': {
          const result = await this.requestJson<{ matches?: Array<{ path?: string }> }>(
            config,
            context,
            `/files/glob?${new URLSearchParams({
              path: params.directory || '.',
              pattern: params.pattern,
            }).toString()}`,
          );

          const files = (result.matches || []).map((item) => item.path).filter(Boolean);

          return {
            result: {
              files,
              total_files: files.length,
            },
            success: true,
          };
        }

        case 'grepContent': {
          const searchParams = new URLSearchParams({
            path: params.directory || '.',
            query: params.pattern,
          });

          if (params.filePattern) {
            searchParams.append('include', params.filePattern);
          }

          const result = await this.requestJson<{
            matches?: Array<{ content?: string; file?: string; line?: number }>;
          }>(config, context, `/files/grep?${searchParams.toString()}`);

          const matches = (result.matches || []).map((item) =>
            [item.file, item.line, item.content].filter(Boolean).join(':'),
          );

          return {
            result: {
              matches,
              total_matches: matches.length,
            },
            success: true,
          };
        }

        case 'killCommand': {
          await this.requestJson(config, context, `/execute/${params.commandId}`, {
            method: 'DELETE',
          });

          return {
            result: { success: true },
            success: true,
          };
        }

        case 'listLocalFiles': {
          const result = await this.requestJson<{
            dir?: string;
            entries?: Array<Record<string, any>>;
          }>(
            config,
            context,
            `/files/list?${new URLSearchParams({ directory: params.directoryPath }).toString()}`,
          );

          const files = (result.entries || []).map((entry) => {
            const name = entry.name || getBaseName(entry.path || '');
            return {
              isDirectory: Boolean(entry.isDirectory ?? entry.is_dir ?? entry.type === 'directory'),
              name,
              path:
                entry.path ||
                `${result.dir || params.directoryPath}/${name}`.replaceAll(/\/+/g, '/'),
              size: entry.size,
              type: entry.type,
            };
          });

          return {
            result: {
              files,
              totalCount: files.length,
            },
            success: true,
          };
        }

        case 'moveLocalFiles': {
          const results = await Promise.all(
            (params.operations || []).map(
              async (operation: { destination: string; source: string }) => {
                try {
                  await this.requestJson(config, context, '/files/move', {
                    body: JSON.stringify(operation),
                    method: 'POST',
                  });

                  return {
                    newPath: operation.destination,
                    sourcePath: operation.source,
                    success: true,
                  };
                } catch (error) {
                  return {
                    error: error instanceof Error ? error.message : String(error),
                    sourcePath: operation.source,
                    success: false,
                  };
                }
              },
            ),
          );

          return {
            result: {
              results,
              successCount: results.filter((item) => item.success).length,
            },
            success: true,
          };
        }

        case 'readLocalFile': {
          const result = await this.readFile(
            config,
            context,
            params.path,
            params.startLine,
            params.endLine,
          );

          return {
            result: {
              charCount: result.content.length,
              content: result.content,
              fileType: getFileType(params.path),
              filename: getBaseName(params.path),
              totalCharCount: result.content.length,
              totalLines: result.total_lines,
            },
            success: true,
          };
        }

        case 'renameLocalFile': {
          const destination = `${getParentDirectory(params.oldPath)}/${params.newName}`.replaceAll(
            /\/+/g,
            '/',
          );

          await this.requestJson(config, context, '/files/move', {
            body: JSON.stringify({
              destination,
              source: params.oldPath,
            }),
            method: 'POST',
          });

          return {
            result: {
              newPath: destination,
              success: true,
            },
            success: true,
          };
        }

        case 'runCommand': {
          const result = await this.runCommand(config, context, {
            background: params.background,
            command: params.command,
            timeout: params.timeout,
          });

          return {
            error: result.success
              ? undefined
              : { message: result.stderr || result.output || 'Command execution failed' },
            result: {
              exitCode: result.exitCode,
              output: result.output,
              shell_id: result.commandId,
              stderr: result.stderr,
              stdout: result.stdout,
            },
            success: result.success,
          };
        }

        case 'searchLocalFiles': {
          const pattern = this.buildSearchPattern(params.keyword, params.fileType);
          const searchDirectory = params.directory || '.';
          const result = await this.requestJson<{ matches?: Array<{ path?: string }> }>(
            config,
            context,
            `/files/glob?${new URLSearchParams({
              path: searchDirectory,
              pattern,
            }).toString()}`,
          );

          const files = (result.matches || [])
            .map((item) => item.path)
            .filter(Boolean)
            .map((path) => ({ path }));

          return {
            result: {
              results: files,
              totalCount: files.length,
            },
            success: true,
          };
        }

        case 'writeLocalFile': {
          const result = await this.requestJson<{ size: number }>(config, context, '/files/write', {
            body: JSON.stringify({
              content: params.content,
              path: params.path,
            }),
            method: 'POST',
          });

          return {
            result: {
              bytesWritten: result.size,
            },
            success: true,
          };
        }

        case 'displayFile': {
          await this.requestJson<{ exists?: boolean; path?: string }>(
            config,
            context,
            `/files/display?${new URLSearchParams({ path: params.path }).toString()}`,
          );

          return {
            result: {
              exists: true,
              path: params.path,
            },
            success: true,
          };
        }

        case 'listProcesses': {
          const result = await this.requestJson<
            Array<{ command?: string; id?: string; status?: string }>
          >(config, context, '/execute');

          const processes = (Array.isArray(result) ? result : []).map((entry) => ({
            command: entry.command ?? '',
            id: entry.id ?? '',
            running: entry.status === 'running',
          }));

          return {
            result: {
              processes,
            },
            success: true,
          };
        }

        case 'sendProcessInput': {
          await this.requestJson(config, context, `/execute/${params.commandId}/input`, {
            body: JSON.stringify({ input: params.input }),
            method: 'POST',
          });

          return {
            result: {
              commandId: params.commandId,
            },
            success: true,
          };
        }

        default: {
          throw new Error(`Unsupported Open Terminal tool: ${toolName}`);
        }
      }
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : String(error),
        },
        result: {},
        success: false,
      };
    }
  }

  async exportAndUploadFile(
    path: string,
    filename: string,
    topicId: string,
  ): Promise<ExportAndUploadFileResult> {
    const config = await this.getRequiredConfig();
    const response = await this.requestRaw(
      config,
      { topicId },
      `/files/view?${new URLSearchParams({ path }).toString()}`,
    );
    const blob = await response.blob();

    return {
      filename,
      mimeType: blob.type,
      size: blob.size,
      success: true,
      url: URL.createObjectURL(blob),
    };
  }

  private buildExecuteCodeCommand(code: string, language: string | undefined) {
    const escaped = code.replaceAll('\\', '\\\\').replaceAll("'", "'\"'\"'");

    switch (language) {
      case 'javascript': {
        return `node -e '${escaped}'`;
      }
      case 'typescript': {
        return `if command -v bun >/dev/null 2>&1; then bun -e '${escaped}'; elif command -v npx >/dev/null 2>&1; then npx --yes tsx -e '${escaped}'; else node -e '${escaped}'; fi`;
      }
      case 'python':
      default: {
        return `python -c '${escaped}'`;
      }
    }
  }

  private buildSearchPattern(keyword?: string, fileType?: string) {
    const normalizedKeyword = keyword?.trim();
    const normalizedFileType = fileType?.replace(/^\./, '').trim();

    if (normalizedKeyword && normalizedFileType) {
      return `**/*${normalizedKeyword}*.${normalizedFileType}`;
    }

    if (normalizedKeyword) {
      return `**/*${normalizedKeyword}*`;
    }

    if (normalizedFileType) {
      return `**/*.${normalizedFileType}`;
    }

    return '**/*';
  }

  private async getRequiredConfig() {
    const config = await this.getNormalizedConfig();

    if (!config.baseUrl) {
      throw new Error(
        'Open Terminal is not configured. Add the server URL in cloud runtime settings.',
      );
    }

    return config;
  }

  private async getNormalizedConfig() {
    const config = await this.loadConfig();
    return {
      ...config,
      baseUrl: config.baseUrl.replace(/\/+$/, ''),
    };
  }

  private async readFile(
    config: OpenTerminalConfig,
    context: CloudSandboxContext,
    path: string,
    startLine?: number,
    endLine?: number,
  ) {
    const query = new URLSearchParams({ path });

    if (startLine !== undefined) query.set('start_line', String(startLine));
    if (endLine !== undefined) query.set('end_line', String(endLine));

    return this.requestJson<{
      content: string;
      total_lines?: number;
    }>(config, context, `/files/read?${query.toString()}`);
  }

  private async requestJson<T = any>(
    config: OpenTerminalConfig,
    context: CloudSandboxContext,
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const response = await this.requestRaw(config, context, path, init);
    return response.json();
  }

  private async requestRaw(
    config: OpenTerminalConfig,
    context: CloudSandboxContext,
    path: string,
    init?: RequestInit,
  ): Promise<Response> {
    const headers = new Headers(init?.headers);

    if (config.apiKey) {
      headers.set('Authorization', `Bearer ${config.apiKey}`);
    }

    headers.set('x-session-id', context.topicId);
    if (context.userId) headers.set('x-user-id', context.userId);

    if (init?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      throw new Error(await stringifyTransportError(response));
    }

    return response;
  }

  private async runCommand(
    config: OpenTerminalConfig,
    context: CloudSandboxContext,
    params: { background?: boolean; command: string; timeout?: number },
  ) {
    const waitSeconds = params.background
      ? '0'
      : String(
          Math.max(1, Math.ceil((params.timeout || DEFAULT_COMMAND_WAIT_SECONDS * 1000) / 1000)),
        );

    const result = await this.requestJson<{
      exit_code?: number;
      id?: string;
      output?: unknown;
      status?: string;
    }>(config, context, `/execute?${new URLSearchParams({ wait: waitSeconds }).toString()}`, {
      body: JSON.stringify({ command: params.command }),
      method: 'POST',
    });

    const output = joinOutput(result.output);
    const exitCode =
      typeof result.exit_code === 'number'
        ? result.exit_code
        : result.status === 'running'
          ? undefined
          : 1;
    const success = result.status === 'running' || exitCode === 0;

    return {
      commandId: result.id,
      exitCode,
      output: output.output,
      stderr: output.stderr,
      stdout: output.stdout,
      success,
    };
  }
}

class CloudSandboxService {
  private readonly openTerminalProvider = new OpenTerminalCloudSandboxProvider();
  private readonly trpcProvider = new TrpcCloudSandboxProvider();

  private getProvider(): CloudSandboxProvider {
    return isDesktop ? this.openTerminalProvider : this.trpcProvider;
  }

  async callTool(
    toolName: string,
    params: Record<string, any>,
    context: CloudSandboxContext,
  ): Promise<CallToolResult> {
    return this.getProvider().callTool(toolName, params, context);
  }

  async exportAndUploadFile(
    path: string,
    filename: string,
    topicId: string,
  ): Promise<ExportAndUploadFileResult> {
    return this.getProvider().exportAndUploadFile(path, filename, topicId);
  }
}

export const cloudSandboxService = new CloudSandboxService();
