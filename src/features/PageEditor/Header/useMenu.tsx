'use client';

import { isDesktop } from '@lobechat/const';
import { type DropdownItem } from '@lobehub/ui';
import { Icon } from '@lobehub/ui';
import { App } from 'antd';
import { cssVar, useResponsive } from 'antd-style';
import dayjs from 'dayjs';
import { CopyPlus, Download, Link2, Trash2 } from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDocumentStore } from '@/store/document';
import { editorSelectors } from '@/store/document/slices/editor';
import { useFileStore } from '@/store/file';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

import { usePageEditorStore, useStoreApi } from '../store';

type PageFont = 'default' | 'serif' | 'mono';

const FONT_STORAGE_KEY = 'page-editor-font';
const SMALL_TEXT_STORAGE_KEY = 'page-editor-small-text';

const applyFont = (font: PageFont) => {
  document.documentElement.dataset.pageEditorFont = font;
};

const applySmallText = (enabled: boolean) => {
  document.documentElement.dataset.pageEditorSmallText = enabled ? 'true' : 'false';
};

const fontFaceStyles: CSSProperties = {
  alignItems: 'center',
  borderRadius: 8,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  gap: 2,
  padding: '8px 4px',
  transition: 'background 120ms ease',
};

const fontLabelStyles: CSSProperties = {
  color: 'inherit',
  fontSize: 11,
  lineHeight: 1.2,
};

/**
 * Action menu for the page editor.
 */
