/**
 * @vitest-environment happy-dom
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { documentService } from '@/services/document';
import { DocumentSourceType, type LobeDocument } from '@/types/document';

import { usePageStore } from '../../store';

vi.hoisted(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      clear: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    },
  });
});

vi.mock('zustand/traditional');

vi.mock('@/services/document', () => ({
  documentService: {
    createDocument: vi.fn(),
    deleteDocument: vi.fn(),
    getDocumentById: vi.fn(),
    getPageDocuments: vi.fn(),
    queryDocuments: vi.fn(),
    updateDocument: vi.fn(),
  },
}));

const createPageFixture = (overrides: Partial<LobeDocument> = {}): LobeDocument => ({
  content: 'Body',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  editorData: {},
  fileType: 'custom/document',
  filename: 'Page title',
  id: 'page-1',
  metadata: { createdAt: 1, emoji: '📄' },
  source: 'document',
  sourceType: DocumentSourceType.EDITOR,
  title: 'Page title',
  totalCharCount: 4,
  totalLineCount: 1,
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();

  usePageStore.setState(
    {
      documents: [],
    },
    false,
  );
});

describe('PageCrudAction', () => {
  it('removes the emoji from page metadata when clearing it', async () => {
    const { result } = renderHook(() => usePageStore());
    const refreshDocuments = vi.fn().mockResolvedValue(undefined);

    act(() => {
      usePageStore.setState(
        {
          documents: [createPageFixture()],
          refreshDocuments,
        } as any,
        false,
      );
    });

    await act(async () => {
      await result.current.updatePageOptimistically('page-1', { emoji: undefined });
    });

    expect(usePageStore.getState().documents?.[0].metadata).toEqual({ createdAt: 1 });
    expect(documentService.updateDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'page-1',
        metadata: { createdAt: 1 },
      }),
    );
    expect(refreshDocuments).toHaveBeenCalled();
  });
});
