'use client';

import { nanoid } from '@lobechat/utils';
import { type IEditor } from '@lobehub/editor';
import { type ChatInputActionsProps } from '@lobehub/editor/react';
import { createStaticStyles, cssVar } from 'antd-style';
import { ArrowUpIcon } from 'lucide-react';
import { type KeyboardEvent, memo, type MouseEvent, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePageEditorStore } from '../store';

const styles = createStaticStyles(({ css }) => ({
  input: css`
    flex: 1;

    min-width: 0;
    height: 100%;
    padding: 0;
    border: 0;

    font: inherit;
    font-size: 13px;
    color: ${cssVar.colorText};

    background: transparent;
    outline: none;

    &::placeholder {
      color: ${cssVar.colorTextTertiary};
    }
  `,
  inputBox: css`
    display: flex;
    gap: 6px;
    align-items: center;

    width: 100%;
    height: 36px;
    padding-inline: 12px 6px;
    border: 1px solid color-mix(in srgb, ${cssVar.colorBorder} 72%, transparent);
    border-radius: 999px;

    background: ${cssVar.colorBgElevated};

    &:focus-within {
      border-color: #2383e2;
    }
  `,
  sendButton: css`
    cursor: pointer;

    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;

    width: 26px;
    height: 26px;
    border: 0;
    border-radius: 999px;

    color: #fff;

    background: #2383e2;

    transition: opacity ${cssVar.motionDurationMid} ${cssVar.motionEaseInOut};

    &:disabled {
      cursor: not-allowed;
      color: ${cssVar.colorTextQuaternary};
      background: color-mix(in srgb, ${cssVar.colorText} 10%, transparent);
    }
  `,
}));

interface CapturedSelection {
  content: string;
  format: 'text' | 'xml';
  preview?: string;
  rect: { left: number; top: number; width: number };
}

const captureSelection = (editor: IEditor): CapturedSelection | undefined => {
  const getDoc = (type: string) => {
    try {
      return (editor.getSelectionDocument?.(type) as string) || '';
    } catch {
      return '';
    }
  };

  const xml = getDoc('litexml');
  const plainText = getDoc('text');
  const content = xml.trim() || plainText.trim();
  if (!content) return undefined;

  const format = xml.trim() ? 'xml' : 'text';
  const preview =
    (plainText || xml)
      .replaceAll(/<[^>]*>/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim() || undefined;

  const rangeRect = (() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return undefined;
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (rect.width || rect.height) return rect;
    return undefined;
  })();

  return {
    content,
    format,
    preview,
    rect: {
      left: rangeRect?.left ?? window.innerWidth / 2 - 180,
      top: (rangeRect?.bottom ?? 160) + 12,
      width: rangeRect?.width ?? 360,
    },
  };
};

interface AskCopilotInputProps {
  editor: IEditor;
}

const AskCopilotInput = memo<AskCopilotInputProps>(({ editor }) => {
  const { t } = useTranslation('common');
  const pageId = usePageEditorStore((s) => s.documentId);
  const setAiIsland = usePageEditorStore((s) => s.setAiIsland);
  const [prompt, setPrompt] = useState('');
  const capturedRef = useRef<CapturedSelection | undefined>(undefined);

  const placeholder = t('cmdk.editWithAI');

  // Capture the editor selection before focus moves into the input and collapses it.
  const handleCapture = () => {
    capturedRef.current = captureSelection(editor) ?? capturedRef.current;
  };

  const submit = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    const captured = capturedRef.current ?? captureSelection(editor);
    if (!captured) return;

    // TODO: wire to AI backend.
    setAiIsland({
      content: captured.content,
      format: captured.format,
      id: `selection-${nanoid(6)}`,
      initialPrompt: trimmed,
      pageId,
      preview: captured.preview,
      rect: captured.rect,
    });

    setPrompt('');
    capturedRef.current = undefined;
    window.getSelection()?.removeAllRanges();
    document.dispatchEvent(new Event('page-editor-hide-selection-toolbar'));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const stopBlur = (event: MouseEvent) => event.preventDefault();

  return (
    <div className={styles.inputBox}>
      <input
        aria-label={placeholder}
        className={styles.input}
        placeholder={placeholder}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onFocus={handleCapture}
        onKeyDown={handleKeyDown}
        onMouseDown={handleCapture}
      />
      <button
        aria-label={placeholder}
        className={styles.sendButton}
        disabled={!prompt.trim()}
        type="button"
        onClick={submit}
        onMouseDown={stopBlur}
      >
        <ArrowUpIcon size={15} />
      </button>
    </div>
  );
});

AskCopilotInput.displayName = 'AskCopilotInput';

export const useAskCopilotItem = (editor: IEditor | undefined): ChatInputActionsProps['items'] =>
  useMemo(() => {
    if (!editor) return [];

    return [
      {
        children: <AskCopilotInput editor={editor} />,
        key: 'ask-copilot',
        label: t('cmdk.editWithAI'),
        onClick: () => {},
      },
    ];
  }, [editor, t]);
