import { toolsClient } from '@/libs/trpc/client';

const terminalClient = (toolsClient as any).terminal;
export const OPEN_TERMINAL_API_MISSING = 'OPEN_TERMINAL_API_MISSING';

export class OpenTerminalApiMissingError extends Error {
  code = OPEN_TERMINAL_API_MISSING;

  constructor() {
    super('Open Terminal workspace APIs are unavailable on this server.');
    this.name = 'OpenTerminalApiMissingError';
  }
}

const normalizeTerminalError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('No procedure found on path "terminal.')) {
    return new OpenTerminalApiMissingError();
  }

  return error instanceof Error ? error : new Error(message);
};

const withTerminalErrorHandling = async <T>(callback: () => Promise<T>): Promise<T> => {
  try {
    return await callback();
  } catch (error) {
    throw normalizeTerminalError(error);
  }
};

export interface TerminalFileEntry {
  isDirectory: boolean;
  modifiedAt?: string;
  name: string;
  path: string;
  size?: number;
  type?: string;
}

export interface TerminalListFilesResult {
  directory: string;
  entries: TerminalFileEntry[];
  success: boolean;
}

export interface TerminalProcessResult {
  exitCode?: number;
  id?: string;
  output: string;
  running: boolean;
  status?: string;
  stderr: string;
  stdout: string;
  success: boolean;
}

export interface TerminalWorkspaceInfo {
  capabilities?: Record<string, unknown>;
  imageTag?: string | null;
  instanceId: string;
  label: string;
  rootPath: string;
  sharedWorkspacePath: string;
  success: boolean;
  topicWorkspacePath: string;
}

class OpenTerminalWorkspaceService {
  getCommandStatus = (params: {
    offset?: number;
    processId: string;
    tail?: number;
    topicId: string;
    wait?: number;
  }): Promise<TerminalProcessResult> =>
    withTerminalErrorHandling(() => terminalClient.getCommandStatus.query(params));

  killCommand = (params: { force?: boolean; processId: string; topicId: string }) =>
    withTerminalErrorHandling(() => terminalClient.killCommand.mutate(params));

  listFiles = (params: { path?: string; topicId: string }): Promise<TerminalListFilesResult> =>
    withTerminalErrorHandling(() => terminalClient.listFiles.query(params));

  readFile = (params: {
    endLine?: number;
    path: string;
    startLine?: number;
    topicId: string;
  }): Promise<{ content: string; path: string; success: boolean; totalLines?: number }> =>
    withTerminalErrorHandling(() => terminalClient.readFile.query(params));

  resetCurrentTopicWorkspace = (topicId: string) =>
    withTerminalErrorHandling(() => terminalClient.resetCurrentTopicWorkspace.mutate({ topicId }));

  runCommand = (params: {
    background?: boolean;
    command: string;
    cwd?: string;
    topicId: string;
    wait?: number;
  }): Promise<TerminalProcessResult> =>
    withTerminalErrorHandling(() => terminalClient.runCommand.mutate(params));

  sendCommandInput = (params: { input: string; processId: string; topicId: string }) =>
    withTerminalErrorHandling(() => terminalClient.sendCommandInput.mutate(params));

  workspaceInfo = (topicId: string): Promise<TerminalWorkspaceInfo> =>
    withTerminalErrorHandling(() => terminalClient.workspaceInfo.query({ topicId }));

  writeFile = (params: {
    content: string;
    path: string;
    topicId: string;
  }): Promise<{ bytesWritten?: number; path: string; success: boolean }> =>
    withTerminalErrorHandling(() => terminalClient.writeFile.mutate(params));
}

export const openTerminalWorkspaceService = new OpenTerminalWorkspaceService();
