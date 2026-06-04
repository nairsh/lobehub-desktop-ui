'use client';

import { nanoid } from '@lobechat/utils';
import { startTransition, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePluginContext } from '@/features/Electron/titlebar/RecentlyViewed/hooks/usePluginContext';
import { pluginRegistry } from '@/features/Electron/titlebar/RecentlyViewed/plugins';
import { type PageReference } from '@/features/Electron/titlebar/RecentlyViewed/types';
import { useChatStore } from '@/store/chat';
import { useElectronStore } from '@/store/electron';

export const useCreateNewTab = () => {
  const navigate = useNavigate();
  const pluginCtx = usePluginContext();
  const addTab = useElectronStore((s) => s.addTab);

  return useCallback(async () => {
    const base = pluginRegistry.parseUrl('/', '');
    if (!base) return;

    // Home tabs share a constant id ("home"), so addTab would dedupe them and
    // the "+" button could never open a second one. Give each new tab a unique
    // id so it always opens a fresh tab.
    const reference: PageReference = { ...base, id: `${base.id}-${nanoid()}` };

    const resolved = pluginRegistry.resolve(reference, pluginCtx);
    const cached = resolved ? { title: resolved.title } : undefined;

    useChatStore.getState().switchTopic(null);
    addTab(reference, cached, true);
    pluginRegistry.onActivate(reference);

    if (resolved?.url) startTransition(() => navigate(resolved.url));
  }, [addTab, navigate, pluginCtx]);
};
