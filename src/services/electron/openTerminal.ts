import { type OpenTerminalConfig } from '@lobechat/electron-client-ipc';

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
}

export const openTerminalService = new OpenTerminalService();
