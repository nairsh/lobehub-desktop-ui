import { toolsClient } from '@/libs/trpc/client';

const terminalClient = (toolsClient as any).terminal;

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
  }): Promise<TerminalProcessResult> => terminalClient.getCommandStatus.query(params);

  killCommand = (params: { force?: boolean; processId: string; topicId: string }) =>
    terminalClient.killCommand.mutate(params);

  listFiles = (params: { path?: string; topicId: string }): Promise<TerminalListFilesResult> =>
    terminalClient.listFiles.query(params);

  readFile = (params: {
    endLine?: number;
    path: string;
    startLine?: number;
    topicId: string;
  }): Promise<{ content: string; path: string; success: boolean; totalLines?: number }> =>
    terminalClient.readFile.query(params);

  resetCurrentTopicWorkspace = (topicId: string) =>
    terminalClient.resetCurrentTopicWorkspace.mutate({ topicId });

  runCommand = (params: {
    background?: boolean;
    command: string;
    cwd?: string;
    topicId: string;
    wait?: number;
  }): Promise<TerminalProcessResult> => terminalClient.runCommand.mutate(params);

  sendCommandInput = (params: { input: string; processId: string; topicId: string }) =>
    terminalClient.sendCommandInput.mutate(params);

  workspaceInfo = (topicId: string): Promise<TerminalWorkspaceInfo> =>
    terminalClient.workspaceInfo.query({ topicId });
}

export const openTerminalWorkspaceService = new OpenTerminalWorkspaceService();
