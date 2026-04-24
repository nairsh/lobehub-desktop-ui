import { beforeEach, describe, expect, it, vi } from 'vitest';

import { openTerminalService } from '@/services/electron/openTerminal';

import { OpenTerminalCloudSandboxProvider } from './cloudSandbox';

vi.mock('@/libs/trpc/client', () => ({
  toolsClient: {
    market: {
      execInSandbox: { mutate: vi.fn() },
      exportAndUploadFile: { mutate: vi.fn() },
    },
  },
}));

vi.mock('@/services/electron/openTerminal', () => ({
  openTerminalService: {
    getConfig: vi.fn(),
  },
}));

describe('OpenTerminalCloudSandboxProvider', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:download'),
    });
  });

  it('maps runCommand to the Open Terminal execute endpoint', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          exit_code: 0,
          id: 'cmd-1',
          output: [{ content: 'hello\n', stream: 'stdout' }],
          status: 'done',
        }),
        {
          headers: { 'content-type': 'application/json' },
          status: 200,
        },
      ),
    );

    const provider = new OpenTerminalCloudSandboxProvider(async () => ({
      apiKey: 'secret',
      baseUrl: 'https://terminal.example.com',
    }));

    const result = await provider.callTool(
      'runCommand',
      { command: 'echo hello' },
      { topicId: 'topic-1', userId: 'user-1' },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://terminal.example.com/execute?wait=30',
      expect.objectContaining({
        body: JSON.stringify({ command: 'echo hello' }),
        method: 'POST',
      }),
    );

    const [, requestInit] = fetchMock.mock.calls[0];
    const headers = new Headers(requestInit?.headers);

    expect(headers.get('authorization')).toBe('Bearer secret');
    expect(headers.get('x-session-id')).toBe('topic-1');
    expect(headers.get('x-user-id')).toBe('user-1');
    expect(result).toEqual({
      error: undefined,
      result: {
        exitCode: 0,
        output: 'hello\n',
        shell_id: 'cmd-1',
        stderr: '',
        stdout: 'hello\n',
      },
      success: true,
    });
  });

  it('creates a blob download URL when exporting a file', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(new Blob(['file content'], { type: 'text/plain' }), { status: 200 }),
    );

    const provider = new OpenTerminalCloudSandboxProvider(async () => ({
      apiKey: '',
      baseUrl: 'https://terminal.example.com/',
    }));

    const result = await provider.exportAndUploadFile('/tmp/report.txt', 'report.txt', 'topic-2');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://terminal.example.com/files/view?path=%2Ftmp%2Freport.txt',
      expect.anything(),
    );
    expect(result).toEqual({
      filename: 'report.txt',
      mimeType: 'text/plain',
      size: 12,
      success: true,
      url: 'blob:download',
    });
  });

  it('reloads the saved Open Terminal config on each request', async () => {
    const loadConfig = vi.mocked(openTerminalService.getConfig);
    loadConfig.mockResolvedValueOnce({
      apiKey: 'secret-a',
      baseUrl: 'https://terminal-a.example.com',
    });
    loadConfig.mockResolvedValueOnce({
      apiKey: 'secret-b',
      baseUrl: 'https://terminal-b.example.com',
    });

    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            exit_code: 0,
            id: 'cmd-a',
            output: [{ content: 'a\n', stream: 'stdout' }],
            status: 'done',
          }),
          {
            headers: { 'content-type': 'application/json' },
            status: 200,
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            exit_code: 0,
            id: 'cmd-b',
            output: [{ content: 'b\n', stream: 'stdout' }],
            status: 'done',
          }),
          {
            headers: { 'content-type': 'application/json' },
            status: 200,
          },
        ),
      );

    const provider = new OpenTerminalCloudSandboxProvider();

    await provider.callTool(
      'runCommand',
      { command: 'echo one' },
      { topicId: 'topic-1', userId: 'user-1' },
    );
    await provider.callTool(
      'runCommand',
      { command: 'echo two' },
      { topicId: 'topic-1', userId: 'user-1' },
    );

    expect(loadConfig).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://terminal-a.example.com/execute?wait=30',
      expect.objectContaining({
        body: JSON.stringify({ command: 'echo one' }),
        method: 'POST',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://terminal-b.example.com/execute?wait=30',
      expect.objectContaining({
        body: JSON.stringify({ command: 'echo two' }),
        method: 'POST',
      }),
    );
  });
});
