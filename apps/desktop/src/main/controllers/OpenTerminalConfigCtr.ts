import type {
  OpenTerminalConfig,
  OpenTerminalConnectionTestResult,
} from '@lobechat/electron-client-ipc';
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

  @IpcMethod()
  async testConnection(config?: OpenTerminalConfig): Promise<OpenTerminalConnectionTestResult> {
    try {
      const targetConfig = await this.getConfigForConnectionTest(config);

      if (!targetConfig.baseUrl) {
        throw new Error(
          'Open Terminal is not configured. Add the server URL in cloud runtime settings.',
        );
      }

      const response = await fetch(
        `${targetConfig.baseUrl}/files/list?${new URLSearchParams({ directory: '.' }).toString()}`,
        {
          headers: this.createRequestHeaders(targetConfig.apiKey, 'connection-test'),
          method: 'GET',
        },
      );

      if (!response.ok) {
        throw new Error(await this.stringifyTransportError(response));
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to test Open Terminal connection:', error);
      throw error;
    }
  }

  private async getConfigForConnectionTest(config?: OpenTerminalConfig): Promise<OpenTerminalConfig> {
    if (!config) return this.getConfig();

    return {
      apiKey: config.apiKey?.trim() || '',
      baseUrl: this.normalizeBaseUrl(config.baseUrl),
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

  private createRequestHeaders(apiKey: string | undefined, sessionId: string) {
    const headers = new Headers();

    if (apiKey) {
      headers.set('Authorization', `Bearer ${apiKey}`);
    }

    headers.set('x-session-id', sessionId);

    return headers;
  }

  private async stringifyTransportError(response: Response): Promise<string> {
    const contentType = response.headers.get('content-type') || '';

    try {
      if (contentType.includes('application/json')) {
        const data = (await response.json()) as Record<string, unknown>;
        const detail = data.detail;
        if (typeof detail === 'string' && detail) return detail;

        const message = data.message;
        if (typeof message === 'string' && message) return message;

        return JSON.stringify(data);
      }

      return await response.text();
    } catch {
      return response.statusText;
    }
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
