'use client';

import type { AssistantContentBlock } from '@lobechat/types';
import { Button, Flexbox, Icon, Text } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { AlertCircle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { dataSelectors, useConversationStore } from '../../store';

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    padding: 16px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 8px;
    background: ${token.colorBgContainer};
  `,
  content: css`
    line-height: 1.7;
    color: ${token.colorTextSecondary};
    white-space: pre-wrap;
  `,
  dash: css`
    padding: 16px;
    border: 1px dashed ${token.colorBorder};
    border-radius: 8px;
    color: ${token.colorTextSecondary};
  `,
  pill: css`
    padding-block: 4px;
    padding-inline: 10px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 999px;

    background: ${token.colorBgContainer};
  `,
}));

interface ModelCouncilMessageProps {
  id: string;
  index: number;
}

const ModelCouncilMessage = memo<ModelCouncilMessageProps>(({ id }) => {
  const { t } = useTranslation('chat');
  const { styles, theme } = useStyles();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const message = useConversationStore(dataSelectors.getDisplayMessageById(id));
  const children = message?.children || [];
  const metadata = (message?.metadata as any) || {};
  const groupStatus = metadata.status as string | undefined;
  const isJudging = groupStatus === 'judging' || groupStatus === 'running';

  if (!message) return null;

  return (
    <Flexbox gap={12} style={{ marginInline: 'auto', maxWidth: 720, width: '100%' }}>
      <Text type={'secondary'}>{t('modelCouncil.thinking')}</Text>
      {children.map((child: AssistantContentBlock) => {
        const childMeta = ((child.metadata as any)?.modelCouncil || {}) as { status?: string };
        const status = child.error ? 'failed' : childMeta.status || 'running';
        const isExpanded = expanded[child.id];
        const childModel = child as AssistantContentBlock & {
          model?: string | null;
          provider?: string | null;
        };
        const modelLabel = childModel.model || childModel.provider || t('modelCouncil.member');
        const completed = status === 'completed';
        const failed = status === 'failed' || status === 'timeout' || status === 'canceled';

        return (
          <Flexbox className={styles.card} gap={12} key={child.id}>
            <Flexbox horizontal align={'center'} justify={'space-between'}>
              <Flexbox horizontal align={'center'} className={styles.pill} gap={8}>
                <Text strong>{modelLabel}</Text>
              </Flexbox>
              <Button
                size={'small'}
                type={'text'}
                onClick={() => setExpanded((prev) => ({ ...prev, [child.id]: !isExpanded }))}
              >
                <Flexbox horizontal align={'center'} gap={6}>
                  {t('modelCouncil.viewResponse')}
                  <Icon icon={ChevronRight} size={14} />
                </Flexbox>
              </Button>
            </Flexbox>
            <Flexbox horizontal align={'center'} gap={8}>
              {completed ? (
                <Icon color={theme.colorSuccess} icon={CheckCircle2} size={16} />
              ) : failed ? (
                <Icon color={theme.colorWarning} icon={AlertCircle} size={16} />
              ) : (
                <Icon spin color={theme.colorTextSecondary} icon={Loader2} size={16} />
              )}
              <Text type={'secondary'}>
                {failed
                  ? child.error?.message || t('modelCouncil.status.failed')
                  : completed
                    ? t('modelCouncil.status.completed')
                    : t('modelCouncil.status.running')}
              </Text>
            </Flexbox>
            {isExpanded && child.content && <div className={styles.content}>{child.content}</div>}
          </Flexbox>
        );
      })}
      {isJudging && (
        <Flexbox horizontal align={'center'} className={styles.dash} gap={8}>
          <Icon spin icon={Loader2} size={16} />
          <Text strong>{t('modelCouncil.synthesizing')}</Text>
        </Flexbox>
      )}
    </Flexbox>
  );
});

ModelCouncilMessage.displayName = 'ModelCouncilMessage';

export default ModelCouncilMessage;
