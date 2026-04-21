import type { OpenTerminalConfig } from '@lobechat/electron-client-ipc';
import { safeStorage } from 'electron';

import { createLogger } from '@/utils/logger';

import { ControllerModule, IpcMethod } from './index';

const logger = createLogger('controllers:OpenTerminalConfigCtr');

export default class OpenTerminalConfigCtr extends ControllerModule {
  static override readonly groupName = 'openTerminal';

  @IpcMethod()
  async clearConfig(): Promise<void> {
    this.app.storeManager.set('openTerminalBaseUrl', '');
    this.app.storeManager.set('openTerminalEncryptedApiKey', '');
  }

  @IpcMethod()
  async getConfig(): Promise<OpenTerminalConfig> {
    return {
      apiKey: this.getApiKey(),
      baseUrl: this.app.storeManager.get('openTerminalBaseUrl', ''),
    };
  }

  @IpcMethod()
  async setConfig(config: OpenTerminalConfig): Promise<OpenTerminalConfig> {
    const baseUrl = this.normalizeBaseUrl(config.baseUrl);

    this.app.storeManager.set('openTerminalBaseUrl', baseUrl);
    this.setApiKey(config.apiKey?.trim() || '');

    return {
      apiKey: this.getApiKey(),
      baseUrl,
    };
  }

  private getApiKey(): string {
    const stored = this.app.storeManager.get('openTerminalEncryptedApiKey', '');
    if (!stored) return '';

    if (!safeStorage.isEncryptionAvailable()) return stored;

    try {
      return safeStorage.decryptString(Buffer.from(stored, 'base64'));
    } catch (error) {
      logger.error('Failed to decrypt Open Terminal API key:', error);
      return '';
    }
  }

  private normalizeBaseUrl(baseUrl: string): string {
    const normalized = baseUrl.trim();
    if (!normalized) return '';

    let url: URL;

    try {
      url = new URL(normalized);
    } catch {
      throw new Error('Open Terminal URL must be a valid http(s) URL.');
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Open Terminal URL must use http or https.');
    }

    return url.toString().replace(/\/+$/, '');
  }

  private setApiKey(apiKey: string) {
    if (!apiKey) {
      this.app.storeManager.set('openTerminalEncryptedApiKey', '');
      return;
    }

    if (!safeStorage.isEncryptionAvailable()) {
      logger.warn('Safe storage unavailable, storing Open Terminal API key unencrypted');
      this.app.storeManager.set('openTerminalEncryptedApiKey', apiKey);
      return;
    }

    const encrypted = Buffer.from(safeStorage.encryptString(apiKey)).toString('base64');
    this.app.storeManager.set('openTerminalEncryptedApiKey', encrypted);
  }
}
