'use client';

import { HotkeysProvider } from 'react-hotkeys-hook';
import { Navigate } from 'react-router-dom';

import FloatingChat from '@/features/FloatingChat';
import { useAgentStore } from '@/store/agent';
import { builtinAgentSelectors } from '@/store/agent/selectors';
import { HotkeyScopeEnum } from '@/types/hotkey';

const DesktopFloatingChat = () => {
  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);

  if (!activeAgentId && !inboxAgentId) return <Navigate replace to="/desktop-onboarding" />;

  return (
    <HotkeysProvider initiallyActiveScopes={[HotkeyScopeEnum.Global]}>
      <FloatingChat standalone />
    </HotkeysProvider>
  );
};

export default DesktopFloatingChat;
