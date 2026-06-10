'use client';

import {
  ActionIcon,
  Avatar,
  type DropdownItem,
  DropdownMenu,
  Flexbox,
  Icon,
  Popover,
  Text,
} from '@lobehub/ui';
import { App } from 'antd';
import { createStaticStyles, cssVar } from 'antd-style';
import {
  ChevronDownIcon,
  MessageSquarePlusIcon,
  MinusIcon,
  MoreHorizontalIcon,
  PanelRightCloseIcon,
  PictureInPicture2Icon,
  ShareIcon,
  Trash2Icon,
} from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_INBOX_AVATAR } from '@/const/index';
import { DESKTOP_HEADER_ICON_SIZE } from '@/const/layoutTokens';
import { conversationSelectors, useConversationStore } from '@/features/Conversation';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { topicSelectors } from '@/store/chat/slices/topic/selectors';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

import TopicItem from './TopicSelector/TopicItem';

const styles = createStaticStyles(({ css }) => ({
  title: css`
    cursor: pointer;

    display: inline-flex;
    gap: 4px;
    align-items: center;

    height: 28px;
    padding-inline: 6px;
    border-radius: 6px;

    &:hover {
      background: ${cssVar.colorFillTertiary};
    }
  `,
  titleChevron: css`
    color: ${cssVar.colorTextQuaternary};
  `,
  titleText: css`
    max-width: 200px;
    font-size: 14px;
    font-weight: 600;
  `,
}));

const CopilotHeader = memo(() => {
  const { t } = useTranslation(['chat', 'topic']);
  const { message } = App.useApp();
  const [topicPopoverOpen, setTopicPopoverOpen] = useState(false);

  const agentId = useConversationStore(conversationSelectors.agentId);
  const agent = useAgentStore(agentByIdSelectors.getAgentConfigById(agentId));
  const hasMessages = useConversationStore((s) => s.displayMessages.length > 0);

  useChatStore((s) => s.useFetchTopics)(true, { agentId });
  const [activeTopicId, switchTopic, topics] = useChatStore((s) => [
    s.activeTopicId,
    s.switchTopic,
    topicSelectors.currentTopics(s),
  ]);
  const currentTopic = useChatStore(topicSelectors.currentActiveTopic);
  const clearMessage = useChatStore((s) => s.clearMessage);

  const [panelMode, toggleRightPanel, updateSystemStatus] = useGlobalStore((s) => [
    systemStatusSelectors.pageAiPanelMode(s),
    s.toggleRightPanel,
    s.updateSystemStatus,
  ]);

  const isLoadingTopics = topics === undefined;
  const hasTopics = !isLoadingTopics && topics.length > 0;
  const title = currentTopic?.title || t('pageCopilot.newChat');

  const newChat = () => switchTopic(null, { scope: 'page' });
  const toggleDock = () =>
    updateSystemStatus({ pageAiPanelMode: panelMode === 'docked' ? 'floating' : 'docked' });

  const moreItems: DropdownItem[] = [
    {
      icon: <Icon icon={panelMode === 'docked' ? PictureInPicture2Icon : PanelRightCloseIcon} />,
      key: 'dock',
      label: panelMode === 'docked' ? t('pageCopilot.float') : t('pageCopilot.dock'),
      onClick: toggleDock,
    },
    {
      danger: true,
      icon: <Icon icon={Trash2Icon} />,
      key: 'clear',
      label: t('pageCopilot.clear'),
      onClick: () => clearMessage(),
    },
  ];

  return (
    <Flexbox
      data-copilot-drag-handle
      horizontal
      align={'center'}
      justify={'space-between'}
      paddingBlock={6}
      paddingInline={8}
      style={{ cursor: 'grab', flex: 'none' }}
    >
      <Flexbox horizontal align={'center'} gap={6}>
        {hasMessages && (
          <Avatar avatar={agent?.avatar || DEFAULT_INBOX_AVATAR} shape={'circle'} size={22} />
        )}
        <Popover
          arrow={false}
          open={hasTopics ? topicPopoverOpen : false}
          placement={'bottomLeft'}
          styles={{ content: { padding: 0, width: 240 } }}
          trigger={'click'}
          content={
            <Flexbox gap={4} padding={8} style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {(topics || []).map((topic) => (
                <TopicItem
                  active={topic.id === activeTopicId}
                  key={topic.id}
                  topicId={topic.id}
                  topicTitle={topic.title}
                  onClose={() => setTopicPopoverOpen(false)}
                  onTopicChange={(id) => switchTopic(id)}
                />
              ))}
            </Flexbox>
          }
          onOpenChange={(open) => setTopicPopoverOpen(hasTopics && open)}
        >
          <div className={styles.title}>
            <Text ellipsis className={styles.titleText}>
              {title}
            </Text>
            <ChevronDownIcon className={styles.titleChevron} size={14} />
          </div>
        </Popover>
      </Flexbox>
      <Flexbox horizontal align={'center'} gap={2}>
        {hasMessages && (
          <ActionIcon
            icon={ShareIcon}
            size={DESKTOP_HEADER_ICON_SIZE}
            title={t('pageCopilot.share')}
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              message.success(t('pageCopilot.shareCopied'));
            }}
          />
        )}
        <ActionIcon
          icon={MessageSquarePlusIcon}
          size={DESKTOP_HEADER_ICON_SIZE}
          title={t('pageCopilot.newChat')}
          onClick={newChat}
        />
        <ActionIcon
          icon={PictureInPicture2Icon}
          size={DESKTOP_HEADER_ICON_SIZE}
          title={panelMode === 'docked' ? t('pageCopilot.float') : t('pageCopilot.dock')}
          onClick={toggleDock}
        />
        {hasMessages && (
          <DropdownMenu items={moreItems} placement={'bottomRight'}>
            <ActionIcon
              icon={MoreHorizontalIcon}
              size={DESKTOP_HEADER_ICON_SIZE}
              title={t('pageCopilot.more')}
            />
          </DropdownMenu>
        )}
        <ActionIcon
          icon={MinusIcon}
          size={DESKTOP_HEADER_ICON_SIZE}
          title={t('pageCopilot.minimize')}
          onClick={() => toggleRightPanel(false)}
        />
      </Flexbox>
    </Flexbox>
  );
});

CopilotHeader.displayName = 'CopilotHeader';

export default CopilotHeader;
