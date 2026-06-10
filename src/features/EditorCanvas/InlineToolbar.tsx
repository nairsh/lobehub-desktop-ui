'use client';

import { type IEditor } from '@lobehub/editor';
import { getHotkeyById, HotkeyEnum, INSERT_HEADING_COMMAND } from '@lobehub/editor';
import { type ChatInputActionsProps, type EditorState } from '@lobehub/editor/react';
import { ChatInputActions } from '@lobehub/editor/react';
import { Block } from '@lobehub/ui';
import { Dropdown } from 'antd';
import { createStaticStyles, cssVar, cx } from 'antd-style';
import {
  BoldIcon,
  CheckIcon,
  ChevronRightIcon,
  CodeXmlIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  MessageSquareQuote,
  MoreHorizontalIcon,
  RadicalIcon,
  Redo2Icon,
  SigmaIcon,
  SlidersHorizontalIcon,
  SmilePlusIcon,
  SquareDashedBottomCodeIcon,
  SquarePenIcon,
  StrikethroughIcon,
  UnderlineIcon,
  Undo2Icon,
} from 'lucide-react';
import { type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const styles = createStaticStyles(({ css }) => ({
  floatingAction: css`
    cursor: pointer;

    display: inline-flex;
    gap: 6px;
    align-items: center;
    justify-content: center;

    height: 27px;
    border: 0;
    border-radius: 5px;

    font-size: 13px;
    font-weight: 500;
    color: var(--page-editor-toolbar-text-secondary, ${cssVar.colorTextSecondary});

    background: transparent;

    transition:
      background-color 100ms ease,
      color 100ms ease,
      transform 100ms ease;

    &:hover {
      color: var(--page-editor-toolbar-text, ${cssVar.colorText});
      background: var(
        --page-editor-toolbar-hover,
        color-mix(in srgb, ${cssVar.colorText} 7%, transparent)
      );
    }

    &:active {
      transform: translateY(1px);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }
  `,
  floatingActionActive: css`
    color: var(--page-editor-toolbar-text, ${cssVar.colorText});
    background: var(
      --page-editor-toolbar-active,
      color-mix(in srgb, ${cssVar.colorText} 10%, transparent)
    );
  `,
  floatingActionIconOnly: css`
    width: 27px;
    padding: 0;
  `,
  floatingActionLabeled: css`
    padding-inline: 8px;
  `,
  floatingEditWithAi: css`
    margin-block-start: 2px;
    padding-block-start: 6px;
    border-block-start: 1px solid var(--page-editor-toolbar-border);

    input,
    textarea,
    [contenteditable='true'] {
      border-color: var(--page-editor-toolbar-border);
      color: var(--page-editor-toolbar-text);
      background: rgb(255 255 255 / 6%);
    }
  `,
  floatingShell: css`
    --page-editor-toolbar-bg: #2f3437;
    --page-editor-toolbar-text: rgb(255 255 255 / 92%);
    --page-editor-toolbar-text-secondary: rgb(255 255 255 / 72%);
    --page-editor-toolbar-text-tertiary: rgb(255 255 255 / 48%);
    --page-editor-toolbar-border: rgb(255 255 255 / 11%);
    --page-editor-toolbar-hover: rgb(255 255 255 / 9%);
    --page-editor-toolbar-active: rgb(255 255 255 / 14%);

    transform-origin: top center;

    display: flex;
    flex-direction: column;

    width: 230px;
    max-width: calc(100vw - 24px);
    padding: 6px;
    border: 1px solid var(--page-editor-toolbar-border);
    border-radius: 8px;

    color: var(--page-editor-toolbar-text);

    background: var(--page-editor-toolbar-bg);
    box-shadow:
      0 14px 34px rgb(0 0 0 / 28%),
      0 2px 8px rgb(0 0 0 / 18%);

    animation: lobe-slash-menu-pop 100ms cubic-bezier(0.16, 1, 0.3, 1);

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `,
  floatingRow: css`
    display: flex;
    gap: 1px;
    align-items: center;
    min-height: 30px;
  `,
  floatingRowBorder: css`
    margin-block-start: 2px;
    padding-block-start: 4px;
    border-block-start: 1px solid var(--page-editor-toolbar-border);
  `,
  floatingSection: css`
    display: inline-flex;
    gap: 2px;
    align-items: center;
  `,
  floatingSectionBorder: css`
    padding-inline-start: 3px;
    border-inline-start: 1px solid var(--page-editor-toolbar-border);
  `,
  floatingSkillItem: css`
    cursor: pointer;

    display: flex;
    align-items: center;

    width: 100%;
    height: 28px;
    padding-inline: 8px;
    border: 0;
    border-radius: 5px;

    font-size: 13px;
    color: var(--page-editor-toolbar-text);
    text-align: start;

    background: transparent;

    &:hover {
      background: var(--page-editor-toolbar-hover);
    }
  `,
  floatingSkillsHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;

    height: 28px;
    padding-inline: 8px 6px;

    font-size: 13px;
    font-weight: 400;
    color: var(--page-editor-toolbar-text-tertiary);
  `,
  floatingWideAction: css`
    cursor: pointer;

    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: flex-start;

    width: 100%;
    height: 28px;
    padding-inline: 8px 6px;
    border: 0;
    border-radius: 5px;

    font-size: 13px;
    line-height: 1;
    color: var(--page-editor-toolbar-text);
    white-space: nowrap;

    background: transparent;

    &:hover {
      background: var(--page-editor-toolbar-hover);
    }
  `,
  floatingColorBox: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 20px;
    height: 20px;
    border: 1px solid var(--page-editor-toolbar-border);
    border-radius: 5px;

    font-size: 13px;
    font-weight: 700;
    line-height: 1;
    color: var(--page-editor-toolbar-text);
  `,
  floatingTextIcon: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;

    min-width: 14px;

    font-size: 14px;
    font-weight: 700;
    line-height: 1;
  `,
  menuItemLabel: css`
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: space-between;

    min-width: 220px;
  `,
  menuItemTitle: css`
    display: inline-flex;
    gap: 10px;
    align-items: center;
  `,
}));

const preventToolbarMouseDown = (event: MouseEvent<HTMLElement>) => {
  event.preventDefault();
  event.stopPropagation();
};

interface FloatingToolbarButtonProps {
  active?: boolean;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  labeled?: boolean;
  onClick?: () => void;
}

const FloatingToolbarButton = memo<FloatingToolbarButtonProps>(
  ({ active, ariaLabel, children, className, disabled, labeled, onClick }) => (
    <button
      aria-label={ariaLabel}
      disabled={disabled}
      type="button"
      className={cx(
        styles.floatingAction,
        labeled ? styles.floatingActionLabeled : styles.floatingActionIconOnly,
        active && styles.floatingActionActive,
        className,
      )}
      onClick={() => onClick?.()}
      onMouseDown={preventToolbarMouseDown}
    >
      {children}
    </button>
  ),
);

FloatingToolbarButton.displayName = 'FloatingToolbarButton';

type BlockStyleKey =
  | 'text'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'bulletList'
  | 'numberList'
  | 'taskList'
  | 'blockquote'
  | 'codeblock';

interface BlockStyleItem {
  icon: ReactNode;
  key: BlockStyleKey;
  label: string;
  onClick: () => void;
}

type ChatInputActionItem =
  NonNullable<ChatInputActionsProps['items']> extends Array<infer Item> ? Item : never;

const getSelectedMarkup = (editor?: IEditor) => {
  try {
    const xml = (editor?.getSelectionDocument?.('litexml') as string | undefined) || '';
    const markdown = (editor?.getSelectionDocument?.('markdown') as string | undefined) || '';
    return `${xml}\n${markdown}`.trim();
  } catch {
    return '';
  }
};

const hasRangeSelection = () => {
  const selection = globalThis.getSelection?.();
  return Boolean(selection && !selection.isCollapsed && selection.toString().trim());
};

const inferBlockStyle = (editor: IEditor | undefined, editorState: EditorState): BlockStyleKey => {
  if (editorState.isBlockquote) return 'blockquote';

  const markup = getSelectedMarkup(editor).toLowerCase();
  if (/^#{4}\s/m.test(markup) || /<h4[\s>]/.test(markup)) return 'h4';
  if (/^#{3}\s/m.test(markup) || /<h3[\s>]/.test(markup)) return 'h3';
  if (/^#{2}\s/m.test(markup) || /<h2[\s>]/.test(markup)) return 'h2';
  if (/^#\s/m.test(markup) || /<h1[\s>]/.test(markup)) return 'h1';
  if (/^\s*[-*]\s+\[[ x]\]/m.test(markup) || /<(?:check|todo|task)/.test(markup)) return 'taskList';
  if (/^\s*[-*]\s+/m.test(markup) || /<(?:ul|li)[\s>]/.test(markup)) return 'bulletList';
  if (/^\s*\d+[.)]\s+/m.test(markup) || /<(?:ol|li)[\s>]/.test(markup)) return 'numberList';
  if (/^```/m.test(markup) || /<codeblock[\s>]/.test(markup)) return 'codeblock';

  return 'text';
};

const blockStyleIconMap: Record<BlockStyleKey, ReactNode> = {
  blockquote: <MessageSquareQuote size={16} />,
  bulletList: <ListIcon size={16} />,
  codeblock: <SquareDashedBottomCodeIcon size={16} />,
  h1: <Heading1Icon size={16} />,
  h2: <Heading2Icon size={16} />,
  h3: <Heading3Icon size={16} />,
  h4: <span className={styles.floatingTextIcon}>H4</span>,
  numberList: <ListOrderedIcon size={16} />,
  taskList: <ListTodoIcon size={16} />,
  text: <span className={styles.floatingTextIcon}>T</span>,
};

const hasToolbarChildren = (
  item: ChatInputActionItem,
): item is ChatInputActionItem & { children: ReactNode; key: string } =>
  !('type' in item) && 'key' in item && 'children' in item;

export interface InlineToolbarProps {
  className?: string;
  editor?: IEditor;
  editorState?: EditorState;
  /**
   * Extra items to prepend to the toolbar (e.g., "Ask Copilot" button)
   */
  extraItems?: ChatInputActionsProps['items'];
  floating?: boolean;
  style?: CSSProperties;
}

const InlineToolbar = memo<InlineToolbarProps>(
  ({ floating, style, className, editor, editorState, extraItems }) => {
    const { t } = useTranslation('editor');

    const items = useMemo<ChatInputActionItem[]>(() => {
      if (!editorState) return [];

      if (floating) {
        const activeBlockStyle = inferBlockStyle(editor, editorState);
        const toHeading = (tag: 'h1' | 'h2' | 'h3' | 'h4' | 'p') => {
          (editor as any)?.dispatchCommand(INSERT_HEADING_COMMAND, { tag });
        };
        const blockStyleItems: BlockStyleItem[] = [
          {
            icon: blockStyleIconMap.text,
            key: 'text',
            label: t('selectionToolbar.normalText'),
            onClick: () => toHeading('p'),
          },
          {
            icon: blockStyleIconMap.h1,
            key: 'h1',
            label: t('slash.h1'),
            onClick: () => toHeading('h1'),
          },
          {
            icon: blockStyleIconMap.h2,
            key: 'h2',
            label: t('slash.h2'),
            onClick: () => toHeading('h2'),
          },
          {
            icon: blockStyleIconMap.h3,
            key: 'h3',
            label: t('slash.h3'),
            onClick: () => toHeading('h3'),
          },
          {
            icon: blockStyleIconMap.h4,
            key: 'h4',
            label: t('slash.h4'),
            onClick: () => toHeading('h4'),
          },
          {
            icon: blockStyleIconMap.bulletList,
            key: 'bulletList',
            label: t('typobar.bulletList'),
            onClick: () => editorState.bulletList(),
          },
          {
            icon: blockStyleIconMap.numberList,
            key: 'numberList',
            label: t('typobar.numberList'),
            onClick: () => editorState.numberList(),
          },
          {
            icon: blockStyleIconMap.taskList,
            key: 'taskList',
            label: t('typobar.taskList'),
            onClick: () => editorState.checkList(),
          },
          {
            icon: blockStyleIconMap.blockquote,
            key: 'blockquote',
            label: t('typobar.blockquote'),
            onClick: () => editorState.blockquote(),
          },
          {
            icon: blockStyleIconMap.codeblock,
            key: 'codeblock',
            label: t('typobar.codeblock'),
            onClick: () => editorState.codeblock(),
          },
        ];
        const activeBlockStyleItem =
          blockStyleItems.find((item) => item.key === activeBlockStyle) || blockStyleItems[0];
        const blockStyleMenuItems = blockStyleItems.map((item) => ({
          key: item.key,
          label: (
            <span className={styles.menuItemLabel}>
              <span className={styles.menuItemTitle}>
                {item.icon}
                <span>{item.label}</span>
              </span>
              {item.key === activeBlockStyle && <CheckIcon size={16} />}
            </span>
          ),
          onClick: item.onClick,
        }));

        const moreItems = [
          {
            key: 'blockquote',
            label: t('typobar.blockquote'),
            onClick: () => editorState.blockquote(),
          },
          {
            key: 'bulletList',
            label: t('typobar.bulletList'),
            onClick: () => editorState.bulletList(),
          },
          {
            key: 'numberlist',
            label: t('typobar.numberList'),
            onClick: () => editorState.numberList(),
          },
          {
            key: 'tasklist',
            label: t('typobar.taskList'),
            onClick: () => editorState.checkList(),
          },
          {
            key: 'codeblock',
            label: t('typobar.codeblock'),
            onClick: () => editorState.codeblock(),
          },
        ];

        return [
          ...(extraItems || []),
          extraItems?.length ? { type: 'divider' as const } : null,
          {
            children: (
              <Dropdown menu={{ items: blockStyleMenuItems }} trigger={['click']}>
                <button
                  aria-label={t('selectionToolbar.text')}
                  className={styles.floatingWideAction}
                  type="button"
                  onMouseDown={preventToolbarMouseDown}
                >
                  {activeBlockStyleItem.icon}
                  <span>{activeBlockStyleItem.label}</span>
                  <ChevronRightIcon size={13} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </button>
              </Dropdown>
            ),
            key: 'text-style',
            label: t('selectionToolbar.text'),
          },
          {
            children: (
              <FloatingToolbarButton
                labeled
                ariaLabel={t('typobar.link')}
                onClick={editorState.insertLink}
              >
                <LinkIcon size={16} />
                <span>{t('typobar.link')}</span>
              </FloatingToolbarButton>
            ),
            key: 'link',
            label: t('typobar.link'),
          },
          { type: 'divider' as const },
          {
            children: (
              <FloatingToolbarButton
                active={editorState.isBold}
                ariaLabel={t('typobar.bold')}
                onClick={editorState.bold}
              >
                <span className={styles.floatingTextIcon}>B</span>
              </FloatingToolbarButton>
            ),
            key: 'bold',
            label: t('typobar.bold'),
          },
          {
            children: (
              <FloatingToolbarButton
                active={editorState.isItalic}
                ariaLabel={t('typobar.italic')}
                onClick={editorState.italic}
              >
                <span className={styles.floatingTextIcon} style={{ fontStyle: 'italic' }}>
                  i
                </span>
              </FloatingToolbarButton>
            ),
            key: 'italic',
            label: t('typobar.italic'),
          },
          {
            children: (
              <FloatingToolbarButton
                active={editorState.isUnderline}
                ariaLabel={t('typobar.underline')}
                onClick={editorState.underline}
              >
                <span className={styles.floatingTextIcon} style={{ textDecoration: 'underline' }}>
                  U
                </span>
              </FloatingToolbarButton>
            ),
            key: 'underline',
            label: t('typobar.underline'),
          },
          {
            children: (
              <FloatingToolbarButton
                active={editorState.isStrikethrough}
                ariaLabel={t('typobar.strikethrough')}
                onClick={editorState.strikethrough}
              >
                <span
                  className={styles.floatingTextIcon}
                  style={{ textDecoration: 'line-through' }}
                >
                  S
                </span>
              </FloatingToolbarButton>
            ),
            key: 'strikethrough',
            label: t('typobar.strikethrough'),
          },
          {
            children: (
              <FloatingToolbarButton
                active={editorState.isCode}
                ariaLabel={t('typobar.code')}
                onClick={editorState.code}
              >
                <CodeXmlIcon size={16} />
              </FloatingToolbarButton>
            ),
            key: 'code',
            label: t('typobar.code'),
          },
          {
            children: (
              <FloatingToolbarButton ariaLabel={t('typobar.tex')} onClick={editorState.insertMath}>
                <SigmaIcon size={16} />
              </FloatingToolbarButton>
            ),
            key: 'math',
            label: t('typobar.tex'),
          },
          {
            children: (
              <Dropdown menu={{ items: moreItems }} trigger={['click']}>
                <span onMouseDown={preventToolbarMouseDown}>
                  <FloatingToolbarButton ariaLabel={t('selectionToolbar.more')}>
                    <MoreHorizontalIcon size={16} />
                  </FloatingToolbarButton>
                </span>
              </Dropdown>
            ),
            key: 'more',
            label: t('selectionToolbar.more'),
          },
        ].filter(Boolean) as ChatInputActionItem[];
      }

      const baseItems = [
        // Extra items (like "Ask Copilot") come first
        ...(extraItems || []),
        extraItems?.length ? { type: 'divider' as const } : null,
        !floating && {
          disabled: !editorState.canUndo,
          icon: Undo2Icon,
          key: 'undo',
          label: t('typobar.undo', 'Undo'),
          onClick: editorState.undo,
          tooltipProps: { hotkey: getHotkeyById(HotkeyEnum.Undo).keys },
        },
        !floating && {
          disabled: !editorState.canRedo,
          icon: Redo2Icon,
          key: 'redo',
          label: t('typobar.redo', 'Redo'),
          onClick: editorState.redo,
          tooltipProps: { hotkey: getHotkeyById(HotkeyEnum.Redo).keys },
        },
        !floating && {
          type: 'divider',
        },
        {
          active: editorState.isBold,
          icon: BoldIcon,
          key: 'bold',
          label: t('typobar.bold'),
          onClick: editorState.bold,
          tooltipProps: { hotkey: getHotkeyById(HotkeyEnum.Bold).keys },
        },
        {
          active: editorState.isItalic,
          icon: ItalicIcon,
          key: 'italic',
          label: t('typobar.italic'),
          onClick: editorState.italic,
          tooltipProps: { hotkey: getHotkeyById(HotkeyEnum.Italic).keys },
        },
        {
          active: editorState.isUnderline,
          icon: UnderlineIcon,
          key: 'underline',
          label: t('typobar.underline'),
          onClick: editorState.underline,
          tooltipProps: { hotkey: getHotkeyById(HotkeyEnum.Underline).keys },
        },
        {
          active: editorState.isStrikethrough,
          icon: StrikethroughIcon,
          key: 'strikethrough',
          label: t('typobar.strikethrough'),
          onClick: editorState.strikethrough,
          tooltipProps: { hotkey: getHotkeyById(HotkeyEnum.Strikethrough).keys },
        },
        {
          type: 'divider',
        },
        !floating && {
          icon: Heading1Icon,
          key: 'h1',
          label: t('slash.h1'),
          onClick: () => {
            if (editor) {
              editor.dispatchCommand(INSERT_HEADING_COMMAND, { tag: 'h1' });
            }
          },
        },
        !floating && {
          icon: Heading2Icon,
          key: 'h2',
          label: t('slash.h2'),
          onClick: () => {
            if (editor) {
              editor.dispatchCommand(INSERT_HEADING_COMMAND, { tag: 'h2' });
            }
          },
        },
        !floating && {
          icon: Heading3Icon,
          key: 'h3',
          label: t('slash.h3'),
          onClick: () => {
            if (editor) {
              editor.dispatchCommand(INSERT_HEADING_COMMAND, { tag: 'h3' });
            }
          },
        },
        !floating && {
          type: 'divider',
        },
        {
          icon: ListIcon,
          key: 'bulletList',
          label: t('typobar.bulletList'),
          onClick: editorState.bulletList,
          tooltipProps: { hotkey: getHotkeyById(HotkeyEnum.BulletList).keys },
        },
        {
          icon: ListOrderedIcon,
          key: 'numberlist',
          label: t('typobar.numberList'),
          onClick: editorState.numberList,
          tooltipProps: { hotkey: getHotkeyById(HotkeyEnum.NumberList).keys },
        },
        {
          icon: ListTodoIcon,
          key: 'tasklist',
          label: t('typobar.taskList'),
          onClick: editorState.checkList,
        },
        {
          type: 'divider',
        },
        {
          active: editorState.isBlockquote,
          icon: MessageSquareQuote,
          key: 'blockquote',
          label: t('typobar.blockquote'),
          onClick: editorState.blockquote,
        },
        {
          icon: LinkIcon,
          key: 'link',
          label: t('typobar.link'),
          onClick: editorState.insertLink,
          tooltipProps: { hotkey: getHotkeyById(HotkeyEnum.Link).keys },
        },
        {
          icon: SigmaIcon,
          key: 'math',
          label: t('typobar.tex'),
          onClick: editorState.insertMath,
        },
        {
          type: 'divider',
        },
        {
          active: editorState.isCode,
          icon: CodeXmlIcon,
          key: 'code',
          label: t('typobar.code'),
          onClick: editorState.code,
          tooltipProps: { hotkey: getHotkeyById(HotkeyEnum.CodeInline).keys },
        },
        !floating && {
          icon: SquareDashedBottomCodeIcon,
          key: 'codeblock',
          label: t('typobar.codeblock'),
          onClick: editorState.codeblock,
        },
      ];

      return baseItems.filter(Boolean) as ChatInputActionItem[];
    }, [editor, editorState, extraItems, floating, t]);

    if (!editorState) return null;
    if (floating && !hasRangeSelection()) return null;

    if (floating) {
      const handleClearFormatting = () => {
        if (editorState.isBold) editorState.bold();
        if (editorState.isItalic) editorState.italic();
        if (editorState.isUnderline) editorState.underline();
        if (editorState.isStrikethrough) editorState.strikethrough();
        if (editorState.isCode) editorState.code();
      };

      return (
        <div className={cx(styles.floatingShell, className)} style={style}>
          <div className={styles.floatingRow}>
            {items
              .filter(hasToolbarChildren)
              .filter((item) => item.key === 'text-style')
              .map((item) => (
                <div key={item.key} style={{ width: '100%' }}>
                  {item.children}
                </div>
              ))}
          </div>

          <div className={cx(styles.floatingRow, styles.floatingRowBorder)}>
            <div className={styles.floatingSection}>
              <FloatingToolbarButton ariaLabel={t('selectionToolbar.color')}>
                <span className={styles.floatingColorBox}>A</span>
              </FloatingToolbarButton>
              <FloatingToolbarButton
                active={editorState.isBold}
                ariaLabel={t('typobar.bold')}
                onClick={editorState.bold}
              >
                <span className={styles.floatingTextIcon}>B</span>
              </FloatingToolbarButton>
              <FloatingToolbarButton
                active={editorState.isItalic}
                ariaLabel={t('typobar.italic')}
                onClick={editorState.italic}
              >
                <span className={styles.floatingTextIcon} style={{ fontStyle: 'italic' }}>
                  I
                </span>
              </FloatingToolbarButton>
              <FloatingToolbarButton
                active={editorState.isUnderline}
                ariaLabel={t('typobar.underline')}
                onClick={editorState.underline}
              >
                <span className={styles.floatingTextIcon} style={{ textDecoration: 'underline' }}>
                  U
                </span>
              </FloatingToolbarButton>
              <FloatingToolbarButton
                ariaLabel={t('selectionToolbar.clearFormat')}
                onClick={handleClearFormatting}
              >
                <span className={styles.floatingTextIcon} style={{ fontSize: 11, fontWeight: 500 }}>
                  Tx
                </span>
              </FloatingToolbarButton>
            </div>
          </div>

          <div className={cx(styles.floatingRow, styles.floatingRowBorder)}>
            <FloatingToolbarButton ariaLabel={t('typobar.link')} onClick={editorState.insertLink}>
              <LinkIcon size={15} />
            </FloatingToolbarButton>
            <FloatingToolbarButton
              active={editorState.isStrikethrough}
              ariaLabel={t('typobar.strikethrough')}
              onClick={editorState.strikethrough}
            >
              <span className={styles.floatingTextIcon} style={{ textDecoration: 'line-through' }}>
                S
              </span>
            </FloatingToolbarButton>
            <FloatingToolbarButton
              active={editorState.isCode}
              ariaLabel={t('typobar.code')}
              onClick={editorState.code}
            >
              <CodeXmlIcon size={15} />
            </FloatingToolbarButton>
            <FloatingToolbarButton ariaLabel={t('typobar.tex')} onClick={editorState.insertMath}>
              <RadicalIcon size={15} />
            </FloatingToolbarButton>
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  {
                    key: 'blockquote',
                    label: t('typobar.blockquote'),
                    onClick: editorState.blockquote,
                  },
                  {
                    key: 'bulletList',
                    label: t('typobar.bulletList'),
                    onClick: editorState.bulletList,
                  },
                  {
                    key: 'numberList',
                    label: t('typobar.numberList'),
                    onClick: editorState.numberList,
                  },
                  { key: 'taskList', label: t('typobar.taskList'), onClick: editorState.checkList },
                  {
                    key: 'codeblock',
                    label: t('typobar.codeblock'),
                    onClick: editorState.codeblock,
                  },
                ],
              }}
            >
              <span onMouseDown={preventToolbarMouseDown}>
                <FloatingToolbarButton ariaLabel={t('selectionToolbar.more')}>
                  <MoreHorizontalIcon size={15} />
                </FloatingToolbarButton>
              </span>
            </Dropdown>
          </div>

          <div className={cx(styles.floatingRow, styles.floatingRowBorder)}>
            <FloatingToolbarButton labeled ariaLabel={t('selectionToolbar.comment')}>
              <MessageSquareQuote size={15} />
              <span>{t('selectionToolbar.comment')}</span>
            </FloatingToolbarButton>
            <div style={{ display: 'flex', gap: 1, marginLeft: 'auto' }}>
              <FloatingToolbarButton ariaLabel={t('selectionToolbar.reaction')}>
                <SmilePlusIcon size={14} />
              </FloatingToolbarButton>
              <FloatingToolbarButton ariaLabel={t('blockMenu.suggestEdits')}>
                <SquarePenIcon size={14} />
              </FloatingToolbarButton>
            </div>
          </div>

          <div className={cx(styles.floatingSkillsHeader, styles.floatingRowBorder)}>
            <span>{t('selectionToolbar.skills')}</span>
            <SlidersHorizontalIcon size={13} style={{ opacity: 0.45 }} />
          </div>
          {[
            { key: 'proofread', label: t('pageAiIsland.proofread') },
            { key: 'explain', label: t('pageAiIsland.explain') },
            { key: 'improve', label: t('pageAiIsland.improve') },
            { key: 'reformat', label: t('selectionToolbar.reformat') },
          ].map((skill) => (
            <button
              className={styles.floatingSkillItem}
              key={skill.key}
              type="button"
              onMouseDown={preventToolbarMouseDown}
            >
              {skill.label}
            </button>
          ))}

          {extraItems?.length ? (
            <div className={styles.floatingEditWithAi}>
              {extraItems.filter(hasToolbarChildren).map((item) => (
                <div key={item.key}>{item.children}</div>
              ))}
            </div>
          ) : null}
        </div>
      );
    }

    // Fixed toolbar - wrap in a styled container
    return (
      <Block
        shadow
        className={className}
        padding={4}
        variant={'outlined'}
        style={{
          background: cssVar.colorBgElevated,
          borderRadius: 8,
          marginBottom: 16,
          marginTop: 16,
          position: 'sticky',
          top: 12,
          zIndex: 10,
          ...style,
        }}
      >
        <ChatInputActions items={items} />
      </Block>
    );
  },
);

InlineToolbar.displayName = 'InlineToolbar';

export default InlineToolbar;
