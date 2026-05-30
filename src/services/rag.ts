import type {
  ChatSemanticSearchChunk,
  FileSearchResult,
  SemanticSearchSchemaType,
} from '@lobechat/types';

import { lambdaClient } from '@/libs/trpc/client';
import { documentService } from '@/services/document';
import { fileService } from '@/services/file';

interface KnowledgeContentItem {
  content: string;
  error?: string;
  fileId: string;
  filename: string;
  preview?: string;
  totalCharCount?: number;
  totalLineCount?: number;
}

interface KnowledgeBaseDocumentResult {
  documentId: string;
  knowledgeBaseId: string;
  relevance: number;
  snippet: string;
  title: string;
  updatedAt: Date | string;
}

interface SemanticSearchForChatClientResult {
  chunks: ChatSemanticSearchChunk[];
  documents?: KnowledgeBaseDocumentResult[];
  errors?: { bm25?: string; vector?: string };
  fileResults: FileSearchResult[];
}

const isFileSearchResult = (value: FileSearchResult | null): value is FileSearchResult =>
  value !== null;

const DOCUMENT_ID_PREFIX = 'docs_';
const LOCAL_SEARCH_MAX_ITEMS = 24;
const LOCAL_SEARCH_SNIPPET_LENGTH = 240;
const LOCAL_SEARCH_TOP_CHUNKS = 3;

const escapeRegExp = (value: string) => value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeWhitespace = (value: string) => value.replaceAll(/\s+/g, ' ').trim();

const tokenizeQuery = (query: string) =>
  Array.from(new Set(query.toLowerCase().match(/[a-z0-9][a-z0-9_-]*/g) || [])).filter(
    (token) => token.length > 1,
  );

const createSnippet = (content: string, tokens: string[]) => {
  const normalizedContent = normalizeWhitespace(content);
  if (!normalizedContent) return '';

  const firstMatchIndex = tokens.reduce<number>((bestIndex, token) => {
    const tokenIndex = normalizedContent.toLowerCase().indexOf(token);
    if (tokenIndex === -1) return bestIndex;
    if (bestIndex === -1) return tokenIndex;

    return Math.min(bestIndex, tokenIndex);
  }, -1);

  if (firstMatchIndex === -1) return normalizedContent.slice(0, LOCAL_SEARCH_SNIPPET_LENGTH);

  const start = Math.max(0, firstMatchIndex - 80);
  const end = Math.min(normalizedContent.length, start + LOCAL_SEARCH_SNIPPET_LENGTH);

  return normalizedContent.slice(start, end);
};

const countTokenMatches = (value: string, token: string) => {
  const matches = value.match(new RegExp(escapeRegExp(token), 'g'));

  return matches?.length || 0;
};

const computeLocalSearchScore = (content: string, filename: string, tokens: string[]) => {
  const normalizedContent = content.toLowerCase();
  const normalizedFilename = filename.toLowerCase();

  return tokens.reduce((score, token) => {
    const filenameMatches = countTokenMatches(normalizedFilename, token);
    const contentMatches = countTokenMatches(normalizedContent, token);

    return score + filenameMatches * 4 + Math.min(contentMatches, 12);
  }, 0);
};

const buildLocalSearchChunks = (
  item: KnowledgeContentItem,
  score: number,
  tokens: string[],
): FileSearchResult['topChunks'] => {
  const snippets = new Set<string>();
  const normalizedContent = normalizeWhitespace(item.content);

  if (!normalizedContent) return [];

  for (const token of tokens) {
    const snippet = createSnippet(normalizedContent, [token]);
    if (snippet) snippets.add(snippet);
    if (snippets.size >= LOCAL_SEARCH_TOP_CHUNKS) break;
  }

  if (snippets.size === 0) {
    const fallbackSnippet = createSnippet(normalizedContent, tokens);
    if (fallbackSnippet) snippets.add(fallbackSnippet);
  }

  return Array.from(snippets)
    .slice(0, LOCAL_SEARCH_TOP_CHUNKS)
    .map((text, index) => ({
      id: `${item.fileId}-local-${index + 1}`,
      similarity: Math.max(score - index * 0.1, 0.1),
      text,
    }));
};

const formatDocumentContent = (id: string, rawContent?: string | null) => {
  const content = rawContent || '';
  const normalizedContent = normalizeWhitespace(content);

  return {
    content,
    fileId: id,
    preview: normalizedContent
      ? normalizedContent.slice(0, LOCAL_SEARCH_SNIPPET_LENGTH)
      : undefined,
    totalCharCount: content.length,
    totalLineCount: content ? content.split('\n').length : 0,
  };
};

