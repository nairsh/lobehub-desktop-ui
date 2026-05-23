import { lambdaClient } from '@/libs/trpc/client';

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

  updateChatConfig = async (sessionId: string, config: ChatConfigUpdate) => {
    return this.client.chat.updateChatConfig.mutate({ config: config as any, sessionId });
  };
}

export const chatSessionService = new ChatSessionService();
