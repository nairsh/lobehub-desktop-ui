'use client';

import { nanoid } from '@lobechat/utils';
import { type IEditor } from '@lobehub/editor';
import { type ChatInputActionsProps } from '@lobehub/editor/react';
import { createStaticStyles, cssVar } from 'antd-style';
import { SparklesIcon } from 'lucide-react';
import { type MouseEvent } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { usePageEditorStore } from '../store';

const styles = createStaticStyles(({ css }) => ({
  askCopilot: css`
    cursor: pointer;

    display: inline-flex;
    gap: 6px;
    align-items: center;

    width: 100%;
    height: 28px;
    padding-inline: 7px 6px;
    border: 1px solid color-mix(in srgb, ${cssVar.colorBorder} 72%, transparent);
    border-radius: 6px;

    font-size: 12px;
    font-weight: 400;
    color: ${cssVar.colorTextSecondary};
    white-space: nowrap;

    background: color-mix(in srgb, ${cssVar.colorBgElevated} 92%, ${cssVar.colorText} 8%);

    &:hover {
      border-color: color-mix(in srgb, ${cssVar.colorBorder} 52%, ${cssVar.colorText});
      color: ${cssVar.colorText};
      background: color-mix(in srgb, ${cssVar.colorBgElevated} 88%, ${cssVar.colorText} 12%);
    }
  `,
  askCopilotIcon: css`
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;

    width: 15px;
    height: 15px;

    color: ${cssVar.colorTextTertiary};
  `,
  shortcut: css`
    margin-inline-start: auto;

    font-size: 11px;
    font-weight: 500;
    color: ${cssVar.colorTextQuaternary};
    white-space: nowrap;
  `,
}));

const preventToolbarMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
  event.stopPropagation();
};

export const useAskCopilotItem = (editor: IEditor | undefined): ChatInputActionsProps['items'] => {
  const { t } = useTranslation('common');
  const pageId = usePageEditorStore((s) => s.documentId);
  const setAiIsland = usePageEditorStore((s) => s.setAiIsland);

  return useMemo(() => {
    if (!editor) return [];

    const label = t('cmdk.editWithAI');

    return [
      {
        children: (
          <button
            aria-label={label}
            className={styles.askCopilot}
            type="button"
            onMouseDown={preventToolbarMouseDown}
            onClick={() => {
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

              if (!content) return;

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

              setAiIsland({
                content,
                format,
                id: `selection-${nanoid(6)}`,
                pageId,
                preview,
                rect: {
                  left: rangeRect?.left ?? window.innerWidth / 2 - 180,
                  top: (rangeRect?.bottom ?? 160) + 12,
                  width: rangeRect?.width ?? 360,
                },
              });

              window.getSelection()?.removeAllRanges();
              document.dispatchEvent(new Event('page-editor-hide-selection-toolbar'));
            }}
          >
            <span className={styles.askCopilotIcon}>
              <SparklesIcon size={13} />
            </span>
            <span>{label}</span>
            <span className={styles.shortcut}>{t('cmdk.editWithAIShortcut', '⌘⌃E')}</span>
          </button>
        ),
        key: 'ask-copilot',
        label,
        onClick: () => {},
      },
    ];
  }, [editor, pageId, setAiIsland, t]);
};
