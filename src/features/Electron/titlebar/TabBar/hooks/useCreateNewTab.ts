'use client';

import { startTransition, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePluginContext } from '@/features/Electron/titlebar/RecentlyViewed/hooks/usePluginContext';
import { pluginRegistry } from '@/features/Electron/titlebar/RecentlyViewed/plugins';
import { useChatStore } from '@/store/chat';
import { useElectronStore } from '@/store/electron';

export const useCreateNewTab = () => {
  const navigate = useNavigate();
  const pluginCtx = usePluginContext();
  const addTab = useElectronStore((s) => s.addTab);

  return useCallback(async () => {
    const reference = pluginRegistry.parseUrl('/', '');
    if (!reference) return;

    const resolved = pluginRegistry.resolve(reference, pluginCtx);
    const cached = resolved ? { title: resolved.title } : undefined;

    useChatStore.getState().switchTopic(null);
    addTab(reference, cached, true);
    pluginRegistry.onActivate(reference);

    if (resolved?.url) startTransition(() => navigate(resolved.url));
  }, [addTab, navigate, pluginCtx]);
};
