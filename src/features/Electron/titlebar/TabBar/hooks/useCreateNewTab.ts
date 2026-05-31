'use client';

import { SESSION_CHAT_URL } from '@lobechat/const';
import { startTransition, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePluginContext } from '@/features/Electron/titlebar/RecentlyViewed/hooks/usePluginContext';
import { pluginRegistry } from '@/features/Electron/titlebar/RecentlyViewed/plugins';
import { buildAgentNewTopicAction } from '@/features/Electron/titlebar/RecentlyViewed/plugins/newTabHelpers';
import { useAgentStore } from '@/store/agent';
import { builtinAgentSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { useElectronStore } from '@/store/electron';

export const useCreateNewTab = () => {
  const navigate = useNavigate();
  const pluginCtx = usePluginContext();
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const addTab = useElectronStore((s) => s.addTab);

  return useCallback(async () => {
    const { activeTabId, tabs } = useElectronStore.getState();
    const activeReference = activeTabId ? tabs.find((t) => t.id === activeTabId) : undefined;
    const action = activeReference
      ? pluginRegistry.getNewTabAction(activeReference, pluginCtx)
      : null;

    const fallbackAgentId = activeAgentId || inboxAgentId;
    const result =
      (action ? await action.onCreate() : null) ??
      (fallbackAgentId
        ? await buildAgentNewTopicAction(fallbackAgentId, pluginCtx)?.onCreate()
        : null);

    if (!result) {
      if (fallbackAgentId) {
        useChatStore.getState().switchTopic(null);
        startTransition(() => navigate(SESSION_CHAT_URL(fallbackAgentId, false)));
      }
      return;
    }

    const { reference, cached } = result;
    addTab(reference, cached, true);
    pluginRegistry.onActivate(reference);

    const resolved = pluginRegistry.resolve(reference, pluginCtx);
    if (resolved?.url) startTransition(() => navigate(resolved.url));
  }, [activeAgentId, addTab, inboxAgentId, navigate, pluginCtx]);
};