export const useMenu = (): { menuItems: any[] } => {
  const { t } = useTranslation(['file', 'common', 'chat']);
  const { message, modal } = App.useApp();
  const storeApi = useStoreApi();
  const { lg = true } = useResponsive();

  const documentId = usePageEditorStore((s) => s.documentId);

  const lastUpdatedTime = useDocumentStore((s) =>
    documentId ? editorSelectors.lastUpdatedTime(documentId)(s) : null,
  );

  const duplicateDocument = useFileStore((s) => s.duplicateDocument);

  const [wideScreen, toggleWideScreen] = useGlobalStore((s) => [
    systemStatusSelectors.wideScreen(s),
    s.toggleWideScreen,
  ]);

  const [currentFont, setCurrentFont] = useState<PageFont>(() => {
    try {
      return (localStorage.getItem(FONT_STORAGE_KEY) as PageFont) || 'default';
    } catch {
      return 'default';
    }
  });

  const [smallText, setSmallText] = useState(() => {
    try {
      return localStorage.getItem(SMALL_TEXT_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    applyFont(currentFont);
    try {
      localStorage.setItem(FONT_STORAGE_KEY, currentFont);
    } catch {
      // Ignore unavailable storage in tests or restricted webviews.
    }
  }, [currentFont]);

  useEffect(() => {
    applySmallText(smallText);
    try {
      localStorage.setItem(SMALL_TEXT_STORAGE_KEY, smallText ? 'true' : 'false');
    } catch {
      // Ignore unavailable storage in tests or restricted webviews.
    }
  }, [smallText]);

  // Apply persisted settings on mount
  useEffect(() => {
    applyFont(currentFont);
    applySmallText(smallText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showViewModeSwitch = lg;

  const handleDuplicate = async () => {
    if (!documentId) return;
    try {
      await duplicateDocument(documentId);
      message.success(t('pageEditor.duplicateSuccess'));
    } catch (error) {
      console.error('Failed to duplicate page:', error);
      message.error(t('pageEditor.duplicateError'));
    }
  };

  const handleExportMarkdown = async () => {
    const state = storeApi.getState();
    const { editor, title } = state;

    if (!editor) return;

    try {
      const markdown = (editor.getDocument('markdown') as unknown as string) || '';
      const fileName = `${title || 'Untitled'}.md`;

      if (isDesktop) {
        const { desktopExportService } = await import('@/services/electron/desktopExportService');
        await desktopExportService.exportMarkdown({ content: markdown, fileName });
      } else {
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.append(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        message.success(t('pageEditor.exportSuccess'));
      }
    } catch (error) {
      console.error('Failed to export markdown:', error);
      message.error(t('pageEditor.exportError'));
    }
  };

  const fontPickerLabel = useMemo(
    () => (
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginInline: -8,
          padding: '2px 0 4px',
          width: 'calc(100% + 16px)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {(
          [
            {
              fontFamily: 'inherit',
              key: 'default',
              label: t('pageEditor.menu.font.default'),
            },
            {
              fontFamily: 'Georgia, "Times New Roman", serif',
              key: 'serif',
              label: t('pageEditor.menu.font.serif'),
            },
            {
              fontFamily: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace',
              key: 'mono',
              label: t('pageEditor.menu.font.mono'),
            },
          ] as { fontFamily: string; key: PageFont; label: string }[]
        ).map(({ key, label, fontFamily }) => {
          const isActive = currentFont === key;
          return (
            <button
              key={key}
              type="button"
              style={{
                ...fontFaceStyles,
                background: isActive
                  ? `color-mix(in srgb, ${cssVar.colorPrimary} 12%, transparent)`
                  : 'transparent',
                color: isActive ? cssVar.colorPrimary : cssVar.colorText,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentFont(key);
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background =
                    `color-mix(in srgb, ${cssVar.colorText} 6%, transparent)`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontFamily, fontSize: 22, fontWeight: 500, lineHeight: 1.1 }}>Ag</span>
              <span style={fontLabelStyles}>{label}</span>
            </button>
          );
        })}
      </div>
    ),
    [currentFont, t],
  );

  const menuItems = useMemo<DropdownItem[]>(() => {
    const items: DropdownItem[] = [
      // Font picker row
      {
        key: 'font-picker',
        label: fontPickerLabel,
      },
      { type: 'divider' as const },
      // Page actions
      {
        icon: <Icon icon={Link2} />,
        key: 'copy-link',
        label: t('pageEditor.menu.copyLink'),
        onClick: () => {
          const state = storeApi.getState();
          state.handleCopyLink(t as any, message);
        },
      },
      {
        icon: <Icon icon={CopyPlus} />,
        key: 'duplicate',
        label: t('pageList.duplicate'),
        onClick: handleDuplicate,
      },
      {
        danger: true,
        icon: <Icon icon={Trash2} />,
        key: 'delete',
        label: t('delete', { ns: 'common' }),
        onClick: async () => {
          const state = storeApi.getState();
          await state.handleDelete(t as any, message, modal, state.onDelete);
        },
      },
      { type: 'divider' as const },
      // View options
      {
        checked: smallText,
        key: 'small-text',
        label: t('pageEditor.menu.smallText'),
        onCheckedChange: (checked: boolean) => setSmallText(checked),
        type: 'switch' as const,
      },
      ...(showViewModeSwitch
        ? [
            {
              checked: wideScreen,
              key: 'full-width',
              label: t('viewMode.fullWidth', { ns: 'chat' }),
              onCheckedChange: toggleWideScreen,
              type: 'switch' as const,
            },
          ]
        : []),
      { type: 'divider' as const },
      // Export
      {
        children: [
          {
            key: 'export-markdown',
            label: t('pageEditor.menu.export.markdown'),
            onClick: handleExportMarkdown,
          },
        ],
        icon: <Icon icon={Download} />,
        key: 'export',
        label: t('pageEditor.menu.export'),
      },
    ];

    if (lastUpdatedTime) {
      items.push(
        { type: 'divider' as const },
        {
          disabled: true,
          key: 'page-info',
          label: (
            <div style={{ color: cssVar.colorTextTertiary, fontSize: 12, lineHeight: 1.6 }}>
              {t('pageEditor.editedAt', {
                time: dayjs(lastUpdatedTime).format(t('pageEditor.editedAtTimeFormat')),
              })}
            </div>
          ),
        },
      );
    }

    return items;
  }, [
    currentFont,
    fontPickerLabel,
    lastUpdatedTime,
    message,
    modal,
    showViewModeSwitch,
    smallText,
    storeApi,
    t,
    toggleWideScreen,
    wideScreen,
    handleDuplicate,
    handleExportMarkdown,
  ]);

  return { menuItems };
};
