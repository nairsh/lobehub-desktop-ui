'use client';

import { LOADING_FLAT } from '@lobechat/const';
import { ModelIcon } from '@lobehub/icons';
import isEqual from 'fast-deep-equal';
import { type MouseEventHandler } from 'react';
import { memo, useCallback, useMemo } from 'react';

import { MESSAGE_ACTION_BAR_PORTAL_ATTRIBUTES } from '@/const/messageActionPortal';
import { ChatItem } from '@/features/Conversation/ChatItem';
import { aiModelSelectors, useAiInfraStore } from '@/store/aiInfra';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';
import type { ModelCouncilModelConfig, ModelCouncilSettings } from '@/types/modelCouncil';

import ErrorMessageExtra, { useErrorContent } from '../../Error';
import { useAgentMeta, useDoubleClickEdit } from '../../hooks';
import { dataSelectors, messageStateSelectors, useConversationStore } from '../../store';
import { normalizeThinkTags, processWithArtifact } from '../../utils/markdown';
import MessageBranch from '../components/MessageBranch';
import {
  useSetMessageItemActionElementPortialContext,
  useSetMessageItemActionTypeContext,
} from '../Contexts/message-action-context';
import ModelCouncilMessage from '../ModelCouncil';
import InterruptedHint from './components/InterruptedHint';
import MessageContent from './components/MessageContent';
import { AssistantMessageExtra } from './Extra';

const actionBarHolder = (
  <div {...{ [MESSAGE_ACTION_BAR_PORTAL_ATTRIBUTES.assistant]: '' }} style={{ height: '28px' }} />
);

const isFailedCouncilStatus = (status?: string) =>
  status === 'failed' || status === 'timeout' || status === 'canceled';

const isTerminalCouncilStatus = (status?: string) =>
  status === 'completed' || isFailedCouncilStatus(status);

const modelKey = (item: Pick<ModelCouncilModelConfig, 'provider' | 'model'>) =>
  `${item.provider}/${item.model}`;

interface AssistantMessageProps {
  disableEditing?: boolean;
  id: string;
  index: number;
  isLatestItem?: boolean;
}

