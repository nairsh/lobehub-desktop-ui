/**
 * API names for Cloud Sandbox tool
 */
export const CloudSandboxApiName = {
  displayFile: 'displayFile',
  editLocalFile: 'editLocalFile',
  executeCode: 'executeCode',
  exportFile: 'exportFile',
  getCommandOutput: 'getCommandOutput',
  globLocalFiles: 'globLocalFiles',
  grepContent: 'grepContent',
  killCommand: 'killCommand',
  listLocalFiles: 'listLocalFiles',
  listProcesses: 'listProcesses',
  moveLocalFiles: 'moveLocalFiles',
  readLocalFile: 'readLocalFile',
  renameLocalFile: 'renameLocalFile',
  runCommand: 'runCommand',
  searchLocalFiles: 'searchLocalFiles',
  sendProcessInput: 'sendProcessInput',
  writeLocalFile: 'writeLocalFile',
} as const;

export type CloudSandboxApiNameType =
  (typeof CloudSandboxApiName)[keyof typeof CloudSandboxApiName];
