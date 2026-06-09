'use client';

import { isDesktop } from '@lobechat/const';
import { IBlockMenuService, type IEditor, type ISlashOption } from '@lobehub/editor';
import {
  ReactBlockPlugin,
  ReactImagePlugin,
  ReactLinkPlugin,
  ReactLiteXmlPlugin,
  ReactTablePlugin,
} from '@lobehub/editor';
import { Editor, useEditorState } from '@lobehub/editor/react';
import { createStaticStyles, cssVar, cx } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { $createParagraphNode, $createTextNode, $getNodeByKey, $getRoot } from 'lexical';
import { ChevronRightIcon } from 'lucide-react';
import {
  type ComponentType,
  type FormEvent,
  type KeyboardEvent,
  memo,
  type MouseEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { createChatInputRichPlugins } from '@/features/ChatInput/InputEditor/plugins';

import { type EditorCanvasProps } from './EditorCanvas';
import InlineToolbar from './InlineToolbar';
import { useImageUpload } from './useImageUpload';

const IMAGE_FILTERS = [
  { extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'], name: 'Images' },
];
const SELECTION_MENU_ESTIMATED_HEIGHT = 510;
const SELECTION_MENU_WIDTH = 320;
const SLASH_MENU_MAX_HEIGHT = 500;
const SLASH_MENU_WIDTH = 430;

const escapeCssContent = (value: string) => value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");

const getBlockOperationPortalStyles = (searchPlaceholder: string) => `
  body:has(.lobe-block-operation-dropdown)
    [data-lobe-editor-hovered-block='true'],
  html[data-page-editor-dragging-block='true']
    [data-lobe-editor-hovered-block='true'] {
    background: color-mix(in srgb, var(--lobe-color-primary, #2383e2) 12%, transparent);
    border-radius: 2px;
    box-shadow:
      -4px 0 0 color-mix(in srgb, var(--lobe-color-primary, #2383e2) 12%, transparent),
      4px 0 0 color-mix(in srgb, var(--lobe-color-primary, #2383e2) 12%, transparent);
  }

  .ant-btn[aria-label='Add block below'],
  .ant-btn[aria-label='Block actions and drag'] {
    width: 22px !important;
    height: 22px !important;
    min-width: 22px !important;
    padding: 0 !important;
    border-radius: 4px !important;
    color: var(--lobe-color-text-quaternary, rgba(0, 0, 0, 0.34)) !important;
    opacity: 0.72;
    transition: background-color 120ms ease, color 120ms ease, opacity 120ms ease;
  }

  html:not([data-page-editor-block-gutter='true'])
    .ant-btn[aria-label='Add block below'],
  html:not([data-page-editor-block-gutter='true'])
    .ant-btn[aria-label='Block actions and drag'] {
    opacity: 0 !important;
    pointer-events: none !important;
  }

  .ant-btn[aria-label='Add block below']:has(+ .ant-btn[aria-label='Block actions and drag']),
  .ant-btn[aria-label='Block actions and drag'] {
    transform: translateX(8px);
  }

  .ant-btn[aria-label='Add block below']:hover,
  .ant-btn[aria-label='Block actions and drag']:hover,
  .ant-btn[aria-label='Add block below']:focus-visible,
  .ant-btn[aria-label='Block actions and drag']:focus-visible {
    background: color-mix(in srgb, var(--lobe-color-text, #1f1f1f) 8%, transparent) !important;
    color: var(--lobe-color-text-secondary, rgba(0, 0, 0, 0.65)) !important;
    opacity: 1;
  }

  .ant-btn[aria-label='Add block below'] svg,
  .ant-btn[aria-label='Block actions and drag'] svg {
    width: 13px !important;
    height: 13px !important;
  }

  .lobe-block-operation-dropdown {
    transform: translate(2px, 30px) !important;
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu {
    min-width: 360px;
    margin-top: 8px;
    padding: 10px;
    border: 1px solid color-mix(in srgb, var(--lobe-color-border, rgba(0, 0, 0, 0.12)) 70%, transparent);
    border-radius: 14px;
    background: var(--lobe-color-bg-elevated, #fff);
    box-shadow: 0 18px 48px rgba(15, 23, 42, 0.14), 0 3px 10px rgba(15, 23, 42, 0.08);
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu::before {
    content: '${escapeCssContent(searchPlaceholder)}';
    display: flex;
    align-items: center;
    height: 38px;
    margin-bottom: 8px;
    padding-inline: 12px;
    border: 1px solid color-mix(in srgb, var(--lobe-color-border, rgba(0, 0, 0, 0.12)) 82%, transparent);
    border-radius: 9px;
    background: color-mix(in srgb, var(--lobe-color-bg-container, #fff) 96%, var(--lobe-color-text, #1f1f1f) 4%);
    color: var(--lobe-color-text-tertiary, rgba(0, 0, 0, 0.45));
    font-size: 17px;
    line-height: 18px;
    pointer-events: none;
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu-item {
    min-height: 42px;
    padding: 8px 10px !important;
    border-radius: 7px !important;
    color: var(--lobe-color-text, #1f1f1f) !important;
    font-size: 18px;
    line-height: 24px;
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu-item:hover {
    background: color-mix(in srgb, var(--lobe-color-text, #1f1f1f) 6%, transparent) !important;
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu-item-active {
    background: color-mix(in srgb, var(--lobe-color-text, #1f1f1f) 8%, transparent) !important;
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu-title-content {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu-title-content::before {
    content: '';
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 4px;
    background: transparent;
    color: var(--lobe-color-text-quaternary, rgba(0, 0, 0, 0.34));
    font-size: 17px;
    font-weight: 600;
    line-height: 1;
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu-item:nth-child(1) .ant-dropdown-menu-title-content::before {
    content: 'C';
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu-item:nth-child(2) .ant-dropdown-menu-title-content::before {
    content: '↗';
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu-item:nth-child(3) .ant-dropdown-menu-title-content::before {
    content: '⧉';
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu-item:nth-child(4) .ant-dropdown-menu-title-content::before {
    content: '↪';
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu-item:nth-child(5) .ant-dropdown-menu-title-content::before {
    content: '⌫';
    color: var(--lobe-color-error, #d93025);
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu-item:nth-child(6),
  .lobe-block-operation-dropdown .ant-dropdown-menu-item:nth-child(8),
  .lobe-block-operation-dropdown .ant-dropdown-menu-item:nth-child(9) {
    border-top: 1px solid color-mix(in srgb, var(--lobe-color-border, rgba(0, 0, 0, 0.12)) 65%, transparent);
    margin-top: 6px !important;
    padding-top: 12px !important;
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu-item:nth-child(6) .ant-dropdown-menu-title-content::before {
    content: '☰';
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu-item:nth-child(7) .ant-dropdown-menu-title-content::before {
    content: '✎';
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu-item:nth-child(8) .ant-dropdown-menu-title-content::before {
    content: '▶';
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu-item:nth-child(9) .ant-dropdown-menu-title-content::before {
    content: '✧';
  }

  html[data-page-editor-dragging-block='true'] .lobe-block-operation-dropdown {
    opacity: 0;
    pointer-events: none;
  }

  html[data-page-editor-block-menu-dismissed='true'] .lobe-block-operation-dropdown {
    display: none !important;
  }

  html[data-page-editor-text-selection='true'] .lobe-block-operation-dropdown,
  html[data-page-editor-text-selection='true'] .ant-btn[aria-label='Add block below'],
  html[data-page-editor-text-selection='true'] .ant-btn[aria-label='Block actions and drag'] {
    opacity: 0;
    pointer-events: none;
  }
`;

/**
 * Base plugins for the editor (without image and toolbar, which need dynamic config)
 */
const STATIC_PLUGINS = [
  ReactLiteXmlPlugin,
  ...createChatInputRichPlugins({ linkPlugin: ReactLinkPlugin }),
  ReactTablePlugin,
];

const styles = createStaticStyles(({ css }) => ({
  blockRoot: css`
    padding-inline: 30px 0 !important;
  `,
  documentSurface: css`
    [data-lexical-editor='true'] {
      width: calc(100% + 30px);
      margin-inline-start: -30px;
      padding-inline: 30px 0 !important;

      font-size: 15px;
      line-height: 1.58;
      color: ${cssVar.colorText};
    }

    [data-lexical-editor='true'] ::selection {
      background: rgb(35 131 226 / 24%);
    }

    [data-lexical-editor='true'] > * {
      min-height: 24px;
      margin-block: 0;
    }

    [data-block-drag-handle='true'],
    [aria-label='Block actions and drag'],
    [aria-label='Add block below'] {
      width: 22px !important;
      height: 22px !important;
      border-radius: 4px !important;

      color: ${cssVar.colorTextQuaternary} !important;

      opacity: 0.72;

      transition:
        background-color ${cssVar.motionDurationFast} ${cssVar.motionEaseInOut},
        color ${cssVar.motionDurationFast} ${cssVar.motionEaseInOut},
        opacity ${cssVar.motionDurationFast} ${cssVar.motionEaseInOut};
    }

    [data-block-drag-handle='true']:hover,
    [aria-label='Block actions and drag']:hover,
    [aria-label='Add block below']:hover {
      color: ${cssVar.colorTextSecondary} !important;
      opacity: 1;
      background: color-mix(in srgb, ${cssVar.colorText} 8%, transparent) !important;
    }

    [aria-label='Add block below'] svg,
    [aria-label='Block actions and drag'] svg {
      width: 13px !important;
      height: 13px !important;
    }
  `,
  slashMenu: css`
    position: fixed;
    z-index: 1500;
    transform-origin: top center;

    overflow: hidden;

    width: min(${SLASH_MENU_WIDTH}px, calc(100vw - 24px));
    max-height: min(${SLASH_MENU_MAX_HEIGHT}px, calc(100vh - 24px));
    padding: 8px;
    border: 1px solid color-mix(in srgb, ${cssVar.colorBorder} 72%, transparent);
    border-radius: 14px;

    background: ${cssVar.colorBgElevated};
    box-shadow:
      0 18px 44px rgb(15 23 42 / 13%),
      0 3px 10px rgb(15 23 42 / 8%);

    animation: lobe-slash-menu-pop 120ms cubic-bezier(0.16, 1, 0.3, 1);
  `,
  slashMenuSectionLabel: css`
    display: flex;
    align-items: center;

    height: 24px;
    padding-inline: 8px;

    font-size: 15px;
    font-weight: 600;
    color: ${cssVar.colorTextTertiary};
  `,
  slashMenuDivider: css`
    height: 1px;
    margin-block: 8px 6px;
    background: color-mix(in srgb, ${cssVar.colorBorder} 58%, transparent);
  `,
  slashMenuFooter: css`
    display: flex;
    align-items: center;
    justify-content: space-between;

    height: 42px;
    margin-block: 8px -8px;
    margin-inline: -8px;
    padding-inline: 14px;
    border-block-start: 1px solid color-mix(in srgb, ${cssVar.colorBorder} 58%, transparent);

    font-size: 17px;
    color: ${cssVar.colorTextSecondary};
  `,
  slashMenuFooterShortcut: css`
    font-size: 16px;
    color: ${cssVar.colorTextQuaternary};
  `,
  slashMenuList: css`
    overflow: hidden auto;
    max-height: min(438px, calc(100vh - 84px));
  `,
  slashMenuItem: css`
    cursor: pointer;

    display: grid;
    grid-template-columns: 30px minmax(0, 1fr) auto 16px;
    gap: 10px;
    align-items: center;

    width: 100%;
    min-height: 40px;
    padding-block: 5px;
    padding-inline: 9px;
    border: 0;
    border-radius: 12px;

    color: ${cssVar.colorText};
    text-align: start;

    background: transparent;

    &:hover {
      background: color-mix(in srgb, ${cssVar.colorText} 8%, transparent);
    }
  `,
  slashMenuItemActive: css`
    background: color-mix(in srgb, ${cssVar.colorText} 9%, transparent);
  `,
  slashMenuItemExtra: css`
    overflow: hidden;
    display: none;

    font-size: 12px;
    line-height: 1.35;
    color: ${cssVar.colorTextTertiary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  slashMenuItemIcon: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 30px;
    height: 30px;
    border-radius: 8px;

    color: ${cssVar.colorTextTertiary};

    background: color-mix(in srgb, ${cssVar.colorText} 5%, transparent);
  `,
  slashMenuItemTitle: css`
    overflow: hidden;
    display: block;

    font-size: 17px;
    font-weight: 400;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  slashMenuShortcut: css`
    font-size: 16px;
    color: ${cssVar.colorTextQuaternary};
    white-space: nowrap;
  `,
}));

interface SlashFallbackState {
  activeIndex: number;
  blockId: string;
  left: number;
  query: string;
  top: number;
  triggerText?: string;
}

type BlockHoverContext = { blockElement: HTMLElement; blockId: string } | null;

const isSlashMenuOption = (
  item: ISlashOption,
): item is Exclude<ISlashOption, { type: 'divider' }> => !('type' in item);

const isSelectionAtBlockStart = (selection: Selection, block: HTMLElement) => {
  const range = selection.getRangeAt(0);
  const prefixRange = range.cloneRange();

  prefixRange.selectNodeContents(block);
  prefixRange.setEnd(range.startContainer, range.startOffset);

  return prefixRange.toString().trim().length === 0;
};

const getSelectionPrefixText = (selection: Selection, block: HTMLElement) => {
  const range = selection.getRangeAt(0);
  const prefixRange = range.cloneRange();

  prefixRange.selectNodeContents(block);
  prefixRange.setEnd(range.startContainer, range.startOffset);

  return prefixRange.toString();
};

const matchesSlashQuery = (item: Exclude<ISlashOption, { type: 'divider' }>, query: string) => {
  if (!query) return true;

  const normalizedQuery = query.toLowerCase();
  const description =
    typeof item.metadata?.description === 'string' ? item.metadata.description : '';
  const haystack = `${item.key} ${String(item.label)} ${description}`.toLowerCase();

  return haystack.includes(normalizedQuery);
};

const getSlashShortcut = (key: string) => {
  const shortcuts: Record<string, string> = {
    h1: '#',
    h2: '##',
    h3: '###',
    h4: '####',
    hr: '---',
    ol: '1.',
    quote: '"',
    tl: '[]',
    ul: '-',
  };

  return shortcuts[key];
};

const getSlashFallbackPosition = (selection: Selection, block: HTMLElement) => {
  const rangeRect = selection.getRangeAt(0).getBoundingClientRect();
  const blockRect = block.getBoundingClientRect();
  const menuWidth = Math.min(SLASH_MENU_WIDTH, window.innerWidth - 24);
  const menuHeight = Math.min(SLASH_MENU_MAX_HEIGHT, window.innerHeight - 24);
  const anchorLeft = (rangeRect.width || rangeRect.height ? rangeRect.left : blockRect.left) - 2;
  const anchorBottom = (rangeRect.height ? rangeRect.bottom : blockRect.bottom) + 8;
  const anchorTop = (rangeRect.height ? rangeRect.top : blockRect.top) - 8;
  const left = Math.min(Math.max(12, anchorLeft), Math.max(12, window.innerWidth - menuWidth - 12));
  const top =
    anchorBottom + menuHeight <= window.innerHeight - 12
      ? anchorBottom
      : Math.max(12, Math.min(anchorTop - menuHeight, window.innerHeight - menuHeight - 12));

  return { left, top };
};

const isInEditorGutter = (target: HTMLElement | null, clientX: number) => {
  if (target?.closest('.lobe-block-operation-dropdown')) return true;

  const root = target?.closest('[data-lexical-editor="true"]') as HTMLElement | null;
  if (!root)
    return Boolean(
      target?.closest("[aria-label='Add block below'], [aria-label='Block actions and drag']"),
    );

  const rootRect = root.getBoundingClientRect();
  const paddingLeft = Number.parseFloat(window.getComputedStyle(root).paddingLeft || '0');

  return clientX <= rootRect.left + Math.max(paddingLeft, 32);
};

export interface InternalEditorProps extends EditorCanvasProps {
  /**
   * Optional lock ref to suppress content-change callback during programmatic document hydration.
   */
  contentChangeLockRef?: RefObject<boolean>;

  /**
   * Editor instance (required)
   */
  editor: IEditor;
}

/**
 * Internal EditorCanvas component that requires editor instance
 */
const InternalEditor = memo<InternalEditorProps>(
  ({
    contentChangeLockRef,
    editor,
    extraPlugins,
    floatingToolbar = true,
    onContentChange,
    onInit,
    placeholder,
    plugins: customPlugins,
    slashItems,
    style,
    toolbarExtraItems,
  }) => {
    const { t } = useTranslation('file');
    const { t: tEditor } = useTranslation('editor');
    const editorState = useEditorState(editor);
    const handleImageUpload = useImageUpload();
    const [selectionToolbarPosition, setSelectionToolbarPosition] = useState<
      { left: number; top: number } | undefined
    >();
    const [slashFallback, setSlashFallback] = useState<SlashFallbackState>();
    const hoveredBlockElementRef = useRef<HTMLElement | null>(null);
    const slashOpenRequestedRef = useRef(false);
    const slashOpenTimerRef = useRef<number | undefined>(undefined);

    const handleHoverBlockChange = useCallback((context: BlockHoverContext) => {
      if (document.querySelector('.lobe-block-operation-dropdown .ant-dropdown-menu')) return;

      if (
        hoveredBlockElementRef.current &&
        hoveredBlockElementRef.current !== context?.blockElement
      ) {
        delete hoveredBlockElementRef.current.dataset.lobeEditorHoveredBlock;
      }

      hoveredBlockElementRef.current = context?.blockElement ?? null;

      if (context?.blockElement) {
        context.blockElement.dataset.lobeEditorHoveredBlock = 'true';
      }
    }, []);

    const handleDragTargetChange = useCallback((target: unknown) => {
      document.documentElement.dataset.pageEditorDraggingBlock = target ? 'true' : 'false';
    }, []);

    const handleDragTargetResolve = useCallback(() => {
      document.documentElement.dataset.pageEditorDraggingBlock = 'false';
    }, []);

    const handlePickFile = useCallback(async (): Promise<File | null> => {
      if (!isDesktop) return null;
      const { ensureElectronIpc } = await import('@/utils/electron/ipc');
      const ipc = ensureElectronIpc();
      const result = await (ipc as any).localSystem.handlePickFile({
        filters: IMAGE_FILTERS,
      });
      if (result.canceled || !result.file) return null;
      const { data, mimeType, name } = result.file;
      return new File([data], name, { type: mimeType });
    }, []);

    const finalPlaceholder = placeholder || t('pageEditor.editorPlaceholder');
    const slashItemList = useMemo<ISlashOption[]>(
      () => (Array.isArray(slashItems) ? slashItems : []),
      [slashItems],
    );
    const selectableSlashItems = useMemo(
      () => slashItemList.filter(isSlashMenuOption),
      [slashItemList],
    );
    const filteredSelectableSlashItems = useMemo(
      () =>
        selectableSlashItems.filter((item) => matchesSlashQuery(item, slashFallback?.query || '')),
      [selectableSlashItems, slashFallback?.query],
    );

    // Build plugins array
    const plugins = useMemo(() => {
      // If custom plugins provided, use them directly
      if (customPlugins) return customPlugins;

      const imagePlugin = Editor.withProps(ReactImagePlugin, {
        defaultBlockImage: true,
        handleUpload: handleImageUpload,
        onPickFile: isDesktop ? handlePickFile : undefined,
      });
      const blockPlugin = Editor.withProps(ReactBlockPlugin, {
        onDragTargetChange: handleDragTargetChange,
        onDragTargetResolve: handleDragTargetResolve,
        onHoverBlockChange: handleHoverBlockChange,
        rootClassName: styles.blockRoot,
      });

      // Build base plugins with optional extra plugins prepended
      const basePlugins = extraPlugins
        ? [...extraPlugins, blockPlugin, ...STATIC_PLUGINS, imagePlugin]
        : [blockPlugin, ...STATIC_PLUGINS, imagePlugin];

      return basePlugins;
    }, [
      customPlugins,
      extraPlugins,
      handleDragTargetChange,
      handleDragTargetResolve,
      handleHoverBlockChange,
      handleImageUpload,
      handlePickFile,
    ]);

    useEffect(() => {
      // for easier debug, mount editor instance to window
      if (editor) window.__editor = editor;

      return () => {
        window.__editor = undefined;
      };
    }, [editor]);

    useEffect(() => {
      return () => {
        if (slashOpenTimerRef.current !== undefined) {
          window.clearTimeout(slashOpenTimerRef.current);
        }
        if (hoveredBlockElementRef.current) {
          delete hoveredBlockElementRef.current.dataset.lobeEditorHoveredBlock;
        }
        document.documentElement.dataset.pageEditorBlockMenuDismissed = 'false';
        document.documentElement.dataset.pageEditorBlockGutter = 'false';
        document.documentElement.dataset.pageEditorDraggingBlock = 'false';
      };
    }, []);

    useEffect(() => {
      const handlePointerMove = (event: PointerEvent) => {
        document.documentElement.dataset.pageEditorBlockGutter = isInEditorGutter(
          event.target as HTMLElement | null,
          event.clientX,
        )
          ? 'true'
          : 'false';
      };

      const handlePointerLeave = () => {
        document.documentElement.dataset.pageEditorBlockGutter = 'false';
      };

      document.addEventListener('pointermove', handlePointerMove, true);
      document.addEventListener('pointerleave', handlePointerLeave, true);

      return () => {
        document.documentElement.dataset.pageEditorBlockGutter = 'false';
        document.removeEventListener('pointermove', handlePointerMove, true);
        document.removeEventListener('pointerleave', handlePointerLeave, true);
      };
    }, []);

    useEffect(() => {
      const blockMenuSelector = '.lobe-block-operation-dropdown';
      const blockMenuTriggerSelector =
        "[aria-label='Block actions and drag'], [aria-label='Add block below']";

      const isBlockMenuOpen = () =>
        Boolean(document.querySelector(`${blockMenuSelector} .ant-dropdown-menu`));

      const showBlockMenu = () => {
        document.documentElement.dataset.pageEditorBlockMenuDismissed = 'false';
      };

      const dismissBlockMenu = () => {
        if (!isBlockMenuOpen()) return;

        document.documentElement.dataset.pageEditorBlockMenuDismissed = 'true';
      };

      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as HTMLElement | null;
        if (!target) return;

        if (target.closest(blockMenuTriggerSelector)) {
          showBlockMenu();
          return;
        }

        if (!isBlockMenuOpen()) return;

        const menuItem = target.closest(`${blockMenuSelector} .ant-dropdown-menu-item`);
        if (menuItem) {
          queueMicrotask(dismissBlockMenu);
          return;
        }

        if (target.closest(blockMenuSelector)) return;

        dismissBlockMenu();
      };

      const handlePointerMove = (event: PointerEvent) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest(blockMenuTriggerSelector)) {
          showBlockMenu();
        }
      };

      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        if (event.key !== 'Escape' || !isBlockMenuOpen()) return;

        event.preventDefault();
        dismissBlockMenu();
      };

      document.addEventListener('pointerdown', handlePointerDown, true);
      document.addEventListener('pointermove', handlePointerMove, true);
      document.addEventListener('keydown', handleKeyDown, true);

      return () => {
        document.documentElement.dataset.pageEditorBlockMenuDismissed = 'false';
        document.removeEventListener('pointerdown', handlePointerDown, true);
        document.removeEventListener('pointermove', handlePointerMove, true);
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    }, []);

    useEffect(() => {
      const blockMenuService = editor.requireService?.(IBlockMenuService);
      if (!blockMenuService) return;

      const unregisterCopyBlock = blockMenuService.registerMenu({
        key: 'page-editor-copy-block',
        label: () => tEditor('blockMenu.copyBlock'),
        onClick: ({ blockElement }) => {
          const text = blockElement.textContent?.trim();
          if (!text) return;

          void navigator.clipboard?.writeText(text);
        },
        order: 10,
      });

      const unregisterCopyBlockLink = blockMenuService.registerMenu({
        key: 'page-editor-copy-block-link',
        label: () => tEditor('blockMenu.copyLink'),
        onClick: ({ blockId }) => {
          const url = new URL(window.location.href);
          url.hash = blockId;

          void navigator.clipboard?.writeText(url.toString());
        },
        order: 20,
      });

      const unregisterDuplicateBlock = blockMenuService.registerMenu({
        key: 'page-editor-duplicate-block',
        label: () => tEditor('blockMenu.duplicate'),
        onClick: ({ blockElement, blockId }) => {
          const lexicalEditor = editor.getLexicalEditor?.();
          if (!lexicalEditor) return;

          const text = blockElement.textContent || '';
          lexicalEditor.update(() => {
            const target = $getNodeByKey(blockId);
            if (!target) return;

            const paragraph = $createParagraphNode();
            if (text) paragraph.append($createTextNode(text));
            target.insertAfter(paragraph);
            paragraph.selectEnd();
          });
        },
        order: 30,
      });

      const unregisterMoveTo = blockMenuService.registerMenu({
        key: 'page-editor-move-to',
        label: () => tEditor('blockMenu.moveTo'),
        onClick: () => {},
        order: 40,
      });

      const unregisterDeleteBlock = blockMenuService.registerMenu({
        key: '__block_default_delete',
        label: () => tEditor('blockMenu.delete'),
        onClick: ({ blockId }) => {
          const lexicalEditor = editor.getLexicalEditor?.();
          if (!lexicalEditor) return;

          lexicalEditor.update(() => {
            const target = $getNodeByKey(blockId);
            target?.remove();
          });
        },
        order: 50,
      });

      const unregisterComment = blockMenuService.registerMenu({
        key: 'page-editor-comment',
        label: () => tEditor('selectionToolbar.comment'),
        onClick: () => {},
        order: 60,
      });

      const unregisterSuggestEdits = blockMenuService.registerMenu({
        key: 'page-editor-suggest-edits',
        label: () => tEditor('blockMenu.suggestEdits'),
        onClick: () => {},
        order: 70,
      });

      const unregisterPresent = blockMenuService.registerMenu({
        key: 'page-editor-present',
        label: () => tEditor('blockMenu.presentFromHere'),
        onClick: () => {},
        order: 80,
      });

      const unregisterAskAi = blockMenuService.registerMenu({
        key: 'page-editor-ask-ai',
        label: () => tEditor('pageAiIsland.askAi', { defaultValue: 'Ask AI' }),
        onClick: ({ blockElement }) => {
          const text = blockElement.textContent?.replaceAll(/\s+/g, ' ').trim() || '';
          const rect = blockElement.getBoundingClientRect();

          window.dispatchEvent(
            new CustomEvent('page-editor-open-ai-island', {
              detail: {
                content: text,
                preview: text || undefined,
                rect: {
                  left: rect.left,
                  top: rect.bottom + 8,
                  width: rect.width,
                },
              },
            }),
          );
        },
        order: 90,
      });

      return () => {
        unregisterCopyBlock();
        unregisterCopyBlockLink();
        unregisterDuplicateBlock();
        unregisterMoveTo();
        unregisterDeleteBlock();
        unregisterComment();
        unregisterSuggestEdits();
        unregisterPresent();
        unregisterAskAi();
      };
    }, [editor, tEditor]);

    // Use refs for stable references across re-renders
    const previousDocumentSnapshotRef = useRef<unknown>(undefined);
    const currentLinePlaceholderRef = useRef<HTMLElement | null>(null);
    const onContentChangeRef = useRef(onContentChange);
    const wrapperRef = useRef<HTMLDivElement>(null);
    onContentChangeRef.current = onContentChange;

    // Listen to Lexical updates directly to trigger content change
    // This bypasses @lobehub/editor's onTextChange which has issues with previousContent reset
    useEffect(() => {
      if (!editor) return;

      const lexicalEditor = editor.getLexicalEditor?.();
      if (!lexicalEditor) return;

      // Initialize snapshot before registering listener
      previousDocumentSnapshotRef.current = editor.getDocument('json');

      const unregister = lexicalEditor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
        // Skip selection-only / caret-movement updates — no content was mutated.
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;

        const currentDocumentSnapshot = editor.getDocument('json');

        if (!isEqual(currentDocumentSnapshot, previousDocumentSnapshotRef.current)) {
          previousDocumentSnapshotRef.current = currentDocumentSnapshot;

          // During document hydration (e.g. route switch), we only advance snapshot
          // and skip external change callback to avoid false dirty checks.
          if (contentChangeLockRef?.current) return;

          onContentChangeRef.current?.();
        }
      });

      return () => {
        unregister();
      };
    }, [contentChangeLockRef, editor]); // Only depend on stable refs and editor

    const syncContentSnapshot = useCallback(() => {
      queueMicrotask(() => {
        if (contentChangeLockRef?.current) return;

        const currentDocumentSnapshot = editor.getDocument('json');
        if (!isEqual(currentDocumentSnapshot, previousDocumentSnapshotRef.current)) {
          previousDocumentSnapshotRef.current = currentDocumentSnapshot;
          onContentChangeRef.current?.();
        }
      });
    }, [contentChangeLockRef, editor]);

    const handleSurfaceClick = useCallback(
      (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();

        const target = event.target as HTMLElement | null;
        if (
          target?.closest(
            [
              '[data-lexical-editor="true"]',
              'button',
              'a',
              'input',
              'textarea',
              '[role="menu"]',
              '.ant-dropdown',
              '.lobe-block-operation-dropdown',
            ].join(','),
          )
        ) {
          return;
        }

        const lexicalEditor = editor.getLexicalEditor?.();
        if (!lexicalEditor) return;

        window.getSelection()?.removeAllRanges();
        document.dispatchEvent(new Event('page-editor-hide-selection-toolbar'));

        lexicalEditor.update(() => {
          const root = $getRoot();
          const lastBlock = root.getLastChild();

          if (lastBlock && lastBlock.getTextContent().trim().length === 0) {
            lastBlock.selectEnd();
            return;
          }

          const emptyParagraph = $createParagraphNode();
          root.append(emptyParagraph);
          emptyParagraph.select();
        });

        queueMicrotask(() => {
          editor.focus();
          syncContentSnapshot();
        });
      },
      [editor, syncContentSnapshot],
    );

    const closeSlashFallback = useCallback(() => {
      setSlashFallback(undefined);
    }, []);

    const openSlashFallback = useCallback(
      (options?: { afterSlashInsert?: boolean }) => {
        if (selectableSlashItems.length === 0) return false;

        const root = editor.getLexicalEditor?.()?.getRootElement?.();
        const selection = root?.ownerDocument.getSelection();
        if (!root || !selection || !selection.isCollapsed || selection.rangeCount === 0)
          return false;

        const anchorNode = selection.anchorNode;
        const anchorElement =
          anchorNode instanceof Element
            ? anchorNode
            : anchorNode instanceof Node
              ? anchorNode.parentElement
              : undefined;
        const block = anchorElement?.closest<HTMLElement>('[data-block-id]');
        if (!block || !root.contains(block)) return false;
        const blockId = block.dataset.blockId;
        if (!blockId) return false;
        const blockText = block.textContent || '';

        if (options?.afterSlashInsert) {
          const prefixText = getSelectionPrefixText(selection, block);
          if (!prefixText.startsWith('/') || /\s/.test(prefixText.slice(1))) return false;
        } else {
          const isEmptyBlock = !blockText.trim();
          if (!isEmptyBlock && !isSelectionAtBlockStart(selection, block)) return false;
        }

        const { left, top } = getSlashFallbackPosition(selection, block);

        setSlashFallback({
          activeIndex: 0,
          blockId,
          left,
          query: options?.afterSlashInsert ? getSelectionPrefixText(selection, block).slice(1) : '',
          top,
          triggerText: options?.afterSlashInsert ? '/' : undefined,
        });
        return true;
      },
      [editor, selectableSlashItems.length],
    );

    const selectSlashFallbackItem = useCallback(
      (index: number) => {
        const item = filteredSelectableSlashItems[index];
        if (!item) return;
        const lexicalEditor = editor.getLexicalEditor?.();
        const commandBlockId = (() => {
          if (item.key !== 'ask-ai') return undefined;

          const root = lexicalEditor?.getRootElement?.();
          const selection = root?.ownerDocument.getSelection();
          if (!root || !selection || selection.rangeCount === 0) return undefined;

          const anchorNode = selection.anchorNode;
          const anchorElement =
            anchorNode instanceof Element
              ? anchorNode
              : anchorNode instanceof Node
                ? anchorNode.parentElement
                : undefined;
          const block = anchorElement?.closest<HTMLElement>('[data-block-id]');

          if (!block || !root.contains(block) || block.textContent?.trim()) return undefined;

          return block.dataset.blockId;
        })();

        closeSlashFallback();
        item.onSelect?.(editor, '');
        queueMicrotask(() => {
          if (commandBlockId && lexicalEditor) {
            lexicalEditor.update(() => {
              const commandBlock = $getNodeByKey(commandBlockId);
              if (commandBlock && !commandBlock.getTextContent().trim()) {
                commandBlock.remove();
              }
              const root = $getRoot();
              for (const child of root.getChildren()) {
                if (root.getChildrenSize() <= 1) break;
                if (!child.getTextContent().trim()) {
                  child.remove();
                }
              }
            });
          }
          editor.focus();
          syncContentSnapshot();
        });
      },
      [closeSlashFallback, editor, filteredSelectableSlashItems, syncContentSnapshot],
    );

    const handleEditorKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        if (slashFallback) {
          if (event.key === 'Backspace' || event.key === 'Delete') {
            const root = editor.getLexicalEditor?.()?.getRootElement?.();
            const selection = root?.ownerDocument.getSelection();
            if (
              !selection ||
              selection.rangeCount === 0 ||
              selection.toString() ||
              !slashFallback.query
            ) {
              closeSlashFallback();
            }

            return;
          }

          if (event.key === 'Escape') {
            event.preventDefault();
            closeSlashFallback();
            return;
          }

          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const delta = event.key === 'ArrowDown' ? 1 : -1;
            setSlashFallback((current) => {
              if (!current) return current;
              const length = filteredSelectableSlashItems.length;
              if (length === 0) return current;
              return { ...current, activeIndex: (current.activeIndex + delta + length) % length };
            });
            return;
          }

          if (event.key === 'Enter' && filteredSelectableSlashItems.length > 0) {
            event.preventDefault();
            selectSlashFallbackItem(slashFallback.activeIndex);
            return;
          }
        }

        if (event.key === '/') {
          slashOpenRequestedRef.current = openSlashFallback();
          closeSlashFallback();
        }
      },
      [
        closeSlashFallback,
        editor,
        filteredSelectableSlashItems.length,
        openSlashFallback,
        selectSlashFallbackItem,
        slashFallback,
      ],
    );

    const handleEditorBeforeInput = useCallback(
      (event: FormEvent<HTMLDivElement>) => {
        const nativeEvent = event.nativeEvent as InputEvent;
        if (nativeEvent.inputType !== 'insertText' || nativeEvent.data !== '/') return;
        slashOpenRequestedRef.current = openSlashFallback();
        closeSlashFallback();
      },
      [closeSlashFallback, openSlashFallback],
    );

    const handleEditorInput = useCallback(
      (event: FormEvent<HTMLDivElement>) => {
        const nativeEvent = event.nativeEvent as InputEvent;
        const insertedSlash = nativeEvent.inputType === 'insertText' && nativeEvent.data === '/';
        if (!slashOpenRequestedRef.current && !insertedSlash) return;

        slashOpenRequestedRef.current = false;
        openSlashFallback({ afterSlashInsert: true });
      },
      [openSlashFallback],
    );

    useEffect(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const handleNativeInput = (event: Event) => {
        const nativeEvent = event as InputEvent;
        if (nativeEvent.inputType !== 'insertText' || nativeEvent.data !== '/') return;

        slashOpenRequestedRef.current = false;
        if (event.type === 'beforeinput') {
          if (slashOpenTimerRef.current !== undefined) {
            window.clearTimeout(slashOpenTimerRef.current);
          }
          slashOpenTimerRef.current = window.setTimeout(() => {
            slashOpenTimerRef.current = undefined;
            openSlashFallback({ afterSlashInsert: true });
          }, 0);
          return;
        }

        openSlashFallback({ afterSlashInsert: true });
      };

      wrapper.addEventListener('beforeinput', handleNativeInput, true);
      wrapper.addEventListener('input', handleNativeInput, true);

      return () => {
        wrapper.removeEventListener('beforeinput', handleNativeInput, true);
        wrapper.removeEventListener('input', handleNativeInput, true);
      };
    }, [openSlashFallback]);

    useEffect(() => {
      if (!slashFallback) return;

      const lexicalEditor = editor.getLexicalEditor?.();
      const root = lexicalEditor?.getRootElement?.();
      if (!lexicalEditor || !root) return;
      const activeLexicalEditor = lexicalEditor;

      const syncSlashState = () => {
        const selection = root.ownerDocument.getSelection();
        if (!selection || !selection.isCollapsed || selection.rangeCount === 0) {
          closeSlashFallback();
          return;
        }

        const anchorNode = selection.anchorNode;
        const anchorElement =
          anchorNode instanceof Element
            ? anchorNode
            : anchorNode instanceof Node
              ? anchorNode.parentElement
              : undefined;
        const block = anchorElement?.closest<HTMLElement>('[data-block-id]');

        if (!block || !root.contains(block) || block.dataset.blockId !== slashFallback.blockId) {
          closeSlashFallback();
          return;
        }

        const prefixText = getSelectionPrefixText(selection, block);
        const trimmedPrefixText = prefixText.trim();
        const normalizedQuery = trimmedPrefixText.startsWith('/')
          ? trimmedPrefixText.slice(1)
          : trimmedPrefixText;
        const hasMovedPastCommand =
          prefixText !== trimmedPrefixText ||
          /\s/.test(normalizedQuery) ||
          (trimmedPrefixText === '' && slashFallback.triggerText !== undefined);

        if (hasMovedPastCommand) {
          closeSlashFallback();
          return;
        }

        setSlashFallback((current) => {
          if (!current) return current;
          if (current.query === normalizedQuery) return current;

          return { ...current, activeIndex: 0, query: normalizedQuery };
        });
      };

      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest('[data-page-editor-slash-menu="true"], [data-lexical-editor="true"]')) {
          return;
        }

        closeSlashFallback();
      };

      const unregister = activeLexicalEditor.registerUpdateListener(syncSlashState);

      document.addEventListener('selectionchange', syncSlashState);
      document.addEventListener('pointerdown', handlePointerDown, true);
      syncSlashState();

      return () => {
        unregister();
        document.removeEventListener('selectionchange', syncSlashState);
        document.removeEventListener('pointerdown', handlePointerDown, true);
      };
    }, [closeSlashFallback, editor, slashFallback]);

    useEffect(() => {
      if (!slashFallback) return;

      const nextActiveIndex = Math.min(
        slashFallback.activeIndex,
        Math.max(filteredSelectableSlashItems.length - 1, 0),
      );
      if (nextActiveIndex !== slashFallback.activeIndex) {
        setSlashFallback((current) =>
          current ? { ...current, activeIndex: nextActiveIndex } : current,
        );
      }
    }, [filteredSelectableSlashItems.length, slashFallback]);

    useEffect(() => {
      const lexicalEditor = editor.getLexicalEditor?.();
      const root = lexicalEditor?.getRootElement?.();
      if (!lexicalEditor || !root) return;
      const activeLexicalEditor = lexicalEditor;

      const clearLinePlaceholder = () => {
        if (!currentLinePlaceholderRef.current) return;

        currentLinePlaceholderRef.current.dataset.placeholder = '';
        currentLinePlaceholderRef.current = null;
      };

      const syncLinePlaceholder = () => {
        const selection = root.ownerDocument.getSelection();
        if (!selection || !selection.isCollapsed || selection.rangeCount === 0) {
          clearLinePlaceholder();
          return;
        }

        const anchorNode = selection.anchorNode;
        const anchorElement =
          anchorNode instanceof Element
            ? anchorNode
            : anchorNode instanceof Node
              ? anchorNode.parentElement
              : undefined;
        const block = anchorElement?.closest<HTMLElement>('[data-block-id]');

        if (!block || !root.contains(block)) {
          clearLinePlaceholder();
          return;
        }

        const isEmptyBlock = block.textContent?.trim().length === 0;
        if (!isEmptyBlock) {
          clearLinePlaceholder();
          return;
        }

        if (currentLinePlaceholderRef.current && currentLinePlaceholderRef.current !== block) {
          currentLinePlaceholderRef.current.dataset.placeholder = '';
        }

        currentLinePlaceholderRef.current = block;
        block.dataset.placeholder = finalPlaceholder;
      };

      const unregister = activeLexicalEditor.registerUpdateListener(syncLinePlaceholder);

      document.addEventListener('selectionchange', syncLinePlaceholder);
      syncLinePlaceholder();

      return () => {
        unregister();
        document.removeEventListener('selectionchange', syncLinePlaceholder);
        clearLinePlaceholder();
      };
    }, [editor, finalPlaceholder]);

    useEffect(() => {
      if (!currentLinePlaceholderRef.current) return;

      currentLinePlaceholderRef.current.dataset.placeholder = slashFallback ? '' : finalPlaceholder;
    }, [finalPlaceholder, slashFallback]);

    useEffect(() => {
      if (!floatingToolbar) {
        setSelectionToolbarPosition(undefined);
        return;
      }

      const root = editor.getLexicalEditor?.()?.getRootElement?.();
      if (!root) return;

      let frame = 0;
      const clearPosition = () => {
        document.documentElement.dataset.pageEditorTextSelection = 'false';
        setSelectionToolbarPosition(undefined);
      };
      const clearSelectionAndPosition = () => {
        const lexicalEditor = editor.getLexicalEditor?.();
        lexicalEditor?.update(() => {
          $getRoot().selectEnd();
        });
        root.ownerDocument.getSelection()?.removeAllRanges();
        clearPosition();
      };

      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest('.page-editor-selection-toolbar, [data-lexical-editor="true"]')) {
          return;
        }

        clearSelectionAndPosition();
      };

      const updateToolbarPosition = () => {
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(() => {
          const selection = root.ownerDocument.getSelection();
          if (
            !selection ||
            selection.isCollapsed ||
            !selection.toString().trim() ||
            selection.rangeCount === 0
          ) {
            clearPosition();
            return;
          }

          const range = selection.getRangeAt(0);
          const ancestor = range.commonAncestorContainer;
          const anchorElement =
            ancestor instanceof Element ? ancestor : ancestor.parentElement || undefined;

          if (!anchorElement || !root.contains(anchorElement)) {
            clearPosition();
            return;
          }

          document.documentElement.dataset.pageEditorTextSelection = 'true';
          if (hoveredBlockElementRef.current) {
            delete hoveredBlockElementRef.current.dataset.lobeEditorHoveredBlock;
            hoveredBlockElementRef.current = null;
          }

          const rect = range.getBoundingClientRect();
          const fallbackRect = range.getClientRects()[0];
          const anchorRect = rect.width || rect.height ? rect : fallbackRect;
          if (!anchorRect) {
            clearPosition();
            return;
          }

          const toolbarWidth = SELECTION_MENU_WIDTH;
          const gap = 8;
          const viewportMargin = 12;
          const left = Math.min(
            Math.max(viewportMargin, anchorRect.left + anchorRect.width / 2 - toolbarWidth / 2),
            window.innerWidth - toolbarWidth - viewportMargin,
          );
          const preferredTop = anchorRect.bottom + gap;
          const top =
            preferredTop + SELECTION_MENU_ESTIMATED_HEIGHT < window.innerHeight
              ? preferredTop
              : Math.max(viewportMargin, anchorRect.top - SELECTION_MENU_ESTIMATED_HEIGHT - gap);

          setSelectionToolbarPosition((current) => {
            if (current && Math.abs(current.left - left) < 1 && Math.abs(current.top - top) < 1) {
              return current;
            }

            return { left, top };
          });
        });
      };

      document.addEventListener('selectionchange', updateToolbarPosition);
      document.addEventListener('pointerdown', handlePointerDown, true);
      document.addEventListener('pointerup', updateToolbarPosition, true);
      document.addEventListener('keyup', updateToolbarPosition, true);
      document.addEventListener('scroll', updateToolbarPosition, true);
      document.addEventListener('page-editor-hide-selection-toolbar', clearPosition);
      window.addEventListener('resize', updateToolbarPosition);
      updateToolbarPosition();

      return () => {
        window.cancelAnimationFrame(frame);
        document.documentElement.dataset.pageEditorTextSelection = 'false';
        document.removeEventListener('selectionchange', updateToolbarPosition);
        document.removeEventListener('pointerdown', handlePointerDown, true);
        document.removeEventListener('pointerup', updateToolbarPosition, true);
        document.removeEventListener('keyup', updateToolbarPosition, true);
        document.removeEventListener('scroll', updateToolbarPosition, true);
        document.removeEventListener('page-editor-hide-selection-toolbar', clearPosition);
        window.removeEventListener('resize', updateToolbarPosition);
      };
    }, [editor, floatingToolbar]);

    return (
      <div
        className={cx(styles.documentSurface)}
        ref={wrapperRef}
        onBeforeInputCapture={handleEditorBeforeInput}
        onBlur={syncContentSnapshot}
        onClick={handleSurfaceClick}
        onInputCapture={handleEditorInput}
        onKeyDownCapture={handleEditorKeyDown}
        onPointerUp={syncContentSnapshot}
      >
        <style>
          {getBlockOperationPortalStyles(
            tEditor('blockMenu.searchActions', { defaultValue: 'Search actions...' }),
          )}
        </style>
        <Editor
          content={''}
          editor={editor}
          lineEmptyPlaceholder={finalPlaceholder}
          placeholder={finalPlaceholder}
          plugins={plugins}
          slashOption={undefined}
          slashPlacement={'bottom'}
          type={'text'}
          style={{
            paddingBottom: 64,
            ...style,
          }}
          onInit={onInit}
        />
        {slashFallback ? (
          <div
            className={styles.slashMenu}
            data-page-editor-slash-menu="true"
            role="menu"
            style={{ left: slashFallback.left, top: slashFallback.top }}
          >
            <div className={styles.slashMenuList}>
              <div className={styles.slashMenuSectionLabel}>
                {tEditor('slash.category.suggested', { defaultValue: 'Suggested' })}
              </div>
              {(() => {
                let dividerIndex = 0;

                return slashItemList.map((item, index) => {
                  if (!isSlashMenuOption(item)) {
                    const labels = [
                      tEditor('slash.category.basic', { defaultValue: 'Basic blocks' }),
                      tEditor('slash.category.media', { defaultValue: 'Media' }),
                      tEditor('slash.category.advanced', { defaultValue: 'Advanced blocks' }),
                    ];
                    const label = labels[dividerIndex] || labels.at(-1);
                    dividerIndex += 1;

                    return (
                      <div key={`divider-${index}`}>
                        <div className={styles.slashMenuDivider} role="separator" />
                        <div className={styles.slashMenuSectionLabel}>{label}</div>
                      </div>
                    );
                  }

                  if (!matchesSlashQuery(item, slashFallback.query)) return null;

                  const optionIndex = filteredSelectableSlashItems.findIndex(
                    (option) => option.key === item.key,
                  );
                  const Icon = item.icon as ComponentType<{ size?: number }> | undefined;
                  const isActive = optionIndex === slashFallback.activeIndex;
                  const description =
                    typeof item.metadata?.description === 'string'
                      ? item.metadata.description
                      : undefined;
                  const shortcut = getSlashShortcut(String(item.key));

                  return (
                    <button
                      aria-label={String(item.label)}
                      className={cx(styles.slashMenuItem, isActive && styles.slashMenuItemActive)}
                      key={item.key}
                      role="menuitem"
                      type="button"
                      onClick={() => selectSlashFallbackItem(optionIndex)}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => {
                        setSlashFallback((current) =>
                          current ? { ...current, activeIndex: optionIndex } : current,
                        );
                      }}
                    >
                      <span className={styles.slashMenuItemIcon}>
                        {Icon ? <Icon size={15} /> : null}
                      </span>
                      <span>
                        <span className={styles.slashMenuItemTitle}>{item.label}</span>
                        {description ? (
                          <span className={styles.slashMenuItemExtra}>{description}</span>
                        ) : null}
                      </span>
                      {shortcut ? (
                        <span className={styles.slashMenuShortcut}>{shortcut}</span>
                      ) : (
                        <span />
                      )}
                      {isActive ? <ChevronRightIcon size={14} /> : <span />}
                    </button>
                  );
                });
              })()}
            </div>
            <div className={styles.slashMenuFooter}>
              <span>{tEditor('slash.closeMenu', { defaultValue: 'Close menu' })}</span>
              <span className={styles.slashMenuFooterShortcut}>esc</span>
            </div>
          </div>
        ) : null}
        {floatingToolbar && selectionToolbarPosition && editorState ? (
          <InlineToolbar
            floating
            className={'page-editor-selection-toolbar'}
            editor={editor}
            editorState={editorState}
            extraItems={toolbarExtraItems}
            style={{
              left: selectionToolbarPosition.left,
              position: 'fixed',
              top: selectionToolbarPosition.top,
              zIndex: 1400,
            }}
          />
        ) : null}
      </div>
    );
  },
);

InternalEditor.displayName = 'InternalEditor';

export default InternalEditor;
