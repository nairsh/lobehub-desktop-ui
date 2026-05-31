'use client';

import { LOADING_FLAT } from '@lobechat/const';
import { useWatchBroadcast } from '@lobechat/electron-client-ipc';
import { Flexbox } from '@lobehub/ui';
import { TypewriterEffect } from '@lobehub/ui/awesome';
import { LoadingDots } from '@lobehub/ui/chat';
import { createStyles, cssVar } from 'antd-style';
import { Maximize2, MessageSquarePlus, SendHorizontal, X } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ChatInputProvider } from '@/features/ChatInput';
import { ActionBarContext } from '@/features/ChatInput/ActionBar/context';
import ModelAction from '@/features/ChatInput/ActionBar/Model';
import PlusActions from '@/features/ChatInput/ActionBar/PlusActions';
import { useChatInputStore } from '@/features/ChatInput/store';
import { ChatList, ConversationProvider, useConversationStore } from '@/features/Conversation';
import { isEditableShortcutTarget, isFloatingChatEvent } from '@/hooks/useHotkeys/shortcutGuards';
import { useOperationState } from '@/hooks/useOperationState';
import { useAgentStore } from '@/store/agent';
import { builtinAgentSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { topicSelectors } from '@/store/chat/selectors';
import { messageMapKey } from '@/store/chat/utils/messageMapKey';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';
import type { ModelCouncilSettings } from '@/types/modelCouncil';

const useStyles = createStyles(({ css, token }) => ({
  body: css`
    overflow: hidden;
    flex: 1;
    min-height: 0;
  `,
  chatList: css`
    overflow: auto;
    flex: 1;
    min-height: 0;
    padding-block: 64px 12px;
  `,
  dragHandle: css`
    cursor: grab;

    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;

    height: 76px;

    &:active {
      cursor: grabbing;
    }
  `,
  inputDock: css`
    padding: 12px;
    background: linear-gradient(180deg, transparent, ${token.colorBgContainer} 20%);
  `,
  inputShell: css`
    display: flex;
    gap: 8px;
    align-items: center;

    min-height: 56px;
    padding-block: 7px;
    padding-inline: 10px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 32px;

    background: ${token.colorBgElevated};
    box-shadow: 0 16px 40px rgb(0 0 0 / 8%);
  `,
  sendButton: css`
    cursor: pointer;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;

    color: ${token.colorBgContainer};

    background: ${token.colorText};

    &:disabled {
      cursor: not-allowed;
      opacity: 0.35;
    }
  `,
  shell: css`
    position: fixed;
    z-index: 1000;

    overflow: hidden;
    display: flex;
    flex-direction: column;

    width: min(560px, calc(100vw - 48px));
    min-width: 360px;
    height: min(700px, calc(100vh - 48px));
    min-height: 440px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 32px;

    background: ${token.colorBgContainer};
    box-shadow:
      0 28px 80px ${token.colorFillSecondary},
      0 10px 34px rgb(0 0 0 / 18%);
  `,
  shellCompact: css`
    width: min(780px, calc(100vw - 48px));
    height: 96px;
    min-height: 96px;
    border-radius: 48px;
  `,
  topButton: css`
    pointer-events: auto;
    cursor: pointer;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 36px !important;
    height: 36px !important;
    border: none;
    border-radius: 50% !important;

    color: ${token.colorText};

    background: ${cssVar.colorFillQuaternary} !important;
    box-shadow: 0 10px 24px rgb(0 0 0 / 8%);
  `,
  title: css`
    pointer-events: none;

    position: absolute;
    z-index: 1;
    inset-block-start: 20px;
    inset-inline: 76px;

    overflow: hidden;

    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    color: ${token.colorTextSecondary};
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  toolbar: css`
    pointer-events: none;

    position: absolute;
    z-index: 2;
    inset-block-start: 16px;
    inset-inline: 16px;

    display: flex;
    justify-content: space-between;
  `,
  textarea: css`
    resize: none;

    flex: 1;

    min-width: 0;
    max-height: 104px;
    padding-block: 0;
    padding-inline: 0;
    border: none;

    font: inherit;
    line-height: 24px;
    color: ${token.colorText};

    background: transparent;
    outline: none;

    &::placeholder {
      color: ${token.colorTextTertiary};
    }
  `,
}));

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const FloatingComposerBody = memo<{
  compact: boolean;
}>(({ compact }) => {
  const { styles } = useStyles();
  const { t } = useTranslation('chat');
  const [value, setValue] = useState('');
  const councilMode = useChatInputStore((s) => s.councilMode);
  const [sendMessage, stopGenerating, operationState] = useConversationStore((s) => [
    s.sendMessage,
    s.stopGenerating,
    s.operationState,
  ]);
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
  const isGenerating = Boolean(operationState?.isInputLoading || operationState?.isAIGenerating);
  const disabled = !value.trim() || isGenerating;

  const handleSend = useCallback(async () => {
    const message = value.trim();
    if (!message || isGenerating) return;

    setValue('');
    await sendMessage({
      message,
      skipTopicSwitch: true,
      useModelCouncil: councilMode && councilReady,
    });
  }, [councilMode, councilReady, isGenerating, sendMessage, value]);

  return (
    <div className={styles.inputShell}>
      <ActionBarContext value={{ actionSize: { blockSize: 28, size: 14 }, borderRadius: 999 }}>
        <PlusActions />
      </ActionBarContext>
      <textarea
        className={styles.textarea}
        placeholder={t('sendPlaceholder')}
        rows={1}
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            void handleSend();
          }
        }}
      />
      {!compact && <ModelAction />}
      <button
        className={styles.sendButton}
        disabled={disabled}
        title={isGenerating ? t('input.stop') : t('input.send')}
        onClick={() => {
          if (isGenerating) {
            stopGenerating();
            return;
          }
          void handleSend();
        }}
      >
        <SendHorizontal size={16} />
      </button>
    </div>
  );
});

FloatingComposerBody.displayName = 'FloatingComposerBody';

const FloatingComposer = memo<{
  agentId: string;
  compact: boolean;
}>(({ agentId, compact }) => {
  const [stopGenerating, operationState] = useConversationStore((s) => [
    s.stopGenerating,
    s.operationState,
  ]);
  const isGenerating = Boolean(operationState?.isInputLoading || operationState?.isAIGenerating);

  return (
    <ChatInputProvider
      supportsCouncil
      agentId={agentId}
      allowExpand={false}
      leftActions={['plusActions']}
      rightActions={['model']}
      sendButtonProps={{
        disabled: isGenerating,
        generating: isGenerating,
        onStop: () => stopGenerating(),
        shape: 'round',
      }}
    >
      <FloatingComposerBody compact={compact} />
    </ChatInputProvider>
  );
});

FloatingComposer.displayName = 'FloatingComposer';

const FloatingChat = memo(() => {
  const { styles, cx } = useStyles();
  const { t } = useTranslation('electron');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [position, setPosition] = useState({ x: 48, y: 48 });
  const [floatingTopicId, setFloatingTopicId] = useState<string | null>(null);
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);

  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const agentId = activeAgentId || inboxAgentId;
  const topicTitle = useChatStore((s) =>
    floatingTopicId ? topicSelectors.getTopicById(floatingTopicId)(s)?.title : undefined,
  );
  const displayTitle = topicTitle && topicTitle !== LOADING_FLAT ? topicTitle : undefined;

  const context = useMemo(
    () => ({ agentId, scope: 'main' as const, topicId: floatingTopicId }),
    [floatingTopicId, agentId],
  );
  const chatKey = useMemo(() => messageMapKey(context), [context]);
  const replaceMessages = useChatStore((s) => s.replaceMessages);
  const messages = useChatStore((s) => s.dbMessagesMap[chatKey]);
  const operationState = useOperationState(context);

  const openOverlay = useCallback(() => {
    setOpen(true);
    setCompact(false);
  }, []);

  useWatchBroadcast('openFloatingChat', openOverlay);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isFloatingChatEvent(event)) return;
      if (isEditableShortcutTarget(event.target)) return;

      event.preventDefault();
      openOverlay();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openOverlay]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      dragRef.current = {
        offsetX: event.clientX - position.x,
        offsetY: event.clientY - position.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [position.x, position.y],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      const width = compact
        ? Math.min(780, window.innerWidth - 48)
        : Math.min(560, window.innerWidth - 48);
      const height = compact ? 96 : Math.min(700, window.innerHeight - 48);
      setPosition({
        x: clamp(event.clientX - dragRef.current.offsetX, 16, window.innerWidth - width - 16),
        y: clamp(event.clientY - dragRef.current.offsetY, 16, window.innerHeight - height - 16),
      });
    },
    [compact],
  );

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const handleExpand = useCallback(() => {
    setOpen(false);
    if (agentId) navigate(`/agent/${agentId}${floatingTopicId ? `?topic=${floatingTopicId}` : ''}`);
  }, [agentId, floatingTopicId, navigate]);

  const handleNewChat = useCallback(() => {
    setFloatingTopicId(null);
    setCompact(false);
    setOpen(true);
  }, []);

  if (!open || !agentId) return null;

  return (
    <div
      className={cx(styles.shell, compact && styles.shellCompact)}
      data-testid="floating-chat"
      style={{ left: position.x, top: position.y }}
    >
      <div
        className={styles.dragHandle}
        onDoubleClick={() => setCompact((value) => !value)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <div className={styles.toolbar}>
        <button
          className={styles.topButton}
          title={t('tab.closeCurrentTab')}
          onClick={() => setOpen(false)}
        >
          <X size={19} />
        </button>
        {displayTitle && !compact && (
          <div className={styles.title}>
            <TypewriterEffect
              cursorCharacter={<LoadingDots size={14} variant={'pulse'} />}
              cursorFade={false}
              hideCursorWhileTyping={'afterTyping'}
              key={displayTitle}
              sentences={[displayTitle]}
              typingSpeed={64}
            />
          </div>
        )}
        <Flexbox horizontal gap={8}>
          <button className={styles.topButton} title={t('tab.newTab')} onClick={handleNewChat}>
            <MessageSquarePlus size={18} />
          </button>
          <button
            className={styles.topButton}
            title={t('tab.expandFloatingChat')}
            onClick={handleExpand}
          >
            <Maximize2 size={18} />
          </button>
        </Flexbox>
      </div>
      <ConversationProvider
        hasInitMessages
        context={context}
        messages={messages ?? []}
        operationState={operationState}
        hooks={{
          onAfterMessageCreate: async ({ topicId }) => {
            if (topicId) setFloatingTopicId(topicId);
          },
        }}
        onMessagesChange={(nextMessages, ctx) => {
          replaceMessages(nextMessages, { context: ctx });
        }}
      >
        {!compact && (
          <div className={styles.chatList}>
            <ChatList disableActionsBar />
          </div>
        )}
        <div className={styles.inputDock}>
          <FloatingComposer agentId={agentId} compact={compact} />
        </div>
      </ConversationProvider>
    </div>
  );
});

FloatingChat.displayName = 'FloatingChat';

export default FloatingChat;
