import { SESSION_CHAT_URL } from '@lobechat/const';
import { useCallback } from 'react';

import type { SendButtonHandler } from '@/features/ChatInput/store/initialState';
import { useQueryRoute } from '@/hooks/useQueryRoute';
import { useAgentStore } from '@/store/agent';
import { builtinAgentSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { fileChatSelectors, useFileStore } from '@/store/file';
import { useHomeStore } from '@/store/home';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';
import type { ModelCouncilSettings } from '@/types/modelCouncil';

export const useSend = () => {
  const router = useQueryRoute();
  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const clearChatUploadFileList = useFileStore((s) => s.clearChatUploadFileList);
  const clearChatContextSelections = useFileStore((s) => s.clearChatContextSelections);

  const homeInputLoading = useHomeStore((s) => s.homeInputLoading);
  const councilSettings = useUserStore(
    (s) =>
      (settingsSelectors.currentSettings(s) as any).modelCouncil as
        | ModelCouncilSettings
        | undefined,
  );
  const councilReady =
    !!councilSettings?.enabled &&
    (councilSettings?.councilModels?.length || 0) >= 2 &&
    !!councilSettings?.judgeModel;

  const send = useCallback<SendButtonHandler>(
    async ({ councilMode, getEditorData, getMarkdownContent }) => {
      const { mainInputEditor } = useChatStore.getState();
      const inputMessage = getMarkdownContent?.() ?? '';
      const editorData = getEditorData?.() ?? mainInputEditor?.getJSONState();
      const fileList = fileChatSelectors.chatUploadFileList(useFileStore.getState());
      const contextList = fileChatSelectors.chatContextSelections(useFileStore.getState());
      const { sendAsAgent, sendAsGroup, sendAsWrite, sendAsResearch, inputActiveMode } =
        useHomeStore.getState();

      // Require input content (except for default inbox which can have files/context)
      if (!inputMessage && fileList.length === 0 && contextList.length === 0) return;

      try {
        switch (inputActiveMode) {
          case 'agent': {
            await sendAsAgent({ editorData, message: inputMessage });
            break;
          }

          case 'group': {
            await sendAsGroup({ editorData, message: inputMessage });
            break;
          }

          case 'write': {
            await sendAsWrite({ editorData, message: inputMessage });
            break;
          }

          case 'research': {
            await sendAsResearch(inputMessage);
            break;
          }

          default: {
            // Default inbox behavior
            if (!inboxAgentId) return;

            const result = await sendMessage({
              context: { agentId: inboxAgentId },
              contexts: contextList,
              editorData,
              files: fileList,
              message: inputMessage,
              overrideCouncil: councilMode && councilReady ? councilSettings : undefined,
              useModelCouncil: councilMode && councilReady,
            });

            router.push(
              `${SESSION_CHAT_URL(inboxAgentId, false)}${
                result?.topicId ? `?topic=${result.topicId}` : ''
              }`,
            );
          }
        }
      } finally {
        // Clear input and files after send
        clearChatUploadFileList();
        clearChatContextSelections();
        mainInputEditor?.clearContent();
      }
    },
    [
      inboxAgentId,
      sendMessage,
      councilReady,
      councilSettings,
      clearChatContextSelections,
      clearChatUploadFileList,
      router,
    ],
  );

  return {
    inboxAgentId,
    loading: homeInputLoading,
    send,
  };
};
