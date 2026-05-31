'use client';

import { INBOX_SESSION_ID } from '@lobechat/const';
import { HotkeysProvider } from 'react-hotkeys-hook';

import FloatingChat from '@/features/FloatingChat';
import { useAgentStore } from '@/store/agent';
import { builtinAgentSelectors } from '@/store/agent/selectors';
import { HotkeyScopeEnum } from '@/types/hotkey';

const DesktopFloatingChat = () => {
  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const useInitBuiltinAgent = useAgentStore((s) => s.useInitBuiltinAgent);

  useInitBuiltinAgent(INBOX_SESSION_ID);

  if (!activeAgentId && !inboxAgentId) return null;

  return (
    <HotkeysProvider initiallyActiveScopes={[HotkeyScopeEnum.Global]}>
      <FloatingChat standalone />
    </HotkeysProvider>
  );
};

export default DesktopFloatingChat;
