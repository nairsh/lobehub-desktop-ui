'use client';

import { Markdown } from '@lobehub/ui';
import { createStaticStyles, cssVar } from 'antd-style';
import {
  FileTextIcon,
  MicIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SendIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  XIcon,
} from 'lucide-react';
import { type CSSProperties, memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useConversationStore } from '@/features/Conversation';

import { usePageEditorStore } from '../store';

const styles = createStaticStyles(({ css }) => ({
  answer: css`
    overflow: auto;
    display: flex;
    gap: 8px;

    min-height: 42px;
    max-height: 178px;
    padding-block: 7px;
    padding-inline: 10px;

    font-size: 13px;
    line-height: 1.42;
    color: ${cssVar.colorText};

    background: transparent;
  `,
  answerIcon: css`
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;

    width: 20px;
    height: 20px;
    border: 0;
    border-radius: 999px;

    color: ${cssVar.colorTextSecondary};

    background: color-mix(in srgb, ${cssVar.colorText} 6%, transparent);
  `,
  answerText: css`
    min-width: 0;
  `,
  closeButton: css`
    cursor: pointer;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 20px;
    height: 20px;
    border: 0;
    border-radius: 5px;

    color: ${cssVar.colorTextSecondary};

    background: transparent;

    &:hover {
      color: ${cssVar.colorText};
      background: ${cssVar.colorFillTertiary};
    }
  `,
  input: css`
    resize: none;

    width: 100%;
    min-height: 42px;
    max-height: 96px;
    padding-block: 2px;
    padding-inline: 0;
    border: 0;

    font: inherit;
    font-size: 13px;
    line-height: 18px;
    color: ${cssVar.colorText};

    background: transparent;
    outline: none;

    &::placeholder {
      color: ${cssVar.colorTextTertiary};
    }

    &:focus {
      box-shadow: none;
    }
  `,
  inputChrome: css`
    display: flex;
    flex-direction: column;
    gap: 7px;

    min-height: 126px;
    padding-block: 9px 8px;
    padding-inline: 10px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 12px;

    background: ${cssVar.colorBgElevated};

    &:focus-within {
      border-color: #2383e2;
      box-shadow: 0 0 0 1px #2383e2;
    }
  `,
  inputFooter: css`
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  `,
  inputTools: css`
    display: flex;
    gap: 4px;
    align-items: center;
  `,
  island: css`
    position: fixed;
    z-index: 1800;

    display: flex;
    flex-direction: column;
    gap: 10px;

    width: var(--page-ai-island-width);
    min-height: 0;
    padding: 10px;
    border: 1px solid color-mix(in srgb, ${cssVar.colorBorder} 72%, transparent);
    border-radius: 14px;

    background: ${cssVar.colorBgElevated};
    box-shadow:
      0 18px 46px rgb(15 23 42 / 14%),
      0 2px 8px rgb(15 23 42 / 8%);
  `,
  contextChip: css`
    display: inline-flex;
    gap: 5px;
    align-items: center;

    width: fit-content;
    max-width: 190px;
    height: 22px;
    padding-inline: 7px;
    border-radius: 6px;

    font-size: 12px;
    line-height: 1;
    color: ${cssVar.colorTextSecondary};

    background: color-mix(in srgb, ${cssVar.colorText} 6%, transparent);
  `,
  header: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 24px;
  `,
  headerTitle: css`
    display: inline-flex;
    gap: 7px;
    align-items: center;

    font-size: 13px;
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  messageBubble: css`
    align-self: flex-end;

    max-width: 88%;
    padding-block: 7px;
    padding-inline: 10px;
    border-radius: 13px;

    font-size: 13px;
    line-height: 1.38;
    color: ${cssVar.colorText};

    background: color-mix(in srgb, ${cssVar.colorText} 7%, transparent);
  `,
  messageList: css`
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;

    min-height: 170px;
    max-height: 250px;
    padding-block: 6px 2px;
    padding-inline: 2px;
  `,
  modelButton: css`
    cursor: pointer;

    display: inline-flex;
    gap: 5px;
    align-items: center;

    height: 22px;
    padding-inline: 7px;
    border: 0;
    border-radius: 6px;

    font-size: 12px;
    color: ${cssVar.colorTextSecondary};

    background: transparent;

    &:hover {
      color: ${cssVar.colorText};
      background: ${cssVar.colorFillTertiary};
    }
  `,
  sendButton: css`
    cursor: pointer;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 24px;
    height: 24px;
    border: 0;
    border-radius: 999px;

    color: ${cssVar.colorTextSecondary};

    background: color-mix(in srgb, ${cssVar.colorText} 8%, transparent);

    &:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }

    &:not(:disabled) {
      color: ${cssVar.colorBgContainer};
      opacity: 1;
      background: ${cssVar.colorText};
    }
  `,
  settingsButton: css`
    cursor: pointer;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 22px;
    height: 22px;
    border: 0;
    border-radius: 5px;

    color: ${cssVar.colorTextSecondary};

    background: transparent;

    &:hover {
      color: ${cssVar.colorText};
      background: ${cssVar.colorFillTertiary};
    }
  `,
  suggestions: css`
    display: flex;
    flex-direction: column;
    gap: 1px;
  `,
  suggestionButton: css`
    cursor: pointer;

    display: flex;
    gap: 8px;
    align-items: center;

    height: 31px;
    padding-inline: 8px;
    border: 0;
    border-radius: 7px;

    font-size: 13px;
    color: ${cssVar.colorText};
    text-align: start;

    background: transparent;

    &:hover {
      background: color-mix(in srgb, ${cssVar.colorText} 6%, transparent);
    }
  `,
}));

