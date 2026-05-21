import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCallTool, mockExportAndUploadFile } = vi.hoisted(() => ({
  mockCallTool: vi.fn(),
  mockExportAndUploadFile: vi.fn(),
}));

vi.mock('@/libs/trpc/client', () => ({
  toolsClient: {
    market: {
      execInSandbox: { mutate: mockCallTool },
      exportAndUploadFile: { mutate: mockExportAndUploadFile },
    },
  },
}));

// Import after mocks are set up
const { cloudSandboxService } = await import('./cloudSandbox');

describe('cloudSandboxService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('callTool', () => {
    it('delegates to toolsClient.market.execInSandbox', async () => {
      const expected = { result: { output: 'hello' }, success: true };
      mockCallTool.mockResolvedValue(expected);

      const result = await cloudSandboxService.callTool(
        'runCommand',
        { command: 'echo hello' },
        { topicId: 'topic-1' },
      );

      expect(mockCallTool).toHaveBeenCalledWith({
        params: { command: 'echo hello' },
        toolName: 'runCommand',
        topicId: 'topic-1',
        userId: undefined,
      });
      expect(result).toEqual(expected);
    });
  });

  describe('exportAndUploadFile', () => {
    it('delegates to toolsClient.market.exportAndUploadFile', async () => {
      const expected = { filename: 'out.txt', success: true, url: '/f/abc' };
      mockExportAndUploadFile.mockResolvedValue(expected);

      const result = await cloudSandboxService.exportAndUploadFile(
        '/home/user/out.txt',
        'out.txt',
        'topic-1',
      );

      expect(mockExportAndUploadFile).toHaveBeenCalledWith({
        filename: 'out.txt',
        path: '/home/user/out.txt',
        topicId: 'topic-1',
      });
      expect(result).toEqual(expected);
    });
  });
});
