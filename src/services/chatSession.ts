import { lambdaClient } from '@/libs/trpc/client';
import { type KnowledgeItem } from '@/types/knowledgeBase';

export interface CreateChatParams {
  config?: {
    chatConfig?: Record<string, unknown>;
    model?: string;
    params?: Record<string, unknown>;
    plugins?: string[];
    provider?: string;
    systemRole?: string;
  };
  groupId?: string;
  projectId?: string;
}

export interface CreateChatResult {
  sessionId: string;
}

export type ChatConfigUpdate = NonNullable<CreateChatParams['config']>;

class ChatSessionService {
  private client = lambdaClient as any;

  /**
   * Create a new chat session without a dedicated agent record.
   * Phase 1 replacement for the deprecated SessionService.createSession path.
   */
  createChat = async (params: CreateChatParams = {}): Promise<CreateChatResult> => {
    return this.client.chat.createChat.mutate(params);
  };

  getChatConfig = async (sessionId: string) => {
    return this.client.chat.getChatConfig.query({ sessionId });
  };

  getKnowledgeBasesAndFiles = async (sessionId: string): Promise<KnowledgeItem[]> => {
    return this.client.chat.getKnowledgeBasesAndFiles.query({ sessionId });
  };

  updateChatConfig = async (sessionId: string, config: ChatConfigUpdate) => {
    return this.client.chat.updateChatConfig.mutate({ config: config as any, sessionId });
  };

  createChatFiles = async (sessionId: string, fileIds: string[], enabled?: boolean) => {
    return this.client.chat.createChatFiles.mutate({ enabled, fileIds, sessionId });
  };

  deleteChatFile = async (sessionId: string, fileId: string) => {
    return this.client.chat.deleteChatFile.mutate({ fileId, sessionId });
  };

  toggleFile = async (sessionId: string, fileId: string, enabled?: boolean) => {
    return this.client.chat.toggleFile.mutate({ enabled, fileId, sessionId });
  };

  createChatKnowledgeBase = async (
    sessionId: string,
    knowledgeBaseId: string,
    enabled?: boolean,
  ) => {
    return this.client.chat.createChatKnowledgeBase.mutate({
      enabled,
      knowledgeBaseId,
      sessionId,
    });
  };

  deleteChatKnowledgeBase = async (sessionId: string, knowledgeBaseId: string) => {
    return this.client.chat.deleteChatKnowledgeBase.mutate({ knowledgeBaseId, sessionId });
  };

  toggleKnowledgeBase = async (sessionId: string, knowledgeBaseId: string, enabled?: boolean) => {
    return this.client.chat.toggleKnowledgeBase.mutate({ enabled, knowledgeBaseId, sessionId });
  };
}

export const chatSessionService = new ChatSessionService();
