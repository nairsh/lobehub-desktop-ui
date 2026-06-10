'use client';

import { Avatar } from '@lobehub/ui';
import { createStaticStyles, cssVar } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_INBOX_AVATAR } from '@/const/index';
import { conversationSelectors, useConversationStore } from '@/features/Conversation';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors } from '@/store/agent/selectors';
import { useGlobalStore } from '@/store/global';

const styles = createStaticStyles(({ css }) => ({
  launcher: css`
    cursor: pointer;

    position: fixed;
    z-index: 1000;
    inset-block-end: 24px;
    inset-inline-end: 24px;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 0;
    border: 1px solid color-mix(in srgb, ${cssVar.colorBorder} 60%, transparent);
    border-radius: 999px;

    background: ${cssVar.colorBgElevated};
    box-shadow:
      0 8px 24px rgb(15 23 42 / 18%),
      0 2px 6px rgb(15 23 42 / 10%);

    transition:
      transform ${cssVar.motionDurationMid} ${cssVar.motionEaseOut},
      box-shadow ${cssVar.motionDurationMid} ${cssVar.motionEaseOut};

    &:hover {
      transform: translateY(-2px);
      box-shadow:
        0 12px 30px rgb(15 23 42 / 22%),
        0 3px 8px rgb(15 23 42 / 12%);
    }

    &:active {
      transform: translateY(0);
    }
  `,
}));

const Launcher = memo(() => {
  const { t } = useTranslation('chat');
  const toggleRightPanel = useGlobalStore((s) => s.toggleRightPanel);
  const agentId = useConversationStore(conversationSelectors.agentId);
  const agent = useAgentStore(agentByIdSelectors.getAgentConfigById(agentId));

  return (
    <button
      aria-label={t('pageCopilot.open')}
      className={styles.launcher}
      title={t('pageCopilot.open')}
      type={'button'}
      onClick={() => toggleRightPanel(true)}
    >
      <Avatar avatar={agent?.avatar || DEFAULT_INBOX_AVATAR} shape={'circle'} size={52} />
    </button>
  );
});

Launcher.displayName = 'Launcher';

export default Launcher;
