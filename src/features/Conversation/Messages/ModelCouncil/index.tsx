'use client';

import { LOADING_FLAT } from '@lobechat/const';
import type { AssistantContentBlock } from '@lobechat/types';
import { ModelIcon } from '@lobehub/icons';
import { Flexbox, Icon, Markdown, Text } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
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
  header: css`
    min-height: 30px;
  `,
  headerStackIcon: css`
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    width: 28px;
    height: 28px;
    border: 1px solid ${token.colorBgContainer};
    border-radius: 50%;

    background: ${token.colorBgElevated};

    &:not(:first-child) {
      margin-inline-start: -10px;
    }
  `,
  pill: css`
    max-width: min(420px, 70vw);
    padding-block: 4px;
    padding-inline: 10px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 999px;

    background: ${token.colorBgContainer};
  `,
  pillLabel: css`
    overflow: hidden;

    min-width: 0;

    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  response: css`
    margin-block-start: 4px;
  `,
  responseHeader: css`
    min-height: 28px;
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
    reasoning?: { content?: string };
  };

const isFailedStatus = (status?: string) =>
  status === 'failed' || status === 'timeout' || status === 'canceled';

const isTerminalStatus = (status?: string) => status === 'completed' || isFailedStatus(status);

const visibleContent = (content?: string) =>
  content && content !== LOADING_FLAT ? content.trim() : '';

const ModelCouncilMessage = memo<ModelCouncilMessageProps>(({ id }) => {
  const { t } = useTranslation('chat');
  const { styles, theme } = useStyles();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const message = useConversationStore(dataSelectors.getDisplayMessageById(id));
  const enabledModels = useEnabledChatModels();
  const children = (message?.children || []) as AssistantContentBlock[];
  const metadata = (message?.metadata as any) || {};
  const settingsSnapshot = (metadata.settingsSnapshot ||
    metadata.modelCouncil?.settingsSnapshot) as ModelCouncilSettings | undefined;
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

  if (!message) return null;

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
  const judgeModel = judgeChild ? getChildModel(judgeChild) : undefined;
  const judgeReasoning = visibleContent(judgeModel?.reasoning?.content);
  const showSynthesisCard = showSynthesisStatus || !!judgeReasoning;
  const synthesisExpanded = expanded.__synthesis;
  const headerModels =
    settingsSnapshot?.councilModels?.length &&
    settingsSnapshot.councilModels.map((item) => ({
      key: modelKey(item),
      model: item.model,
      provider: item.provider,
    }));
  const stackedHeaderModels =
    headerModels ||
    memberChildren.map((child) => {
      const childModel = getChildModel(child);

      return {
        key: child.id,
        model: childModel.model || '',
        provider: childModel.provider || '',
      };
    });

  return (
    <Flexbox gap={12} style={{ marginInline: 'auto', maxWidth: 840, width: '100%' }}>
      <Flexbox horizontal align={'center'} className={styles.header} gap={10}>
        <Flexbox horizontal align={'center'}>
          {stackedHeaderModels.map((item) => (
            <span className={styles.headerStackIcon} key={item.key}>
              <ModelIcon model={item.model || item.provider || ''} size={19} type={'color'} />
            </span>
          ))}
        </Flexbox>
        <Text type={'secondary'}>{dayjs(message.createdAt).fromNow()}</Text>
      </Flexbox>
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
        const reasoning = visibleContent(childModel.reasoning?.content);
        const content = visibleContent(child.content);
        const preview = reasoning || content;
        const showStatusLine = completed || failed || firstTwoMembersFinished;

        return (
          <Flexbox className={styles.card} gap={12} key={child.id}>
            <Flexbox horizontal align={'center'} justify={'space-between'}>
              <Flexbox horizontal align={'center'} className={styles.pill} gap={8}>
                <span className={styles.iconCell}>
                  <ModelIcon model={modelId || modelLabel} size={16} type={'color'} />
                </span>
                <span className={styles.pillLabel}>
                  {modelLabel}
                  {!completed && !failed ? ` ${t('modelCouncil.status.running')}` : ''}
                </span>
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
            {showStatusLine && (
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
                    ? childModel.error?.message || t('modelCouncil.status.failed')
                    : completed
                      ? t('modelCouncil.status.completed')
                      : t('modelCouncil.status.running')}
                </Text>
              </Flexbox>
            )}
            {isExpanded && reasoning && (
              <div className={styles.content}>
                <Markdown variant={'chat'}>{reasoning}</Markdown>
              </div>
            )}
            {isExpanded && content && (
              <div className={styles.content}>
                <Markdown variant={'chat'}>{content}</Markdown>
              </div>
            )}
            {!isExpanded && preview && <div className={styles.contentPreview}>{preview}</div>}
          </Flexbox>
        );
      })}
      {showSynthesisCard && (
        <Flexbox className={styles.card} gap={12}>
          <Flexbox horizontal align={'center'} justify={'space-between'}>
            <Flexbox horizontal align={'center'} className={styles.pill} gap={8}>
              {isJudging || !judgeReasoning ? (
                <Icon spin color={theme.colorTextSecondary} icon={Loader2} size={16} />
              ) : (
                <Icon color={theme.colorSuccess} icon={CheckCircle2} size={16} />
              )}
              <Text strong>{t('modelCouncil.synthesizing')}</Text>
            </Flexbox>
            {judgeReasoning && (
              <button
                aria-expanded={synthesisExpanded}
                className={styles.expandButton}
                type="button"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, __synthesis: !synthesisExpanded }))
                }
              >
                <Flexbox horizontal align={'center'} gap={6}>
                  {t('modelCouncil.viewResponse')}
                  <Icon icon={ChevronRight} size={14} />
                </Flexbox>
              </button>
            )}
          </Flexbox>
          {synthesisExpanded && judgeReasoning && (
            <div className={styles.content}>
              <Markdown variant={'chat'}>{judgeReasoning}</Markdown>
            </div>
          )}
          {!synthesisExpanded && judgeReasoning && (
            <div className={styles.contentPreview}>{judgeReasoning}</div>
          )}
        </Flexbox>
      )}
      {judgeChild?.content && (
        <Flexbox className={styles.response} gap={8}>
          <Flexbox horizontal align={'center'} className={styles.responseHeader}>
            {stackedHeaderModels.map((item) => (
              <span className={styles.stackIcon} key={item.key}>
                <ModelIcon model={item.model || item.provider || ''} size={17} type={'color'} />
              </span>
            ))}
          </Flexbox>
          <Markdown variant={'chat'}>{judgeChild.content}</Markdown>
        </Flexbox>
      )}
    </Flexbox>
  );
});

ModelCouncilMessage.displayName = 'ModelCouncilMessage';

export default ModelCouncilMessage;
