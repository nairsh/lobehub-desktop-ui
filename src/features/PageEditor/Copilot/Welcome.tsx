'use client';

import { Avatar, Flexbox, Text } from '@lobehub/ui';
import { createStaticStyles, cssVar } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_INBOX_AVATAR } from '@/const/index';
import { conversationSelectors, useConversationStore } from '@/features/Conversation';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors } from '@/store/agent/selectors';

import { useSuggestions } from './useSuggestions';

const styles = createStaticStyles(({ css }) => ({
  badge: css`
    display: inline-flex;
    align-items: center;

    height: 18px;
    padding-inline: 6px;
    border-radius: 5px;

    font-size: 11px;
    font-weight: 500;
    line-height: 1;
    color: ${cssVar.colorInfo};

    background: color-mix(in srgb, ${cssVar.colorInfo} 16%, transparent);
  `,
  heading: css`
    margin-block: 14px 18px;
    font-size: 22px;
    font-weight: 700;
    line-height: 1.25;
  `,
  suggestion: css`
    cursor: pointer;

    display: flex;
    gap: 12px;
    align-items: center;

    width: 100%;
    min-height: 40px;
    padding-inline: 8px;
    border: 0;
    border-radius: 8px;

    font-size: 15px;
    color: ${cssVar.colorText};
    text-align: start;

    background: transparent;

    &:hover {
      background: color-mix(in srgb, ${cssVar.colorText} 6%, transparent);
    }
  `,
  suggestionIcon: css`
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;

    width: 22px;

    color: ${cssVar.colorTextSecondary};
  `,
  suggestions: css`
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
  `,
}));

const Welcome = memo(() => {
  const { t } = useTranslation('chat');
  const agentId = useConversationStore(conversationSelectors.agentId);
  const agent = useAgentStore(agentByIdSelectors.getAgentConfigById(agentId));
  const suggestions = useSuggestions();

  return (
    <Flexbox flex={1} justify={'flex-end'} paddingInline={4} style={{ paddingBottom: 8 }}>
      <Avatar avatar={agent?.avatar || DEFAULT_INBOX_AVATAR} shape={'circle'} size={56} />
      <Text className={styles.heading}>{t('pageCopilot.welcomeTitle')}</Text>
      <div className={styles.suggestions}>
        {suggestions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={styles.suggestion}
              key={item.key}
              type={'button'}
              onClick={item.onClick}
            >
              <span className={styles.suggestionIcon}>
                <Icon size={18} />
              </span>
              <span>{item.label}</span>
              {item.badge && <span className={styles.badge}>{t('pageCopilot.newBadge')}</span>}
            </button>
          );
        })}
      </div>
    </Flexbox>
  );
});

export default Welcome;
