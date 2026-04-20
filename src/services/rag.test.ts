import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ragService } from './rag';

const {
  createEmbeddingChunksTaskMutateMock,
  createParseFileTaskMutateMock,
  getDocumentByIdMock,
  getFileContentsMutateMock,
  getKnowledgeItemsMock,
  parseFileContentMutateMock,
  removeMessageQueryMutateMock,
  retryParseFileTaskMutateMock,
  semanticSearchForChatMutateMock,
  semanticSearchMutateMock,
} = vi.hoisted(() => ({
  createEmbeddingChunksTaskMutateMock: vi.fn(),
  createParseFileTaskMutateMock: vi.fn(),
  getDocumentByIdMock: vi.fn(),
  getFileContentsMutateMock: vi.fn(),
  getKnowledgeItemsMock: vi.fn(),
  parseFileContentMutateMock: vi.fn(),
  removeMessageQueryMutateMock: vi.fn(),
  retryParseFileTaskMutateMock: vi.fn(),
  semanticSearchForChatMutateMock: vi.fn(),
  semanticSearchMutateMock: vi.fn(),
}));

vi.mock('@/libs/trpc/client', () => ({
  lambdaClient: {
    chunk: {
      createEmbeddingChunksTask: { mutate: createEmbeddingChunksTaskMutateMock },
      createParseFileTask: { mutate: createParseFileTaskMutateMock },
      getFileContents: { mutate: getFileContentsMutateMock },
      retryParseFileTask: { mutate: retryParseFileTaskMutateMock },
      semanticSearch: { mutate: semanticSearchMutateMock },
      semanticSearchForChat: { mutate: semanticSearchForChatMutateMock },
    },
    document: {
      parseFileContent: { mutate: parseFileContentMutateMock },
    },
    message: {
      removeMessageQuery: { mutate: removeMessageQueryMutateMock },
    },
  },
}));

vi.mock('@/services/document', () => ({
  documentService: {
    getDocumentById: getDocumentByIdMock,
  },
}));

vi.mock('@/services/file', () => ({
  fileService: {
    getKnowledgeItems: getKnowledgeItemsMock,
  },
}));

describe('ragService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getKnowledgeContents', () => {
    it('reads docs_* items through the document service and preserves request order', async () => {
      getDocumentByIdMock.mockResolvedValue({
        content: 'Document body for the selected knowledge item.',
        filename: 'Project_Beschreibung.pdf',
        title: 'Matura Projekt',
      });
      getFileContentsMutateMock.mockResolvedValue([
        {
          content: 'Legacy file content',
          fileId: 'file_1',
          filename: 'legacy.txt',
          preview: 'Legacy file',
          totalCharCount: 19,
          totalLineCount: 1,
        },
      ]);

      const result = await ragService.getKnowledgeContents(['docs_1', 'file_1']);

      expect(result).toEqual([
        expect.objectContaining({
          content: 'Document body for the selected knowledge item.',
          fileId: 'docs_1',
          filename: 'Matura Projekt',
        }),
        expect.objectContaining({
          content: 'Legacy file content',
          fileId: 'file_1',
          filename: 'legacy.txt',
        }),
      ]);
    });
  });

  describe('semanticSearchForChatWithFallback', () => {
    it('falls back to local document search when provider semantic search fails', async () => {
      semanticSearchForChatMutateMock.mockRejectedValue(new Error('Provider service error'));
      getKnowledgeItemsMock.mockResolvedValue({
        hasMore: false,
        items: [{ id: 'docs_1' }],
      });
      getDocumentByIdMock.mockResolvedValue({
        content:
          'The Matura Projekt is a student project focused on describing the project scope and deliverables.',
        filename: 'Project_Beschreibung.pdf',
        title: 'Matura Projekt',
      });

      const result = await ragService.semanticSearchForChatWithFallback({
        knowledgeIds: ['kb_1'],
        query: 'What is the Matura project about?',
        topK: 5,
      });

      expect(result.fileResults).toHaveLength(1);
      expect(result.fileResults[0]).toEqual(
        expect.objectContaining({
          fileId: 'docs_1',
          fileName: 'Matura Projekt',
        }),
      );
      expect(result.chunks[0]).toEqual(
        expect.objectContaining({
          fileId: 'docs_1',
          text: expect.stringContaining('Matura Projekt'),
        }),
      );
    });
  });
});
