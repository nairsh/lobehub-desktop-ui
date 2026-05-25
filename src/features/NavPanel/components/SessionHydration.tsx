'use client';

import { memo, useEffect } from 'react';
import { createStoreUpdater } from 'zustand-utils';

import { parseAsString, useQueryParam } from '@/hooks/useQueryParam';
import { useChatStore } from '@/store/chat';
import { useSessionStore } from '@/store/session';

const THROTTLE_DELAY = 50;
const getActiveSessionId = (id?: string) =>
  id && (id === 'inbox' || id.startsWith('ssn_')) ? id : undefined;

// sync outside state to useSessionStore
const SessionHydration = memo(() => {
  const useStoreUpdater = createStoreUpdater(useSessionStore);
  const useChatStoreUpdater = createStoreUpdater(useChatStore);
  const [switchTopic] = useChatStore((s) => [s.switchTopic]);

  // two-way bindings the url and session store
  const [session, setSession] = useQueryParam('session', parseAsString.withDefault('inbox'), {
    history: 'replace',
    throttleMs: THROTTLE_DELAY,
  });

  useStoreUpdater('activeId', session);
  useChatStoreUpdater('activeAgentId', session);
  useChatStoreUpdater('activeSessionId', getActiveSessionId(session));

  useEffect(() => {
    const unsubscribe = useSessionStore.subscribe(
      (s) => s.activeId,
      (state) => {
        switchTopic();
        setSession(state);
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return null;
});

export default SessionHydration;
