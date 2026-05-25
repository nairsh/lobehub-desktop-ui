import { useDebounce } from 'ahooks';
import { useTheme as useNextThemesTheme } from 'next-themes';
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';

import { isDesktop } from '@/const/version';
import { type SearchResult } from '@/database/repositories/search';
import { useCreateNewModal } from '@/features/LibraryModal';
import { useGroupWizard } from '@/layout/GlobalProvider/GroupWizardProvider';
import { lambdaClient } from '@/libs/trpc/client';
import { useCreateMenuItems } from '@/routes/(main)/home/_layout/hooks';
import { electronSystemService } from '@/services/electron/system';
import { topicService } from '@/services/topic';
import { useAgentStore } from '@/store/agent';
import { builtinAgentSelectors } from '@/store/agent/selectors/builtinAgentSelectors';
import { useChatStore } from '@/store/chat';
import { useGlobalStore } from '@/store/global';
import { globalHelpers } from '@/store/global/helpers';
import { useHomeStore } from '@/store/home';
import { mapRecentTopicToRecentChatItem } from '@/store/home/slices/recent/utils';
import { useSessionStore } from '@/store/session';

import { useCommandMenuContext } from './CommandMenuContext';
import { type ThemeMode } from './types';

const COMMAND_MENU_TOPIC_BROWSE_LIMIT = 100;

/**
 * Shared methods for CommandMenu
 */
