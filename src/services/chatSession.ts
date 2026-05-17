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
  /**
   * Create a new chat session without a dedicated agent record.
   * Phase 1 replacement for the deprecated SessionService.createSession path.
   */
  createChat = async (params: CreateChatParams = {}): Promise<CreateChatResult> => {
    return lambdaClient.chat.createChat.mutate(params);
  };

  getChatConfig = async (sessionId: string) => {
    return lambdaClient.chat.getChatConfig.query({ sessionId });
  };

  updateChatConfig = async (sessionId: string, config: ChatConfigUpdate) => {
    return lambdaClient.chat.updateChatConfig.mutate({ config: config as any, sessionId });
  };
}

export const chatSessionService = new ChatSessionService();
