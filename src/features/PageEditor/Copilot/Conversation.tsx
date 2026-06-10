import { Flexbox } from '@lobehub/ui';
import { createStaticStyles, cssVar } from 'antd-style';
import { FileTextIcon } from 'lucide-react';
import { memo, useEffect, useMemo } from 'react';

import DragUploadZone, { useUploadFiles } from '@/components/DragUploadZone';
import { actionMap } from '@/features/ChatInput/ActionBar/config';
import { ActionBarContext } from '@/features/ChatInput/ActionBar/context';
import {
  ChatInput,
  ChatList,
  conversationSelectors,
  useConversationStore,
} from '@/features/Conversation';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';

import { usePageEditorStore } from '../store';
import CopilotModelSelector from './CopilotModelSelector';
import CopilotHeader from './Header';
import Welcome from './Welcome';

const Upload = actionMap['fileUpload'];
const Params = actionMap['params'];
const STT = actionMap['stt'];

const EMPTY_LEFT_ACTIONS: [] = [];

const COMPACT_ACTION_SIZE = { blockSize: 28, size: 16 };
const COMPACT_CONTEXT_VALUE = { actionSize: COMPACT_ACTION_SIZE };
const COMPACT_ACTION_BAR_STYLE = { paddingLeft: 4, paddingRight: 4 };
const COMPACT_SEND_BUTTON_PROPS = { size: 28 };

const styles = createStaticStyles(({ css }) => ({
  contextChip: css`
    display: inline-flex;
    gap: 5px;
    align-items: center;

    width: fit-content;
    max-width: 220px;
    height: 22px;
    padding-inline: 8px;
    border-radius: 6px;

    font-size: 12px;
    line-height: 1;
    color: ${cssVar.colorTextSecondary};

    background: color-mix(in srgb, ${cssVar.colorText} 6%, transparent);
  `,
  contextChipLabel: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}));

const Conversation = memo(() => {
  const setActiveAgentId = useAgentStore((s) => s.setActiveAgentId);
  const useFetchAgentConfig = useAgentStore((s) => s.useFetchAgentConfig);
  const currentAgentId = useConversationStore(conversationSelectors.agentId);
  const pageTitle = usePageEditorStore((s) => s.title);

  useEffect(() => {
    if (!currentAgentId) return;

    if (useAgentStore.getState().activeAgentId !== currentAgentId) {
      setActiveAgentId(currentAgentId);
    }

    const { activeAgentId, activeTopicId, switchTopic } = useChatStore.getState();

    if (activeAgentId !== currentAgentId) {
      useChatStore.setState({ activeAgentId: currentAgentId });
    }

    // Reset topic on agent/context switch to avoid reusing old topic scope.
    if (activeAgentId !== currentAgentId || !!activeTopicId) {
      void switchTopic(null, { scope: 'page', skipRefreshMessage: true });
    }
  }, [currentAgentId, setActiveAgentId]);

  useFetchAgentConfig(true, currentAgentId);

  const model = useAgentStore((s) => agentByIdSelectors.getAgentModelById(currentAgentId)(s));
  const provider = useAgentStore((s) =>
    agentByIdSelectors.getAgentModelProviderById(currentAgentId)(s),
  );
  const { handleUploadFiles } = useUploadFiles({ model, provider });

  const leftContent = useMemo(
    () => (
      <ActionBarContext value={COMPACT_CONTEXT_VALUE}>
        <Flexbox horizontal align={'center'} gap={2}>
          <Upload />
          <Params />
        </Flexbox>
      </ActionBarContext>
    ),
    [],
  );

  const sendAreaPrefix = useMemo(
    () => (
      <ActionBarContext value={COMPACT_CONTEXT_VALUE}>
        <Flexbox horizontal align={'center'} gap={2}>
          <CopilotModelSelector />
          <STT />
        </Flexbox>
      </ActionBarContext>
    ),
    [],
  );

  return (
    <DragUploadZone
      style={{ flex: 1, height: '100%', minWidth: 300 }}
      onUploadFiles={handleUploadFiles}
    >
      <Flexbox flex={1} height={'100%'}>
        <CopilotHeader />
        <Flexbox flex={1} style={{ overflow: 'hidden' }}>
          <ChatList welcome={<Welcome />} />
        </Flexbox>
        {pageTitle && (
          <Flexbox paddingInline={12} style={{ paddingBottom: 4 }}>
            <span className={styles.contextChip}>
              <FileTextIcon size={12} />
              <span className={styles.contextChipLabel}>{pageTitle}</span>
            </span>
          </Flexbox>
        )}
        <ChatInput
          actionBarStyle={COMPACT_ACTION_BAR_STYLE}
          allowExpand={false}
          leftActions={EMPTY_LEFT_ACTIONS}
          leftContent={leftContent}
          sendAreaPrefix={sendAreaPrefix}
          sendButtonProps={COMPACT_SEND_BUTTON_PROPS}
          showRuntimeConfig={false}
        />
      </Flexbox>
    </DragUploadZone>
  );
});

export default Conversation;
