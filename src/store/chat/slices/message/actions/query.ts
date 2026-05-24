import { parse } from '@lobechat/conversation-flow';
import { type ConversationContext, type UIChatMessage } from '@lobechat/types';
import isEqual from 'fast-deep-equal';
import { type SWRResponse } from 'swr';

import { mutate, useClientDataSWRWithSync } from '@/libs/swr';
import { messageService } from '@/services/message';
import { type ChatStore } from '@/store/chat/store';
import { type StoreSetter } from '@/store/types';

import { type MessageMapKeyInput } from '../../../utils/messageMapKey';
import { messageMapKey } from '../../../utils/messageMapKey';

const SWR_USE_FETCH_MESSAGES = 'SWR_USE_FETCH_MESSAGES';
const isSessionOwnedChatId = (id?: string | null) =>
  !!id && (id === 'inbox' || id.startsWith('ssn_'));

/**
 * Data query and synchronization actions
 * Handles fetching, refreshing, and replacing message data
 */

type Setter = StoreSetter<ChatStore>;
export const messageQuery = (set: Setter, get: () => ChatStore, _api?: unknown) =>
  new MessageQueryActionImpl(set, get, _api);

export class MessageQueryActionImpl {
  readonly #get: () => ChatStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => ChatStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  refreshMessages = async (context?: Partial<ConversationContext>): Promise<void> => {
    const agentId =
      context?.agentId ?? (this.#get().activeGroupAgentId || this.#get().activeSessionId);
    const activeSessionId = this.#get().activeSessionId;
    const sessionId =
      context?.sessionId ??
      (!context?.groupId && isSessionOwnedChatId(activeSessionId) ? activeSessionId : undefined);
    const topicId = context?.topicId !== undefined ? context.topicId : this.#get().activeTopicId;
    // TODO: Support threadId refresh when needed
    await mutate([SWR_USE_FETCH_MESSAGES, agentId, sessionId, topicId, 'session']);
    await mutate([SWR_USE_FETCH_MESSAGES, agentId, topicId, 'group']);
  };

  replaceMessages = (
    messages: UIChatMessage[],
    params?: {
      action?: any;

      context?: Partial<ConversationContext>;

      operationId?: string;
    },
  ): void => {
    let ctx: MessageMapKeyInput;

    // Priority 1: Use explicit context if provided (preserving scope)
    if (params?.context) {
      ctx = {
        agentId:
          params.context.agentId ?? (this.#get().activeGroupAgentId || this.#get().activeSessionId),
        // Preserve groupId from context
        groupId: params.context.groupId,
        // Preserve scope from context
        isNew: params.context.isNew,

        scope: params.context.scope,
        sessionId: params.context.sessionId,

        threadId: params.context.threadId,
        topicId:
          params.context.topicId !== undefined ? params.context.topicId : this.#get().activeTopicId,
      };
    }
    // Priority 2: Get full context from operation if operationId is provided (deprecated)
    else if (params?.operationId) {
      ctx = this.#get().internal_getConversationContext(params);
    }
    // Priority 3: Fallback to global state
    else {
      ctx = {
        agentId: this.#get().activeGroupAgentId || this.#get().activeSessionId,
        groupId: this.#get().activeGroupId,
        sessionId: this.#get().activeSessionId,
        threadId: this.#get().activeThreadId,
        topicId: this.#get().activeTopicId,
      };
    }

    const messagesKey = messageMapKey(ctx);

    // Get raw messages from dbMessagesMap and apply reducer
    const nextDbMap = { ...this.#get().dbMessagesMap, [messagesKey]: messages };

    if (isEqual(nextDbMap, this.#get().dbMessagesMap)) return;

    // Parse messages using conversation-flow
    const { flatList } = parse(messages);

    this.#set(
      {
        // Store raw messages from backend
        dbMessagesMap: nextDbMap,
        // Store parsed messages for display
        messagesMap: { ...this.#get().messagesMap, [messagesKey]: flatList },
      },
      false,
      params?.action ?? 'replaceMessages',
    );
  };

  useFetchMessages = (
    context: ConversationContext,
    skipFetch?: boolean,
  ): SWRResponse<UIChatMessage[]> => {
    // Skip fetch when skipFetch is true or required fields are missing
    const shouldFetch = !skipFetch && !!(context.agentId || context.sessionId) && !!context.topicId;

    return useClientDataSWRWithSync<UIChatMessage[]>(
      shouldFetch ? ['CHAT_STORE_FETCH_MESSAGES', context] : null,
      () => messageService.getMessages(context),
      {
        onData: (data) => {
          if (!data || !context.topicId) return;

          // Use replaceMessages to store the fetched messages
          this.#get().replaceMessages(data, { action: 'useFetchMessages', context });
        },
      },
    );
  };
}

export type MessageQueryAction = Pick<MessageQueryActionImpl, keyof MessageQueryActionImpl>;
