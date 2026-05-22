import { describe, expect, it } from 'vitest';

import { type FileListItem } from '@/types/files';

import { getActiveUploadCount, mergePortalFiles } from './utils';

const createFile = (overrides: Partial<FileListItem> = {}): FileListItem => ({
  chunkCount: null,
  chunkingError: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  embeddingError: null,
  fileType: 'text/plain',
  finishEmbedding: false,
  id: 'file-1',
  name: 'notes.txt',
  size: 12,
  sourceType: 'file',
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  url: 'https://example.com/notes.txt',
  ...overrides,
});

describe('portal file utils', () => {
  it('keeps managed files first, filters documents, and dedupes chat attachments', () => {
    const result = mergePortalFiles(
      [createFile(), createFile({ id: 'docs-1', name: 'Page', sourceType: 'document' })],
      [
        {
          fileType: 'text/plain',
          id: 'file-1',
          name: 'notes.txt',
          size: 12,
          url: 'https://example.com/notes.txt',
        },
        {
          fileType: 'image/png',
          id: 'chat-file-1',
          name: 'chart.png',
          size: 24,
          url: 'https://example.com/chart.png',
        },
      ],
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'file-1', sourceType: 'file' });
    expect(result[0].isChatAttachment).toBeUndefined();
    expect(result[1]).toMatchObject({ id: 'chat-file-1', isChatAttachment: true });
  });

  it('counts active uploads only', () => {
    expect(
      getActiveUploadCount([
        { file: new File([], 'a.txt'), id: 'a', status: 'pending' },
        { file: new File([], 'b.txt'), id: 'b', status: 'uploading' },
        { file: new File([], 'c.txt'), id: 'c', status: 'success' },
      ]),
    ).toBe(2);
  });
});
