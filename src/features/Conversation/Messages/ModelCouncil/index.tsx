'use client';

import type { AssistantContentBlock } from '@lobechat/types';
import { ModelIcon } from '@lobehub/icons';
import { Flexbox, Icon, Markdown, Text } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { AlertCircle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEnabledChatModels } from '@/hooks/useEnabledChatModels';
import type { ModelCouncilModelConfig, ModelCouncilSettings } from '@/types/modelCouncil';

import { dataSelectors, useConversationStore } from '../../store';

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    padding-block: 14px;
    padding-inline: 16px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 8px;

    background: ${token.colorBgContainer};
  `,
  content: css`
    line-height: 1.7;
    color: ${token.colorTextSecondary};
  `,
  contentPreview: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;

    max-height: 3.2em;

    line-height: 1.6;
    color: ${token.colorTextSecondary};
  `,
  expandButton: css`
    cursor: pointer;

    display: inline-flex;
    gap: 6px;
    align-items: center;

    padding: 0;
    border: 0;

    color: ${token.colorTextSecondary};

    background: transparent;

    &:hover {
      color: ${token.colorText};
    }
  `,
  iconCell: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 18px;
    height: 18px;
  `,
  dash: css`
    padding: 16px;
    border: 1px dashed ${token.colorBorder};
    border-radius: 8px;
    color: ${token.colorTextSecondary};
  `,
  pill: css`
    max-width: min(420px, 70vw);
    padding-block: 4px;
    padding-inline: 10px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 999px;

    background: ${token.colorBgContainer};
  `,
  response: css`
    margin-block-start: 4px;
  `,
  responseHeader: css`
    min-height: 28px;
  `,
  streamPreview: css`
    overflow: hidden;
    max-height: 120px;
    padding-inline-start: 24px;
    color: ${token.colorTextSecondary};
  `,
  stackIcon: css`
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    width: 24px;
    height: 24px;
    border: 1px solid ${token.colorBgContainer};
    border-radius: 50%;

    background: ${token.colorBgElevated};

    &:not(:first-child) {
      margin-inline-start: -8px;
    }
  `,
}));

interface ModelCouncilMessageProps {
  embedded?: boolean;
  hideJudgeResponse?: boolean;
  id: string;
  index: number;
}

const modelKey = (item: Pick<ModelCouncilModelConfig, 'provider' | 'model'>) =>
  `${item.provider}/${item.model}`;

const getChildModel = (child: AssistantContentBlock) =>
  child as AssistantContentBlock & {
    error?: { message?: string };
    metadata?: Record<string, any>;
    model?: string | null;
    provider?: string | null;
    reasoning?: { content?: string; duration?: number };
  };

const isFailedStatus = (status?: string) =>
  status === 'failed' || status === 'timeout' || status === 'canceled';

const isTerminalStatus = (status?: string) => status === 'completed' || isFailedStatus(status);

const ModelCouncilMessage = memo<ModelCouncilMessageProps>(
  ({ id, embedded, hideJudgeResponse }) => {
    const { t } = useTranslation('chat');
    const { styles, theme } = useStyles();
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const message = useConversationStore(dataSelectors.getDisplayMessageById(id));
    const hasAttachedJudgeMessage = useConversationStore((s) => {
      if (embedded) return false;

      const groupMessage = s.displayMessages.find((item) => item.id === id);
      if (!groupMessage || groupMessage.role !== 'compareGroup') return false;

      return s.displayMessages.some((item) => {
        if (item.role !== 'assistant') return false;

        return (
          groupMessage.children?.some((child) => child.id === item.id) ||
          (!!item.parentId && item.parentId === groupMessage.parentId)
        );
      });
    });
    const enabledModels = useEnabledChatModels();
    const children = (message?.children || []) as AssistantContentBlock[];
    const metadata = (message?.metadata as any) || {};
    const settingsSnapshot = metadata.settingsSnapshot as ModelCouncilSettings | undefined;
    const groupStatus = metadata.status as string | undefined;

    const modelDisplayMap = useMemo(() => {
      const map = new Map<string, string>();

      for (const provider of enabledModels) {
        for (const model of provider.children) {
          map.set(
            modelKey({ model: model.id, provider: provider.id }),
            (model as any).displayName || model.id,
          );
        }
      }

      for (const model of settingsSnapshot?.councilModels || []) {
        if (model.label) map.set(modelKey(model), model.label);
      }

      const judge = settingsSnapshot?.judgeModel;
      if (judge?.label) map.set(modelKey(judge), judge.label);

      return map;
    }, [enabledModels, settingsSnapshot]);

    if (!message || hasAttachedJudgeMessage) return null;

    const memberChildren = children.filter((child) => {
      const role = (getChildModel(child).metadata?.modelCouncil || {}).role;
      return role !== 'judge';
    });
    const judgeChild = children.find((child) => {
      const role = (getChildModel(child).metadata?.modelCouncil || {}).role;
      return role === 'judge';
    });
    const hasRunningMember = memberChildren.some((child) => {
      const childModel = getChildModel(child);
      const status = childModel.error
        ? 'failed'
        : ((childModel.metadata?.modelCouncil || {}) as { status?: string }).status || 'waiting';

      return !isTerminalStatus(status);
    });
    const judgeStatus = judgeChild
      ? ((getChildModel(judgeChild).metadata?.modelCouncil || {}) as { status?: string }).status ||
        'waiting'
      : undefined;
    const isJudging =
      !!judgeChild &&
      !isTerminalStatus(judgeStatus) &&
      (groupStatus === 'judging' || !hasRunningMember);
    const firstTwoMembers = memberChildren.slice(0, Math.min(2, memberChildren.length));
    const firstTwoMembersFinished =
      firstTwoMembers.length > 0 &&
      firstTwoMembers.every((child) => {
        const childModel = getChildModel(child);
        const status = childModel.error
          ? 'failed'
          : ((childModel.metadata?.modelCouncil || {}) as { status?: string }).status || 'waiting';

        return isTerminalStatus(status);
      });
    const showSynthesisStatus = firstTwoMembersFinished && (hasRunningMember || isJudging);

    return (
      <Flexbox gap={12} style={{ marginInline: 'auto', maxWidth: 840, width: '100%' }}>
        {memberChildren.map((child: AssistantContentBlock) => {
          const childModel = getChildModel(child);
          const childMeta = (childModel.metadata?.modelCouncil || {}) as { status?: string };
          const status = childModel.error ? 'failed' : childMeta.status || 'running';
          const isExpanded = expanded[child.id];
          const modelId = childModel.model || '';
          const providerId = childModel.provider || '';
          const modelLabel =
            modelDisplayMap.get(modelKey({ model: modelId, provider: providerId })) ||
            modelId ||
            providerId ||
            t('modelCouncil.member');
          const completed = status === 'completed';
          const failed = isFailedStatus(status);
          const reasoningContent = childModel.reasoning?.content?.trim();
          const livePreview = !completed && !failed ? reasoningContent || child.content : '';

          return (
            <Flexbox className={styles.card} gap={12} key={child.id}>
              <Flexbox horizontal align={'center'} justify={'space-between'}>
                <Flexbox horizontal align={'center'} className={styles.pill} gap={8}>
                  <span className={styles.iconCell}>
                    <ModelIcon model={modelId || modelLabel} size={16} type={'color'} />
                  </span>
                  <Text ellipsis strong>
                    {modelLabel}
                    {!completed && !failed ? ` ${t('modelCouncil.status.running')}` : ''}
                  </Text>
                </Flexbox>
                <button
                  className={styles.expandButton}
                  type="button"
                  onClick={() => setExpanded((prev) => ({ ...prev, [child.id]: !isExpanded }))}
                >
                  <Flexbox horizontal align={'center'} gap={6}>
                    {t('modelCouncil.viewResponse')}
                    <Icon icon={ChevronRight} size={14} />
                  </Flexbox>
                </button>
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
                  {livePreview
                    ? reasoningContent
                      ? t('modelCouncil.reasoning')
                      : t('modelCouncil.status.running')
                    : failed
                      ? childModel.error?.message || t('modelCouncil.status.failed')
                      : completed
                        ? t('modelCouncil.status.completed')
                        : t('modelCouncil.status.running')}
                </Text>
              </Flexbox>
              {livePreview && (
                <div aria-live="polite" className={styles.streamPreview}>
                  <Markdown variant={'chat'}>{livePreview}</Markdown>
                </div>
              )}
              {isExpanded && child.content && (
                <div className={styles.content}>
                  <Markdown variant={'chat'}>{child.content}</Markdown>
                </div>
              )}
              {!isExpanded && !livePreview && child.content && (
                <div className={styles.contentPreview}>{child.content}</div>
              )}
            </Flexbox>
          );
        })}
        {showSynthesisStatus && (
          <Flexbox horizontal align={'center'} className={styles.dash} gap={8}>
            <Icon spin icon={Loader2} size={16} />
            <Text strong>
              {hasRunningMember ? t('modelCouncil.thinking') : t('modelCouncil.synthesizing')}
            </Text>
          </Flexbox>
        )}
        {!hideJudgeResponse && judgeChild?.content && (
          <Flexbox className={styles.response} gap={8}>
            <Flexbox horizontal align={'center'} className={styles.responseHeader}>
              {memberChildren.map((child) => {
                const childModel = getChildModel(child);
                return (
                  <span className={styles.stackIcon} key={child.id}>
                    <ModelIcon
                      model={childModel.model || childModel.provider || ''}
                      size={17}
                      type={'color'}
                    />
                  </span>
                );
              })}
            </Flexbox>
            <Markdown variant={'chat'}>{judgeChild.content}</Markdown>
          </Flexbox>
        )}
      </Flexbox>
    );
  },
);

ModelCouncilMessage.displayName = 'ModelCouncilMessage';

export default ModelCouncilMessage;
