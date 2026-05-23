import { type KnowledgeItem } from '@lobechat/types';
import { type SWRResponse } from 'swr';

import { mutate, useClientDataSWR } from '@/libs/swr';
import { agentService } from '@/services/agent';
import { chatSessionService } from '@/services/chatSession';
import { type StoreSetter } from '@/store/types';

import { type AgentStore } from '../../store';

const FETCH_AGENT_KNOWLEDGE_KEY = 'FETCH_AGENT_KNOWLEDGE';
const isNormalChatSessionId = (id: string) => id.startsWith('ssn_');

/**
 * Knowledge Slice Actions
 * Handles knowledge base and file operations
 */

type Setter = StoreSetter<AgentStore>;
export const createKnowledgeSlice = (set: Setter, get: () => AgentStore, _api?: unknown) =>
  new KnowledgeSliceActionImpl(set, get, _api);

export class KnowledgeSliceActionImpl {
  readonly #get: () => AgentStore;

  constructor(set: Setter, get: () => AgentStore, _api?: unknown) {
    void _api;
    void set;
    this.#get = get;
  }

  addFilesToAgent = async (fileIds: string[], enabled?: boolean): Promise<void> => {
    const { activeAgentId, internal_refreshAgentConfig, internal_refreshAgentKnowledge } =
      this.#get();
    if (!activeAgentId) return;
    if (fileIds.length === 0) return;

    if (isNormalChatSessionId(activeAgentId)) {
      await chatSessionService.createChatFiles(activeAgentId, fileIds, enabled);
    } else {
      await agentService.createAgentFiles(activeAgentId, fileIds, enabled);
    }
    await internal_refreshAgentConfig(activeAgentId);
    await internal_refreshAgentKnowledge();
  };

  addKnowledgeBaseToAgent = async (knowledgeBaseId: string): Promise<void> => {
    const { activeAgentId, internal_refreshAgentConfig, internal_refreshAgentKnowledge } =
      this.#get();
    if (!activeAgentId) return;

    if (isNormalChatSessionId(activeAgentId)) {
      await chatSessionService.createChatKnowledgeBase(activeAgentId, knowledgeBaseId, true);
    } else {
      await agentService.createAgentKnowledgeBase(activeAgentId, knowledgeBaseId, true);
    }
    await internal_refreshAgentConfig(activeAgentId);
    await internal_refreshAgentKnowledge();
  };

  internal_refreshAgentKnowledge = async (): Promise<void> => {
    await mutate([FETCH_AGENT_KNOWLEDGE_KEY, this.#get().activeAgentId]);
  };

  removeFileFromAgent = async (fileId: string): Promise<void> => {
    const { activeAgentId, internal_refreshAgentConfig, internal_refreshAgentKnowledge } =
      this.#get();
    if (!activeAgentId) return;

    if (isNormalChatSessionId(activeAgentId)) {
      await chatSessionService.deleteChatFile(activeAgentId, fileId);
    } else {
      await agentService.deleteAgentFile(activeAgentId, fileId);
    }
    await internal_refreshAgentConfig(activeAgentId);
    await internal_refreshAgentKnowledge();
  };

  removeKnowledgeBaseFromAgent = async (knowledgeBaseId: string): Promise<void> => {
    const { activeAgentId, internal_refreshAgentConfig, internal_refreshAgentKnowledge } =
      this.#get();
    if (!activeAgentId) return;

    if (isNormalChatSessionId(activeAgentId)) {
      await chatSessionService.deleteChatKnowledgeBase(activeAgentId, knowledgeBaseId);
    } else {
      await agentService.deleteAgentKnowledgeBase(activeAgentId, knowledgeBaseId);
    }
    await internal_refreshAgentConfig(activeAgentId);
    await internal_refreshAgentKnowledge();
  };

  toggleFile = async (id: string, open?: boolean): Promise<void> => {
    const { activeAgentId, internal_refreshAgentConfig } = this.#get();
    if (!activeAgentId) return;

    if (isNormalChatSessionId(activeAgentId)) {
      await chatSessionService.toggleFile(activeAgentId, id, open);
    } else {
      await agentService.toggleFile(activeAgentId, id, open);
    }
    await internal_refreshAgentConfig(activeAgentId);
  };

  toggleKnowledgeBase = async (id: string, open?: boolean): Promise<void> => {
    const { activeAgentId, internal_refreshAgentConfig } = this.#get();
    if (!activeAgentId) return;

    if (isNormalChatSessionId(activeAgentId)) {
      await chatSessionService.toggleKnowledgeBase(activeAgentId, id, open);
    } else {
      await agentService.toggleKnowledgeBase(activeAgentId, id, open);
    }
    await internal_refreshAgentConfig(activeAgentId);
  };

  useFetchFilesAndKnowledgeBases = (agentId?: string): SWRResponse<KnowledgeItem[]> => {
    return useClientDataSWR<KnowledgeItem[]>(
      agentId ? [FETCH_AGENT_KNOWLEDGE_KEY, agentId] : null,
      ([, id]: string[]) =>
        isNormalChatSessionId(id)
          ? chatSessionService.getKnowledgeBasesAndFiles(id)
          : agentService.getFilesAndKnowledgeBases(id),
      {
        fallbackData: [],
      },
    );
  };
}

export type KnowledgeSliceAction = Pick<KnowledgeSliceActionImpl, keyof KnowledgeSliceActionImpl>;
