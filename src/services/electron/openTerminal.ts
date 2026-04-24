import {
  type OpenTerminalConfig,
  type OpenTerminalConnectionTestResult,
} from '@lobechat/electron-client-ipc';

import { ensureElectronIpc } from '@/utils/electron/ipc';

class OpenTerminalService {
  clearConfig = async () => {
    return ensureElectronIpc().openTerminal.clearConfig();
  };

  getConfig = async (): Promise<OpenTerminalConfig> => {
    return ensureElectronIpc().openTerminal.getConfig();
  };

  setConfig = async (config: OpenTerminalConfig): Promise<OpenTerminalConfig> => {
    return ensureElectronIpc().openTerminal.setConfig(config);
  };

  testConnection = async (
    config?: OpenTerminalConfig,
  ): Promise<OpenTerminalConnectionTestResult> => {
    return ensureElectronIpc().openTerminal.testConnection(config);
  };
}

export const openTerminalService = new OpenTerminalService();
