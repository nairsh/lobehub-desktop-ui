'use client';

import { INBOX_SESSION_ID } from '@lobechat/const';
import { createGlobalStyle } from 'antd-style';
import { HotkeysProvider } from 'react-hotkeys-hook';

import FloatingChat from '@/features/FloatingChat';
import { useAgentStore } from '@/store/agent';
import { builtinAgentSelectors } from '@/store/agent/selectors';
import { HotkeyScopeEnum } from '@/types/hotkey';

// The floating window is a transparent OS window; clear the desktop layer
// background that GlobalStyle paints on <body> so only the pill/card shows.
const FloatingWindowStyle = createGlobalStyle`
  html.desktop body,
  #root {
    background: transparent !important;
  }
`;

const DesktopFloatingChat = () => {
  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const useInitBuiltinAgent = useAgentStore((s) => s.useInitBuiltinAgent);

  useInitBuiltinAgent(INBOX_SESSION_ID);

  if (!activeAgentId && !inboxAgentId) return null;

  return (
    <HotkeysProvider initiallyActiveScopes={[HotkeyScopeEnum.Global]}>
      <FloatingWindowStyle />
      <FloatingChat standalone />
    </HotkeysProvider>
  );
};

export default DesktopFloatingChat;