const PageAiIsland = memo(() => {
  const { t } = useTranslation('editor');
  const aiIsland = usePageEditorStore((s) => s.aiIsland);
  const closeAiIsland = usePageEditorStore((s) => s.closeAiIsland);
  const documentId = usePageEditorStore((s) => s.documentId);
  const setAiIsland = usePageEditorStore((s) => s.setAiIsland);
  const sendMessage = useConversationStore((s) => s.sendMessage);
  const messages = useConversationStore((s) => s.displayMessages);
  const [prompt, setPrompt] = useState('');
  const [submittedPrompt, setSubmittedPrompt] = useState('');
  const [hasAsked, setHasAsked] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoSubmittedRef = useRef<string | undefined>(undefined);
  const aiIslandId = aiIsland?.id;

  useEffect(() => {
    const handleOpenAiIsland = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | {
            content?: string;
            preview?: string;
            rect?: { left: number; top: number; width: number };
          }
        | undefined;

      if (!detail?.rect) return;

      setAiIsland({
        content: detail.content || '',
        format: 'text',
        id: `block-menu-${Date.now()}`,
        pageId: documentId,
        preview: detail.preview,
        rect: detail.rect,
      });
    };

    window.addEventListener('page-editor-open-ai-island', handleOpenAiIsland);

    return () => {
      window.removeEventListener('page-editor-open-ai-island', handleOpenAiIsland);
    };
  }, [documentId, setAiIsland]);

  useEffect(() => {
    if (!aiIslandId) return;
    setPrompt('');
    setSubmittedPrompt('');
    setHasAsked(false);
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);

    return () => window.clearTimeout(focusTimer);
  }, [aiIslandId]);

  const position = useMemo(() => {
    if (!aiIsland) return undefined;

    const width = 390;
    const rightPanelLeft = window.innerWidth - width - 24;
    const preferredLeft =
      window.innerWidth >= 960
        ? rightPanelLeft
        : aiIsland.rect.left + aiIsland.rect.width / 2 - width / 2;
    const left = Math.max(16, Math.min(preferredLeft, window.innerWidth - width - 16));
    const top = Math.max(118, Math.min(aiIsland.rect.top - 6, window.innerHeight - 470));

    return { left, top };
  }, [aiIsland]);

  const lastAssistantMessage = useMemo(() => {
    if (!hasAsked) return undefined;
    return [...messages].reverse().find((message) => message.role === 'assistant');
  }, [hasAsked, messages]);
  const assistantContent = lastAssistantMessage?.content?.trim();
  const isAssistantPlaceholder = !assistantContent || assistantContent === '...';

  const submit = async (message: string) => {
    if (!aiIsland) return;

    const trimmed = message.trim();
    if (!trimmed) return;

    setPrompt('');
    setSubmittedPrompt(trimmed);
    setHasAsked(true);
    window.getSelection()?.removeAllRanges();
    document.documentElement.dataset.pageEditorTextSelection = 'false';
    document.dispatchEvent(new Event('selectionchange'));
    document.dispatchEvent(new Event('page-editor-hide-selection-toolbar'));

    // TODO: wire to AI backend.
    await sendMessage({
      message: trimmed,
      pageSelections: [
        {
          content: aiIsland.preview || aiIsland.content,
          id: aiIsland.id,
          pageId: aiIsland.pageId || '',
          xml: aiIsland.content,
        },
      ],
    });
  };

  // TODO: wire to AI backend when the shell is promoted from UI preview.
  // Prefill the prompt typed in the selection toolbar's inline input.
  useEffect(() => {
    if (!aiIsland?.initialPrompt) return;
    if (autoSubmittedRef.current === aiIsland.id) return;
    autoSubmittedRef.current = aiIsland.id;
    setPrompt(aiIsland.initialPrompt);
  }, [aiIsland?.id, aiIsland?.initialPrompt]);

  if (!aiIsland || !position) return null;

  const contextLabel =
    aiIsland.preview || aiIsland.pageId ? t('pageAiIsland.contextPage') : undefined;
  const suggestions = [
    {
      label: t('pageAiIsland.improve'),
      prompt: t('pageAiIsland.prompt.improve'),
    },
    {
      label: t('pageAiIsland.explain'),
      prompt: t('pageAiIsland.prompt.explain'),
    },
    {
      label: t('pageAiIsland.proofread'),
      prompt: t('pageAiIsland.prompt.proofread'),
    },
  ];

  return (
    <div
      className={styles.island}
      style={{ ...position, '--page-ai-island-width': '390px' } as CSSProperties}
    >
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.answerIcon}>
            <SparklesIcon size={12} />
          </span>
          <span>{t('pageAiIsland.title')}</span>
        </div>
        <button
          aria-label={t('pageAiIsland.close')}
          className={styles.closeButton}
          type="button"
          onClick={closeAiIsland}
        >
          <XIcon size={13} />
        </button>
      </div>
      {hasAsked ? (
        <div className={styles.messageList}>
          <div className={styles.messageBubble}>{submittedPrompt}</div>
          <div className={styles.answer}>
            <span className={styles.answerIcon}>
              <SparklesIcon size={13} />
            </span>
            <div className={styles.answerText}>
              {!isAssistantPlaceholder ? (
                <Markdown variant="chat">{assistantContent}</Markdown>
              ) : (
                t('pageAiIsland.thinking')
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.suggestions}>
          {suggestions.map((item) => (
            <button
              className={styles.suggestionButton}
              key={item.label}
              type="button"
              onClick={() => setPrompt(item.prompt)}
            >
              <SparklesIcon size={14} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
      <div className={styles.inputChrome}>
        {contextLabel ? (
          <span className={styles.contextChip}>
            <FileTextIcon size={12} />
            <span>{contextLabel}</span>
          </span>
        ) : null}
        <textarea
          className={styles.input}
          placeholder={t('pageAiIsland.placeholder')}
          ref={inputRef}
          rows={1}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void submit(prompt);
            }
          }}
        />
        <div className={styles.inputFooter}>
          <div className={styles.inputTools}>
            <button
              aria-label={t('pageAiIsland.addContext')}
              className={styles.settingsButton}
              type="button"
            >
              <PlusIcon size={14} />
            </button>
            <button
              aria-label={t('pageAiIsland.settings')}
              className={styles.settingsButton}
              type="button"
            >
              <SlidersHorizontalIcon size={14} />
            </button>
          </div>
          <div className={styles.inputTools}>
            <button className={styles.modelButton} type="button">
              <SparklesIcon size={12} />
              <span>{t('pageAiIsland.model')}</span>
            </button>
            <button
              aria-label={t('pageAiIsland.voice')}
              className={styles.settingsButton}
              type="button"
            >
              <MicIcon size={14} />
            </button>
            <button
              aria-label={t('pageAiIsland.more')}
              className={styles.settingsButton}
              type="button"
            >
              <MoreHorizontalIcon size={14} />
            </button>
            <button
              className={styles.sendButton}
              disabled={!prompt.trim()}
              type="button"
              onClick={() => void submit(prompt)}
            >
              <SendIcon size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

PageAiIsland.displayName = 'PageAiIsland';

export default PageAiIsland;
