'use client';

import { LOADING_FLAT } from '@lobechat/const';
import type { AssistantContentBlock } from '@lobechat/types';
import { ModelIcon } from '@lobehub/icons';
import { Flexbox, Icon, Markdown, Text } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { AlertCircle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { memo, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEnabledChatModels } from '@/hooks/useEnabledChatModels';
import { useAiInfraStore } from '@/store/aiInfra';
import type { ModelCouncilModelConfig, ModelCouncilSettings } from '@/types/modelCouncil';
import { findReasoningConfig, formatReasoningLabel } from '@/utils/modelReasoning';

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
  livePanel: css`
    overflow-y: auto;

    max-height: 180px;
    padding-block: 8px;
    padding-inline: 10px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 8px;

    font-size: 13px;
    line-height: 1.6;
    color: ${token.colorTextSecondary};

    background: ${token.colorFillQuaternary};
  `,
  sectionLabel: css`
    font-size: 12px;
    font-weight: 600;
    color: ${token.colorTextTertiary};
    text-transform: uppercase;
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
  phaseDivider: css`
    height: 1px;
    margin-block: 2px;
    border: 0;
    background: ${token.colorBorder};
  `,
  pill: css`
    max-width: min(420px, 70vw);
    padding-block: 4px;
    padding-inline: 10px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 999px;

    background: ${token.colorBgContainer};
  `,
  reasoningTag: css`
    flex: none;
    font-size: 11px;
    font-weight: 400;
    color: ${token.colorTextTertiary};
  `,
  titleText: css`
    font-weight: 400;
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

const AutoScrollPanel = memo<{ children: ReactNode; className: string }>(
  ({ children, className }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const node = ref.current;
      if (!node) return;

      node.scrollTop = node.scrollHeight;
    }, [children]);

    return (
      <div className={className} ref={ref}>
        {children}
      </div>
    );
  },
);

AutoScrollPanel.displayName = 'AutoScrollPanel';