const AssistantMessage = memo<AssistantMessageProps>(({ id, index, disableEditing }) => {
  // Get message and actionsConfig from ConversationStore
  const item = useConversationStore(dataSelectors.getDisplayMessageById(id), isEqual)!;

  const {
    agentId,
    branch,
    error,
    role,
    content,
    createdAt,
    tools,
    extra,
    model,
    provider,
    performance,
    usage,
    metadata,
  } = item;

  const agentMeta = useAgentMeta(agentId);
  const modelCard = useAiInfraStore(
    model ? aiModelSelectors.getEnabledModelById(model, provider ?? '') : () => undefined,
  );
  const modelDisplayName = model
    ? (modelCard?.displayName ?? (model.includes('/') ? model.split('/').at(-1)! : model))
    : undefined;
  const councilMeta = ((metadata as any)?.modelCouncil || undefined) as
    | { role?: string; settingsSnapshot?: ModelCouncilSettings; status?: string }
    | undefined;
  const settingsSnapshot = ((metadata as any)?.settingsSnapshot ||
    councilMeta?.settingsSnapshot) as ModelCouncilSettings | undefined;
  const isModelCouncilAssistant = !!councilMeta;
  const avatar = useMemo(
    () => (modelDisplayName ? { ...agentMeta, title: modelDisplayName } : agentMeta),
    [agentMeta, modelDisplayName],
  );

  // Get editing, generating, creating, and interrupted state from ConversationStore
  const editing = useConversationStore(messageStateSelectors.isMessageEditing(id));
  const generating = useConversationStore(messageStateSelectors.isMessageGenerating(id));
  const isCreating = useConversationStore(messageStateSelectors.isMessageCreating(id));
  const interrupted = useConversationStore(messageStateSelectors.isMessageInterrupted(id));
  const councilProcessingDone =
    isModelCouncilAssistant &&
    (isTerminalCouncilStatus(councilMeta?.status) || (!generating && !isCreating && !!content));

  const errorContent = useErrorContent(error);

  const shouldForceShowError =
    error?.type === 'ProviderBizError' &&
    (error?.body as any)?.provider === 'google' &&
    !!(
      (error?.body as any)?.context?.promptFeedback?.blockReason ||
      (error?.body as any)?.context?.finishReason
    );

  // remove line breaks in artifact tag to make the ast transform easier
  const message = !editing ? normalizeThinkTags(processWithArtifact(content)) : content;

  const onDoubleClick = useDoubleClickEdit({ disableEditing, error, id, role });
  const setMessageItemActionElementPortialContext = useSetMessageItemActionElementPortialContext();
  const setMessageItemActionTypeContext = useSetMessageItemActionTypeContext();

  const isDevMode = useUserStore((s) => userGeneralSettingsSelectors.config(s).isDevMode);

  const onMouseEnter: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (isModelCouncilAssistant && !councilProcessingDone) return;

      setMessageItemActionElementPortialContext(e.currentTarget);
      setMessageItemActionTypeContext({ id, index, type: 'assistant' });
    },
    [
      councilProcessingDone,
      id,
      index,
      isModelCouncilAssistant,
      setMessageItemActionElementPortialContext,
      setMessageItemActionTypeContext,
    ],
  );

  const councilModels = useMemo(() => {
    const configuredModels = settingsSnapshot?.councilModels || [];
    if (configuredModels.length > 0) return configuredModels;

    return model && provider ? [{ model, provider }] : [];
  }, [model, provider, settingsSnapshot?.councilModels]);
  const councilGroupId = useConversationStore(
    useCallback(
      (s) => {
        if (role !== 'assistant') return undefined;

        const messageIndex = s.displayMessages.findIndex((item) => item.id === id);
        const nextMessage = messageIndex >= 0 ? s.displayMessages[messageIndex + 1] : undefined;

        return s.displayMessages.find((message) => {
          if (message.role !== 'compareGroup') return false;

          return (
            message.id === nextMessage?.id ||
            message.children?.some((child) => child.id === id) ||
            (!!item.parentId && item.parentId === message.parentId)
          );
        })?.id;
      },
      [id, item.parentId, role],
    ),
  );
  const councilAboveMessage = councilGroupId ? (
    <ModelCouncilMessage
      embedded
      hideJudgeResponse
      id={councilGroupId}
      index={index}
      judgeMessage={item}
      judgeStatus={generating || isCreating ? 'running' : 'completed'}
    />
  ) : null;

  return (
    <ChatItem
      aboveMessage={councilAboveMessage}
      avatar={avatar}
      customErrorRender={(error) => <ErrorMessageExtra data={item} error={error} />}
      editing={editing}
      id={id}
      loading={generating || isCreating}
      message={message}
      placement={'left'}
      showTitle={!isModelCouncilAssistant}
      time={createdAt}
      actions={
        isModelCouncilAssistant && !councilProcessingDone ? null : (
          <>
            {isDevMode && branch && (
              <MessageBranch
                activeBranchIndex={branch.activeBranchIndex}
                count={branch.count}
                messageId={id}
              />
            )}
            {actionBarHolder}
          </>
        )
      }
      customAvatarRender={
        isModelCouncilAssistant && councilModels.length > 0
          ? () => (
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                {councilModels.map((item, itemIndex) => (
                  <span
                    key={modelKey(item)}
                    style={{
                      alignItems: 'center',
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-bg-container)',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      height: 28,
                      justifyContent: 'center',
                      marginInlineStart: itemIndex === 0 ? 0 : -8,
                      overflow: 'hidden',
                      width: 28,
                    }}
                  >
                    <ModelIcon model={item.model || item.provider} size={20} type={'color'} />
                  </span>
                ))}
              </span>
            )
          : model
            ? () => <ModelIcon model={model} size={28} type={'color'} />
            : undefined
      }
      error={
        errorContent && error && (message === LOADING_FLAT || !message || shouldForceShowError)
          ? errorContent
          : undefined
      }
      messageExtra={
        <>
          {interrupted && <InterruptedHint />}
          <AssistantMessageExtra
            content={content}
            extra={extra}
            id={id}
            model={model!}
            performance={performance! || metadata}
            provider={provider!}
            tools={tools}
            usage={usage! || metadata}
          />
        </>
      }
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
    >
      <MessageContent {...item} hideReasoning={!!councilGroupId} />
    </ChatItem>
  );
}, isEqual);

AssistantMessage.displayName = 'AssistantMessage';

export default AssistantMessage;
