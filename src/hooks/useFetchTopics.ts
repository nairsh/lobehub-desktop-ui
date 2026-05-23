import { useAgentStore } from '@/store/agent';
import { builtinAgentSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

const isSessionOwnedChatId = (id?: string | null) =>
  !!id && (id === 'inbox' || id.startsWith('ssn_'));

/**
 * Fetch topics for the current session (agent or group)
 */
export const useFetchTopics = (options?: { excludeTriggers?: string[] }) => {
  const isInbox = useAgentStore(builtinAgentSelectors.isInboxAgent);
  const [activeAgentId, activeGroupId, activeSessionId, useFetchTopicsHook] = useChatStore((s) => [
    s.activeAgentId,
    s.activeGroupId,
    s.activeSessionId,
    s.useFetchTopics,
  ]);

  const topicPageSize = useGlobalStore(systemStatusSelectors.topicPageSize);

  // If in group session, use groupId; otherwise use agentId
  const { isValidating, data } = useFetchTopicsHook(true, {
    agentId: activeAgentId,
    ...(options?.excludeTriggers && options.excludeTriggers.length > 0
      ? { excludeTriggers: options.excludeTriggers }
      : {}),
    groupId: activeGroupId,
    isInbox: activeGroupId ? false : isInbox,
    pageSize: topicPageSize,
    sessionId:
      !activeGroupId && isSessionOwnedChatId(activeSessionId) ? activeSessionId : undefined,
  });

  return {
    // isRevalidating: has cached data, updating in background
    isRevalidating: isValidating && !!data,
  };
};