interface ModelCouncilMessageProps {
  embedded?: boolean;
  hideJudgeResponse?: boolean;
  id: string;
  index: number;
  judgeMessage?: AssistantContentBlock;
  judgeStatus?: string;
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

const getVisibleContent = (content?: string | null) =>
  content && content !== LOADING_FLAT ? content : '';

const getStepLabel = (t: any, step: any) => {
  if (step?.stepType === 'grounding') return t('modelCouncil.steps.search', 'Searching');
  if (step?.stepType === 'tools_calling') return t('modelCouncil.steps.tool', 'Using tool');

  return t('modelCouncil.steps.step', 'Step');
};

const getStepText = (step: any) => {
  if (step?.grounding) {
    const grounding = step.grounding;
    const queries = grounding.searchQueries || grounding.queries || grounding.query;
    if (Array.isArray(queries) && queries.length > 0) return queries.join(', ');
    if (typeof queries === 'string') return queries;
  }

  const tools = step?.toolsCalling;
  if (Array.isArray(tools) && tools.length > 0) {
    return tools
      .map((tool) => tool.name || tool.apiName || tool.identifier)
      .filter(Boolean)
      .join(', ');
  }

  return '';
};

const getLiveStepStatus = (t: any, steps: any[]) => {
  const latestStep = steps.at(-1);
  if (!latestStep) return;

  const stepText = getStepText(latestStep);
  const stepLabel = getStepLabel(t, latestStep);
  const clippedStepText = stepText.length > 96 ? `${stepText.slice(0, 93)}...` : stepText;

  return clippedStepText ? `${stepLabel}: ${clippedStepText}` : stepLabel;
};

const collapseSteps = (steps: any[]): { count: number; step: any }[] => {
  const result: { count: number; step: any }[] = [];
  for (const step of steps) {
    const label = step.stepType;
    const text = getStepText(step);
    const last = result.at(-1);
    if (last && last.step.stepType === label && getStepText(last.step) === text) {
      last.count++;
    } else {
      result.push({ count: 1, step });
    }
  }
  return result;
};

const ModelCouncilMessage = memo<ModelCouncilMessageProps>(
  ({ id, embedded, hideJudgeResponse, judgeMessage, judgeStatus }) => {
    const { t } = useTranslation('chat');
    const { styles, theme } = useStyles();
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const message = useConversationStore(dataSelectors.getDisplayMessageById(id));
    const hasAttachedJudgeMessage = useConversationStore((s) => {
      if (embedded) return false;

      const groupMessage = s.displayMessages.find((item) => item.id === id);
      if (!groupMessage || groupMessage.role !== 'compareGroup') return false;
      const groupIndex = s.displayMessages.findIndex((item) => item.id === id);
      const previousMessage = groupIndex > 0 ? s.displayMessages[groupIndex - 1] : undefined;

      if (previousMessage?.role === 'assistant') return true;

      return s.displayMessages.some((item) => {
        if (item.role !== 'assistant') return false;

        return (
          groupMessage.children?.some((child) => child.id === item.id) ||
          (!!item.parentId && item.parentId === groupMessage.parentId)
        );
      });
    });
    const enabledModels = useEnabledChatModels();
    const enabledAiModels = useAiInfraStore((s) => s.enabledAiModels);
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

    const modelReasoningLabelMap = useMemo(() => {
      const map = new Map<string, string>();

      for (const provider of enabledModels) {
        for (const model of provider.children) {
          const enabledModel = enabledAiModels?.find(
            (item) => item.id === model.id && item.providerId === provider.id,
          );
          const reasoningConfig = findReasoningConfig(
            (model as any).settings?.extendParams || enabledModel?.settings?.extendParams,
          );

          if (reasoningConfig?.defaultValue) {
            map.set(
              modelKey({ model: model.id, provider: provider.id }),
              formatReasoningLabel(reasoningConfig.defaultValue),
            );
          }
        }
      }

      return map;
    }, [enabledAiModels, enabledModels]);

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
    const groupJudgeStatus = judgeChild
      ? ((getChildModel(judgeChild).metadata?.modelCouncil || {}) as { status?: string }).status ||
        'waiting'
      : undefined;
    const activeJudge = judgeChild
      ? getChildModel(judgeChild)
      : judgeMessage
        ? getChildModel(judgeMessage)
        : undefined;
    const activeJudgeStatus = judgeChild
      ? groupJudgeStatus
      : judgeStatus || (activeJudge?.content ? 'completed' : undefined);
    const isJudging =
      !!activeJudge &&
      !isTerminalStatus(activeJudgeStatus) &&
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
    const showSynthesisStatus =
      firstTwoMembersFinished && (hasRunningMember || (isJudging && !activeJudge));
    const showJudgeCard = firstTwoMembersFinished && !!activeJudge && !hasRunningMember;

    return (
      <Flexbox gap={12} style={{ marginInline: 'auto', maxWidth: 840, width: '100%' }}>
        {memberChildren.map((child: AssistantContentBlock) => {
          const childModel = getChildModel(child);
          const childMeta = (childModel.metadata?.modelCouncil || {}) as {
            reasoningLevel?: string;
            status?: string;
            steps?: any[];
          };
          const status = childModel.error ? 'failed' : childMeta.status || 'running';
          const isExpanded = expanded[child.id];
          const modelId = childModel.model || '';
          const providerId = childModel.provider || '';
          const modelLabel =
            modelDisplayMap.get(modelKey({ model: modelId, provider: providerId })) ||
            modelId ||
            providerId ||
            t('modelCouncil.member');
          const configuredModel = settingsSnapshot?.councilModels.find(
            (item) => item.model === modelId && item.provider === providerId,
          );
          const reasoningLevel = childMeta.reasoningLevel || configuredModel?.reasoningLevel;
          const reasoningLabel = reasoningLevel
            ? formatReasoningLabel(reasoningLevel)
            : configuredModel?.reasoning
              ? modelReasoningLabelMap.get(modelKey({ model: modelId, provider: providerId }))
              : undefined;
          const completed = status === 'completed';
          const timedOut = status === 'timeout';
          const failed = isFailedStatus(status);
          const reasoningContent = childModel.reasoning?.content?.trim();
          const stepItems = childMeta.steps || [];
          const visibleContent = getVisibleContent(child.content);
          const livePreview = !completed && !failed ? reasoningContent || visibleContent : '';
          const liveStepStatus =
            !completed && !failed ? getLiveStepStatus(t, stepItems) : undefined;
          const errorMessage = childModel.error?.message;
          const hasExpandableContent = !!(
            reasoningContent ||
            stepItems.length > 0 ||
            visibleContent ||
            (failed && errorMessage)
          );

          const failedStatusLabel = timedOut
            ? t('modelCouncil.status.timeout')
            : t('modelCouncil.status.failed');
          let statusLabel = t('modelCouncil.status.running');
          if (liveStepStatus) {
            statusLabel = liveStepStatus;
          } else if (livePreview) {
            statusLabel = reasoningContent
              ? t('modelCouncil.reasoning')
              : t('modelCouncil.status.running');
          } else if (failed) {
            statusLabel = errorMessage || failedStatusLabel;
          } else if (completed) {
            statusLabel = t('modelCouncil.status.completed');
          }

          return (
            <Flexbox className={styles.card} gap={12} key={child.id}>
              <Flexbox horizontal align={'center'} justify={'space-between'}>
                <Flexbox horizontal align={'center'} className={styles.pill} gap={8}>
                  <span className={styles.iconCell}>
                    <ModelIcon model={modelId || modelLabel} size={16} type={'color'} />
                  </span>
                  <Text ellipsis className={styles.titleText}>
                    {modelLabel}
                    {!completed && !failed
                      ? ` ${liveStepStatus ? getStepLabel(t, stepItems.at(-1)) : t('modelCouncil.status.running')}`
                      : ''}
                  </Text>
                  {reasoningLabel && (
                    <Text className={styles.reasoningTag}>
                      {t('modelCouncil.reasoning')}: {reasoningLabel}
                    </Text>
                  )}
                </Flexbox>
                {hasExpandableContent && (
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
                )}
              </Flexbox>
              <Flexbox horizontal align={'center'} gap={8}>
                {completed ? (
                  <Icon color={theme.colorSuccess} icon={CheckCircle2} size={16} />
                ) : failed ? (
                  <Icon color={theme.colorWarning} icon={AlertCircle} size={16} />
                ) : (
                  <Icon spin color={theme.colorTextSecondary} icon={Loader2} size={16} />
                )}
                <Text type={'secondary'}>{statusLabel}</Text>
              </Flexbox>
              {isExpanded && (
                <Flexbox gap={8}>
                  {(reasoningContent || stepItems.length > 0) && (
                    <Flexbox gap={4}>
                      <Text className={styles.sectionLabel}>{t('modelCouncil.reasoning')}</Text>
                      <AutoScrollPanel className={styles.livePanel}>
                        {stepItems.length > 0 && (
                          <Flexbox gap={4} style={{ marginBlockEnd: reasoningContent ? 8 : 0 }}>
                            {collapseSteps(stepItems).map(({ step, count }, stepIndex) => {
                              const stepText = getStepText(step);

                              return (
                                <Text key={`${child.id}-step-${stepIndex}`} type={'secondary'}>
                                  {getStepLabel(t, step)}
                                  {stepText ? `: ${stepText}` : ''}
                                  {count > 1 ? ` ×${count}` : ''}
                                </Text>
                              );
                            })}
                          </Flexbox>
                        )}
                        {reasoningContent && (
                          <Markdown variant={'chat'}>{reasoningContent}</Markdown>
                        )}
                      </AutoScrollPanel>
                    </Flexbox>
                  )}
                  {visibleContent && (
                    <div className={styles.content}>
                      <Markdown variant={'chat'}>{visibleContent}</Markdown>
                    </div>
                  )}
                  {failed && errorMessage && !visibleContent && (
                    <Flexbox gap={4}>
                      <Text className={styles.sectionLabel}>{t('modelCouncil.errorDetail')}</Text>
                      <Text className={styles.content} type={'secondary'}>
                        {errorMessage}
                      </Text>
                    </Flexbox>
                  )}
                </Flexbox>
              )}
            </Flexbox>
          );
        })}
        {(showSynthesisStatus || showJudgeCard) && <div className={styles.phaseDivider} />}
        {showSynthesisStatus && (
          <Flexbox horizontal align={'center'} className={styles.dash} gap={8}>
            <Icon spin icon={Loader2} size={16} />
            <Text strong>
              {hasRunningMember ? t('modelCouncil.thinking') : t('modelCouncil.synthesizing')}
            </Text>
          </Flexbox>
        )}
        {showJudgeCard &&
          (() => {
            const judge = activeJudge;
            if (!judge) return null;

            const modelId = judge.model || settingsSnapshot?.judgeModel?.model || '';
            const providerId = judge.provider || settingsSnapshot?.judgeModel?.provider || '';
            const modelLabel =
              modelDisplayMap.get(modelKey({ model: modelId, provider: providerId })) ||
              settingsSnapshot?.judgeModel?.label ||
              modelId ||
              providerId ||
              t('modelCouncil.synthesizing');
            const status = activeJudgeStatus || 'running';
            const isExpanded = expanded[judge.id];
            const completed = status === 'completed';
            const failed = isFailedStatus(status);
            const judgeContent = getVisibleContent(judge.content);
            const judgeMeta = (judge.metadata?.modelCouncil || {}) as {
              reasoningLevel?: string;
              steps?: any[];
            };
            const reasoningLevel =
              judgeMeta.reasoningLevel || settingsSnapshot?.judgeModel?.reasoningLevel;
            const reasoningLabel = reasoningLevel
              ? formatReasoningLabel(reasoningLevel)
              : settingsSnapshot?.judgeModel?.reasoning
                ? modelReasoningLabelMap.get(modelKey({ model: modelId, provider: providerId }))
                : undefined;
            const judgeReasoning = judge.reasoning?.content?.trim();
            const judgeSteps = judgeMeta.steps || [];
            const judgeLivePreview = !completed && !failed ? judgeReasoning || judgeContent : '';
            const judgeLiveStepStatus =
              !completed && !failed ? getLiveStepStatus(t, judgeSteps) : undefined;
            const hasJudgeDetail = !!(
              judgeContent ||
              judgeReasoning ||
              judgeLivePreview ||
              judgeSteps.length > 0
            );
            let judgeStatusLabel = t('modelCouncil.synthesizing');
            if (judgeLiveStepStatus) {
              judgeStatusLabel = judgeLiveStepStatus;
            } else if (judgeLivePreview) {
              judgeStatusLabel = judgeReasoning
                ? t('modelCouncil.reasoning')
                : t('modelCouncil.synthesizing');
            } else if (failed) {
              judgeStatusLabel = judge.error?.message || t('modelCouncil.status.failed');
            } else if (completed) {
              judgeStatusLabel = t('modelCouncil.status.synthesized');
            }

            return (
              <Flexbox className={styles.card} gap={12} key={judge.id}>
                <Flexbox horizontal align={'center'} justify={'space-between'}>
                  <Flexbox horizontal align={'center'} className={styles.pill} gap={8}>
                    <span className={styles.iconCell}>
                      <ModelIcon model={modelId || modelLabel} size={16} type={'color'} />
                    </span>
                    <Text ellipsis className={styles.titleText}>
                      {modelLabel}
                    </Text>
                    {reasoningLabel && (
                      <Text className={styles.reasoningTag}>
                        {t('modelCouncil.reasoning')}: {reasoningLabel}
                      </Text>
                    )}
                  </Flexbox>
                  {hasJudgeDetail && (
                    <button
                      className={styles.expandButton}
                      type="button"
                      onClick={() => setExpanded((prev) => ({ ...prev, [judge.id]: !isExpanded }))}
                    >
                      <Flexbox horizontal align={'center'} gap={6}>
                        {t('modelCouncil.viewResponse')}
                        <Icon icon={ChevronRight} size={14} />
                      </Flexbox>
                    </button>
                  )}
                </Flexbox>
                <Flexbox horizontal align={'center'} gap={8}>
                  {completed ? (
                    <Icon color={theme.colorSuccess} icon={CheckCircle2} size={16} />
                  ) : failed ? (
                    <Icon color={theme.colorWarning} icon={AlertCircle} size={16} />
                  ) : (
                    <Icon spin color={theme.colorTextSecondary} icon={Loader2} size={16} />
                  )}
                  <Text type={'secondary'}>{judgeStatusLabel}</Text>
                </Flexbox>
                {isExpanded && (
                  <Flexbox gap={8}>
                    {(judgeReasoning || judgeSteps.length > 0) && (
                      <Flexbox gap={4}>
                        <Text className={styles.sectionLabel}>{t('modelCouncil.reasoning')}</Text>
                        <AutoScrollPanel className={styles.livePanel}>
                          {judgeSteps.length > 0 && (
                            <Flexbox gap={4} style={{ marginBlockEnd: judgeReasoning ? 8 : 0 }}>
                              {collapseSteps(judgeSteps).map(({ step, count }, stepIndex) => {
                                const stepText = getStepText(step);

                                return (
                                  <Text key={`${judge.id}-step-${stepIndex}`} type={'secondary'}>
                                    {getStepLabel(t, step)}
                                    {stepText ? `: ${stepText}` : ''}
                                    {count > 1 ? ` ×${count}` : ''}
                                  </Text>
                                );
                              })}
                            </Flexbox>
                          )}
                          {judgeReasoning && <Markdown variant={'chat'}>{judgeReasoning}</Markdown>}
                        </AutoScrollPanel>
                      </Flexbox>
                    )}
                    {judgeContent && (
                      <div className={styles.content}>
                        <Markdown variant={'chat'}>{judgeContent}</Markdown>
                      </div>
                    )}
                  </Flexbox>
                )}
              </Flexbox>
            );
          })()}
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
