import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type App } from '@/core/App';

import OpenTerminalConfigCtr from '../OpenTerminalConfigCtr';

const { ipcMainHandleMock, fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  ipcMainHandleMock: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: {
    handle: ipcMainHandleMock,
  },
  safeStorage: {
    isEncryptionAvailable: vi.fn(() => false),
  },
}));

vi.mock('@/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

const store = new Map<string, unknown>();

const mockApp = {
  storeManager: {
    get: (key: string, defaultValue?: unknown) =>
      store.has(key) ? store.get(key) : defaultValue,
    set: (key: string, value: unknown) => {
      store.set(key, value);
    },
  },
} as unknown as App;

describe('OpenTerminalConfigCtr', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.clear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('tests the saved Open Terminal endpoint with the stored credentials', async () => {
    store.set('openTerminalBaseUrl', 'https://saved-terminal.example.com');
    store.set('openTerminalEncryptedApiKey', '');
    fetchMock.mockResolvedValueOnce(new Response('', { status: 200 }));

    const ctr = new OpenTerminalConfigCtr(mockApp);
    const result = await ctr.testConnection({
      apiKey: ' secret ',
      baseUrl: 'https://terminal.example.com/',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://terminal.example.com/files/list?directory=.',
      expect.objectContaining({
        headers: expect.any(Headers),
        method: 'GET',
      }),
    );
    const [, requestInit] = fetchMock.mock.calls[0];
    const headers = new Headers(requestInit?.headers);
    expect(headers.get('authorization')).toBe('Bearer secret');
    expect(headers.get('x-session-id')).toBe('connection-test');
    expect(result).toEqual({ success: true });
  });

  it('surfaces transport errors from the Open Terminal endpoint', async () => {
    store.set('openTerminalBaseUrl', 'https://terminal.example.com');
    store.set('openTerminalEncryptedApiKey', '');
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Unauthorized' }), {
        headers: { 'content-type': 'application/json' },
        status: 401,
      }),
    );

    const ctr = new OpenTerminalConfigCtr(mockApp);

    await expect(ctr.testConnection()).rejects.toThrow('Unauthorized');
  });
});