export const useCommandMenu = () => {
  const [open] = useGlobalStore((s) => [s.status.showCommandMenu]);
  const { t } = useTranslation('chat');
  const {
    mounted,
    onClose,
    search,
    setSearch,
    pages,
    setPages,
    typeFilter,
    setTypeFilter,
    page,
    menuContext: context,
    pathname,
    selectedAgent,
    setSelectedAgent,
    topicBrowse,
  } = useCommandMenuContext();

  const navigate = useNavigate();
  const { setTheme } = useNextThemesTheme();
  const createAgent = useAgentStore((s) => s.createAgent);
  const storeCreateChat = useSessionStore((s) => s.createChat);
  const refreshAgentList = useHomeStore((s) => s.refreshAgentList);
  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const { openGroupWizard } = useGroupWizard();
  const { createGroupWithMembers, createGroupFromTemplate, createPage } = useCreateMenuItems();
  const { open: openCreateLibraryModal } = useCreateNewModal();

  // Extract agentId from pathname when in agent context
  const agentId = useMemo(() => {
    if (context === 'agent') {
      const match = pathname?.match(/^\/agent\/([^/?]+)/);
      return match?.[1] || undefined;
    }
    return undefined;
  }, [context, pathname]);

  // Debounce search input to reduce API calls
  const debouncedSearch = useDebounce(search, { wait: 600 });

  // Search functionality
  const searchQuery = debouncedSearch.trim();
  const hasSearch = search.trim().length > 0;
  const isWaitingForSearch = hasSearch && searchQuery !== search.trim();
  const isTopicBrowseMode = topicBrowse && search.trim().length === 0;

  const { data: searchResults, isLoading: isSearching } = useSWR<SearchResult[]>(
    hasSearch ? ['search', searchQuery, agentId, typeFilter] : null,
    async () => {
      const locale = globalHelpers.getCurrentLanguage();
      return lambdaClient.search.query.query({
        agentId,
        limitPerType: typeFilter ? 50 : 5, // Show more results when filtering by type
        locale,
        query: searchQuery,
        type: typeFilter,
      });
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const { data: browseTopics, isLoading: isBrowsingTopics } = useSWR(
    isTopicBrowseMode ? ['command-menu-topic-browse', COMMAND_MENU_TOPIC_BROWSE_LIMIT] : null,
    async () => {
      const topics = await topicService.getRecentTopics(COMMAND_MENU_TOPIC_BROWSE_LIMIT);

      return topics.map((topic) => mapRecentTopicToRecentChatItem(topic, t('topic.defaultTitle')));
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // Close on Escape key and prevent body scroll
  useEffect(() => {
    if (open) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [open]);

  const closeCommandMenu = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
      onClose();
    },
    [navigate, onClose],
  );

  const handleExternalLink = useCallback(
    async (url: string) => {
      if (isDesktop) {
        await electronSystemService.openExternalLink(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      onClose();
    },
    [onClose],
  );

  const handleThemeChange = useCallback(
    (theme: ThemeMode) => {
      setTheme(theme);
      onClose();
    },
    [setTheme, onClose],
  );

  const handleAskLobeAI = useCallback(() => {
    // Navigate to inbox agent with the message query parameter
    if (inboxAgentId && search.trim()) {
      const message = encodeURIComponent(search.trim());
      navigate(`/agent/${inboxAgentId}?message=${message}`);
      onClose();
    }
  }, [inboxAgentId, search, navigate, onClose]);

  const handleAIPainting = useCallback(() => {
    // Navigate to painting page with search as prompt
    if (search.trim()) {
      const prompt = encodeURIComponent(search.trim());
      navigate(`/image?prompt=${prompt}`);
      onClose();
    }
  }, [search, navigate, onClose]);

  const handleBack = useCallback(() => {
    setPages((prev) => prev.slice(0, -1));
  }, [setPages]);

  const handleSendToSelectedAgent = useCallback(() => {
    if (selectedAgent && search.trim()) {
      const message = encodeURIComponent(search.trim());
      navigate(`/agent/${selectedAgent.id}?message=${message}`);
      setSelectedAgent(undefined);
      onClose();
    }
  }, [selectedAgent, search, navigate, setSelectedAgent, onClose]);

  const handleCreateSession = useCallback(async () => {
    const sessionId = await storeCreateChat({}, false);
    await refreshAgentList();
    navigate(`/agent/${sessionId}`);
    onClose();
  }, [storeCreateChat, refreshAgentList, navigate, onClose]);

  const openNewTopicOrSaveTopic = useChatStore((s) => s.openNewTopicOrSaveTopic);

  const handleCreateTopic = useCallback(() => {
    openNewTopicOrSaveTopic();
    onClose();
  }, [openNewTopicOrSaveTopic, onClose]);

  const handleCreateLibrary = useCallback(() => {
    onClose();
    openCreateLibraryModal({
      onSuccess: (id) => {
        navigate(`/resource/library/${id}`);
      },
    });
  }, [onClose, openCreateLibraryModal, navigate]);

  const handleCreatePage = useCallback(async () => {
    await createPage();
    onClose();
  }, [createPage, onClose]);

  const handleCreateAgentTeam = useCallback(() => {
    onClose();
    openGroupWizard({
      onCreateCustom: async (selectedAgents) => {
        await createGroupWithMembers(selectedAgents);
      },
      onCreateFromTemplate: async (templateId, selectedMemberTitles) => {
        await createGroupFromTemplate(templateId, selectedMemberTitles);
      },
    });
  }, [onClose, openGroupWizard, createGroupWithMembers, createGroupFromTemplate]);

  return {
    closeCommandMenu,
    handleAIPainting,
    handleAskLobeAI,
    handleBack,
    handleCreateAgentTeam,
    handleCreateLibrary,
    handleCreatePage,
    handleCreateSession,
    handleCreateTopic,
    handleExternalLink,
    handleNavigate,
    handleSendToSelectedAgent,
    handleThemeChange,
    hasSearch,
    browseTopics: browseTopics || [],
    isBrowsingTopics,
    isTopicBrowseMode,
    isSearching,
    isWaitingForSearch,
    mounted,
    open,
    page,
    pages,
    pathname,
    search,
    searchQuery,
    searchResults: searchResults || ([] as SearchResult[]),
    selectedAgent,
    setSearch,
    setSelectedAgent,
    setTypeFilter,
    typeFilter,
  };
};