class RAGService {
  parseFileContent = async (id: string, skipExist?: boolean) => {
    return lambdaClient.document.parseFileContent.mutate({ id, skipExist });
  };

  createParseFileTask = async (id: string, skipExist?: boolean) => {
    return lambdaClient.chunk.createParseFileTask.mutate({ id, skipExist });
  };

  retryParseFile = async (id: string) => {
    return lambdaClient.chunk.retryParseFileTask.mutate({ id });
  };

  createEmbeddingChunksTask = async (id: string) => {
    return lambdaClient.chunk.createEmbeddingChunksTask.mutate({ id });
  };

  semanticSearch = async (query: string, fileIds?: string[]) => {
    return lambdaClient.chunk.semanticSearch.mutate({ fileIds, query });
  };

  semanticSearchForChat = async (params: SemanticSearchSchemaType, signal?: AbortSignal) => {
    return lambdaClient.chunk.semanticSearchForChat.mutate(params, { signal });
  };

  getKnowledgeContents = async (
    fileIds: string[],
    signal?: AbortSignal,
  ): Promise<KnowledgeContentItem[]> => {
    const documentIds = fileIds.filter((id) => id.startsWith(DOCUMENT_ID_PREFIX));
    const regularFileIds = fileIds.filter((id) => !id.startsWith(DOCUMENT_ID_PREFIX));

    const [documentContents, fileContents] = await Promise.all([
      Promise.all(
        documentIds.map(async (id): Promise<KnowledgeContentItem> => {
          const document = await documentService.getDocumentById(id);

          if (!document) {
            return {
              content: '',
              error: 'File not found',
              fileId: id,
              filename: `Unknown file ${id}`,
            };
          }

          return {
            ...formatDocumentContent(id, document.content),
            filename: document.title || document.filename || `Unknown file ${id}`,
          };
        }),
      ),
      regularFileIds.length === 0 ? [] : this.getFileContents(regularFileIds, signal),
    ]);

    const items = new Map(
      [...documentContents, ...fileContents].map((item) => [item.fileId, item] as const),
    );

    return fileIds.map(
      (id) =>
        items.get(id) || {
          content: '',
          error: 'File not found',
          fileId: id,
          filename: `Unknown file ${id}`,
        },
    );
  };

  semanticSearchForChatWithFallback = async (
    params: SemanticSearchSchemaType,
    signal?: AbortSignal,
  ): Promise<SemanticSearchForChatClientResult> => {
    try {
      return await this.semanticSearchForChat(params, signal);
    } catch (error) {
      const knowledgeIds = params.knowledgeIds || [];
      const tokens = tokenizeQuery(params.query);

      if (knowledgeIds.length === 0 || tokens.length === 0) throw error;

      const responses = await Promise.all(
        knowledgeIds.map((knowledgeBaseId) =>
          fileService.getKnowledgeItems({
            knowledgeBaseId,
            limit: Math.min(Math.max((params.topK || 20) * 4, 12), LOCAL_SEARCH_MAX_ITEMS),
            offset: 0,
          }),
        ),
      );

      const uniqueIds = Array.from(
        new Set(responses.flatMap((response) => response.items.map((item) => item.id))),
      );

      if (uniqueIds.length === 0) throw error;

      const contents = await this.getKnowledgeContents(uniqueIds, signal);
      const ranked = contents
        .filter((item) => !item.error)
        .map((item) => {
          const score = computeLocalSearchScore(item.content, item.filename, tokens);
          if (score === 0) return null;

          const topChunks = buildLocalSearchChunks(item, score, tokens);

          if (topChunks.length === 0) return null;

          return {
            fileId: item.fileId,
            fileName: item.filename,
            relevanceScore: score,
            topChunks,
          } satisfies FileSearchResult;
        })
        .filter(isFileSearchResult)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, params.topK || 20);

      if (ranked.length === 0) throw error;

      const chunks: ChatSemanticSearchChunk[] = ranked.flatMap((file) =>
        file.topChunks.map((chunk) => ({
          fileId: file.fileId,
          fileName: file.fileName,
          id: chunk.id,
          pageNumber: null,
          similarity: chunk.similarity,
          text: chunk.text,
        })),
      );

      return { chunks, documents: [], fileResults: ranked };
    }
  };

  getFileContents = async (fileIds: string[], signal?: AbortSignal) => {
    return lambdaClient.chunk.getFileContents.mutate({ fileIds }, { signal });
  };

  deleteMessageRagQuery = async (id: string) => {
    return lambdaClient.message.removeMessageQuery.mutate({ id });
  };
}

export const ragService = new RAGService();
