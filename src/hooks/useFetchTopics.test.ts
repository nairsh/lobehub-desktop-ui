import { INBOX_SESSION_ID } from '@lobechat/const';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useFetchTopics } from './useFetchTopics';

// Mock store dependencies
const mockUseGlobalStore = vi.hoisted(() => vi.fn());
const mockUseChatStore = vi.hoisted(() => vi.fn());
const mockUseAgentStore = vi.hoisted(() => vi.fn());

vi.mock('@/store/chat', () => ({
  useChatStore: mockUseChatStore,
}));

vi.mock('@/store/global', () => ({
  useGlobalStore: mockUseGlobalStore,
}));

vi.mock('@/store/agent', () => ({
  useAgentStore: mockUseAgentStore,
}));

vi.mock('@/store/agent/selectors', () => ({
  builtinAgentSelectors: {
    isInboxAgent: vi.fn((s) => s.isInboxAgent),
  },
}));

vi.mock('@/store/global/selectors', () => ({
  systemStatusSelectors: {
    topicPageSize: vi.fn((s) => s.topicPageSize),
  },
}));

describe('useFetchTopics', () => {
  const mockUseFetchTopicsFn = vi.fn().mockReturnValue({ isValidating: false, data: [] });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFetchTopicsFn.mockReturnValue({ isValidating: false, data: [] });
    mockUseGlobalStore.mockImplementation((selector) => selector({ topicPageSize: 20 }));
    // Default: not inbox agent
    mockUseAgentStore.mockImplementation((selector) => selector({ isInboxAgent: false }));
  });

  it('should fetch topics with agentId when no groupId is active', () => {
    const activeAgentId = 'ssn_chat_123';

    mockUseChatStore.mockImplementation((selector) =>
      selector({
        activeAgentId,
        activeSessionId: activeAgentId,
        activeGroupId: undefined,
        useFetchTopics: mockUseFetchTopicsFn,
      }),
    );

    renderHook(() => useFetchTopics());

    expect(mockUseFetchTopicsFn).toHaveBeenCalledWith(true, {
      agentId: activeAgentId,
      groupId: undefined,
      isInbox: false,
      pageSize: 20,
      sessionId: activeAgentId,
    });
  });

  it('should fetch topics with groupId when group session is active', () => {
    const activeAgentId = 'agent-123';
    const activeGroupId = 'group-456';

    mockUseChatStore.mockImplementation((selector) =>
      selector({
        activeAgentId,
        activeSessionId: undefined,
        activeGroupId,
        useFetchTopics: mockUseFetchTopicsFn,
      }),
    );

    renderHook(() => useFetchTopics());

    expect(mockUseFetchTopicsFn).toHaveBeenCalledWith(true, {
      agentId: activeAgentId,
      groupId: activeGroupId,
      isInbox: false,
      pageSize: 20,
    });
  });

  it('should set isInbox to false when groupId is present even if agentId is inbox', () => {
    const activeGroupId = 'group-789';

    // Even if isInboxAgent is true, groupId takes precedence
    mockUseAgentStore.mockImplementation((selector) => selector({ isInboxAgent: true }));

    mockUseChatStore.mockImplementation((selector) =>
      selector({
        activeAgentId: INBOX_SESSION_ID,
        activeSessionId: INBOX_SESSION_ID,
        activeGroupId,
        useFetchTopics: mockUseFetchTopicsFn,
      }),
    );

    renderHook(() => useFetchTopics());

    expect(mockUseFetchTopicsFn).toHaveBeenCalledWith(true, {
      agentId: INBOX_SESSION_ID,
      groupId: activeGroupId,
      isInbox: false,
      pageSize: 20,
      sessionId: undefined,
    });
  });

  it('should pass isInbox true when agentId is inbox and no groupId', () => {
    // Set isInboxAgent to true for this test
    mockUseAgentStore.mockImplementation((selector) => selector({ isInboxAgent: true }));

    mockUseChatStore.mockImplementation((selector) =>
      selector({
        activeAgentId: INBOX_SESSION_ID,
        activeSessionId: INBOX_SESSION_ID,
        activeGroupId: undefined,
        useFetchTopics: mockUseFetchTopicsFn,
      }),
    );

    renderHook(() => useFetchTopics());

    expect(mockUseFetchTopicsFn).toHaveBeenCalledWith(true, {
      agentId: INBOX_SESSION_ID,
      groupId: undefined,
      isInbox: true,
      pageSize: 20,
      sessionId: INBOX_SESSION_ID,
    });
  });

  it('should use topicPageSize from global store', () => {
    const customPageSize = 50;

    mockUseChatStore.mockImplementation((selector) =>
      selector({
        activeAgentId: 'agent-1',
        activeSessionId: undefined,
        activeGroupId: undefined,
        useFetchTopics: mockUseFetchTopicsFn,
      }),
    );
    mockUseGlobalStore.mockImplementation((selector) =>
      selector({ topicPageSize: customPageSize }),
    );

    renderHook(() => useFetchTopics());

    expect(mockUseFetchTopicsFn).toHaveBeenCalledWith(true, {
      agentId: 'agent-1',
      groupId: undefined,
      isInbox: false,
      pageSize: customPageSize,
      sessionId: undefined,
    });
  });
});
