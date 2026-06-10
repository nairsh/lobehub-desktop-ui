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
const SELECTION_MENU_ESTIMATED_HEIGHT = 350;
const SELECTION_MENU_WIDTH = 230;
const SLASH_MENU_MAX_HEIGHT = 400;
const SLASH_MENU_WIDTH = 320;

const escapeCssContent = (value: string) => value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");

const getBlockOperationPortalStyles = () => `
  body:has(.lobe-block-operation-dropdown)
    [data-lobe-editor-hovered-block='true'],
  html[data-page-editor-dragging-block='true']
    [data-lobe-editor-hovered-block='true'] {
    background: color-mix(in srgb, var(--lobe-color-primary, #2383e2) 12%, transparent);
    border-radius: 3px;
    box-shadow:
      -4px 0 0 color-mix(in srgb, var(--lobe-color-primary, #2383e2) 12%, transparent),
      4px 0 0 color-mix(in srgb, var(--lobe-color-primary, #2383e2) 12%, transparent);
  }

  .ant-btn[aria-label='Add block below'],
  .ant-btn[aria-label='Block actions and drag'] {
    width: 20px !important;
    height: 22px !important;
    min-width: 20px !important;
    padding: 0 !important;
    border-radius: 3px !important;
    color: var(--lobe-color-text-quaternary, rgba(0, 0, 0, 0.34)) !important;
    opacity: 0.58;
    transition:
      background-color 100ms ease,
      color 100ms ease,
      opacity 100ms ease,
      transform 100ms ease;
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
    transform: translateX(4px);
  }

  .ant-btn[aria-label='Add block below']:hover,
  .ant-btn[aria-label='Block actions and drag']:hover,
  .ant-btn[aria-label='Add block below']:focus-visible,
  .ant-btn[aria-label='Block actions and drag']:focus-visible {
    background: color-mix(in srgb, var(--lobe-color-text, #1f1f1f) 8%, transparent) !important;
    color: var(--lobe-color-text-secondary, rgba(0, 0, 0, 0.65)) !important;
    opacity: 1;
    transform: translateX(4px) scale(1.02);
  }

  .ant-btn[aria-label='Add block below'] svg,
  .ant-btn[aria-label='Block actions and drag'] svg {
    width: 14px !important;
    height: 14px !important;
  }

  .lobe-block-operation-dropdown {
    transform: translate(2px, 30px) !important;
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu {
    min-width: 300px;
    margin-top: 8px;
    padding: 8px;
    border: 1px solid color-mix(in srgb, var(--lobe-color-border, rgba(0, 0, 0, 0.12)) 70%, transparent);
    border-radius: 12px;
    background: var(--lobe-color-bg-elevated, #fff);
    box-shadow: 0 18px 48px rgba(15, 23, 42, 0.14), 0 3px 10px rgba(15, 23, 42, 0.08);
  }

  /* Real search input injected via MutationObserver */
  .block-menu-search-item {
    padding: 0 0 6px !important;
    min-height: unset !important;
    border-radius: 0 !important;
    background: transparent !important;
    cursor: default !important;
    list-style: none;
  }

  .block-menu-search-item:hover {
    background: transparent !important;
  }

  .block-menu-search-input {
    display: flex;
    align-items: center;
    width: 100%;
    height: 34px;
    padding-inline: 10px;
    border: 1px solid color-mix(in srgb, var(--lobe-color-border, rgba(0, 0, 0, 0.12)) 82%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, var(--lobe-color-bg-container, #fff) 50%, transparent);
    color: var(--lobe-color-text, #1f1f1f);
    font-size: 13px;
    line-height: 1;
    outline: none;
    box-sizing: border-box;
    transition: border-color 100ms ease;
  }

  .block-menu-search-input::placeholder {
    color: var(--lobe-color-text-quaternary, rgba(0, 0, 0, 0.25));
  }

  .block-menu-search-input:focus {
    border-color: var(--lobe-color-primary, #2383e2);
    background: var(--lobe-color-bg-container, #fff);
  }

  /* Block type label shown above menu items */
  .block-menu-type-label {
    display: block;
    padding: 2px 8px 4px;
    color: var(--lobe-color-text-tertiary, rgba(0, 0, 0, 0.45));
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    list-style: none;
    pointer-events: none;
    user-select: none;
  }

  .lobe-block-operation-dropdown .ant-dropdown-menu-item {
    min-height: 34px;
    padding: 5px 8px !important;
    border-radius: 6px !important;
    color: var(--lobe-color-text, #1f1f1f) !important;
    font-size: 14px;
    line-height: 22px;
    transition: background 80ms ease !important;
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
    gap: 10px;
  }

  /* Item shortcut hint injected by JS */
  .block-menu-item-shortcut {
    margin-left: auto;
    color: var(--lobe-color-text-quaternary, rgba(0, 0, 0, 0.25));
    font-size: 11px;
    letter-spacing: 0.02em;
    flex-shrink: 0;
  }

  /* Group dividers injected by JS */
  .block-menu-group-divider {
    height: 1px;
    margin: 4px 0;
    background: color-mix(in srgb, var(--lobe-color-border, rgba(0, 0, 0, 0.12)) 65%, transparent);
    list-style: none;
    pointer-events: none;
  }

  /* Last edited metadata */
  .block-menu-meta-item {
    padding: 4px 8px 2px !important;
    min-height: unset !important;
    border-radius: 0 !important;
    background: transparent !important;
    cursor: default !important;
    pointer-events: none !important;
    list-style: none;
  }

  .block-menu-meta-item:hover {
    background: transparent !important;
  }

  .block-menu-meta-text {
    color: var(--lobe-color-text-quaternary, rgba(0, 0, 0, 0.25));
    font-size: 11px;
    line-height: 1.5;
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

  /* Font variants */
  html[data-page-editor-font='serif'] [data-lexical-editor='true'] {
    font-family: Georgia, "Times New Roman", "Palatino Linotype", serif;
  }

  html[data-page-editor-font='mono'] [data-lexical-editor='true'] {
    font-family: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", "Cascadia Code", monospace;
    font-size: 13.5px;
  }

  /* Small text mode */
  html[data-page-editor-small-text='true'] [data-lexical-editor='true'] {
    font-size: 13px;
    line-height: 1.5;
  }

  html[data-page-editor-small-text='true'][data-page-editor-font='mono'] [data-lexical-editor='true'] {
    font-size: 12px;
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
    --page-editor-font-sans:
      ui-sans-serif, -apple-system, blinkmacsystemfont, 'Segoe UI', helvetica, 'Apple Color Emoji',
      arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol';
    --page-editor-font-serif: lyon-text, georgia, yumincho, 'Times New Roman', times, serif;
    --page-editor-font-mono:
      'SFMono-Regular', menlo, consolas, 'PT Mono', 'Liberation Mono', courier, monospace;
    --page-editor-text: ${cssVar.colorText};
    --page-editor-text-secondary: ${cssVar.colorTextSecondary};
    --page-editor-text-tertiary: ${cssVar.colorTextTertiary};
    --page-editor-placeholder: ${cssVar.colorTextQuaternary};
    --page-editor-link: #2383e2;
    --page-editor-selection: rgb(35 131 226 / 28%);
    --page-editor-border: color-mix(in srgb, ${cssVar.colorBorder} 72%, transparent);
    --page-editor-block-hover: color-mix(in srgb, ${cssVar.colorText} 3.6%, transparent);
    --page-editor-callout-bg: color-mix(in srgb, ${cssVar.colorText} 5%, transparent);
    --page-editor-code-bg: color-mix(in srgb, ${cssVar.colorText} 8%, transparent);
    --page-editor-code-block-bg: color-mix(in srgb, ${cssVar.colorText} 6%, transparent);
    --page-editor-code-text: color-mix(in srgb, ${cssVar.colorText} 86%, #eb5757);

    [data-lexical-editor='true'] {
      width: calc(100% + 30px);
      margin-inline-start: -30px;
      padding-inline: 30px 0 !important;

      font-family: var(--page-editor-font-sans);
      font-size: 16px;
      font-weight: 400;
      line-height: 1.5;
      color: var(--page-editor-text);
      text-rendering: optimizelegibility;
      letter-spacing: 0;

      caret-color: var(--page-editor-text);
    }

    [data-lexical-editor='true'] *::selection,
    [data-lexical-editor='true'] ::selection {
      background: var(--page-editor-selection);
    }

    [data-lexical-editor='true'] > * {
      min-height: 24px;
      margin-block: 0;
      padding-block: 3px;
      border-radius: 3px;

      font: inherit;
      color: inherit;

      transition:
        background-color 100ms ease,
        box-shadow 100ms ease;
    }

    [data-lexical-editor='true'] [data-lobe-editor-hovered-block='true'] {
      background: var(--page-editor-block-hover);
      box-shadow:
        -4px 0 0 var(--page-editor-block-hover),
        4px 0 0 var(--page-editor-block-hover);
    }

    [data-lexical-editor='true'] [data-placeholder]::before {
      pointer-events: none;
      content: attr(data-placeholder);
      color: var(--page-editor-placeholder);
      opacity: 0.85;
    }

    [data-lexical-editor='true'] h1,
    [data-lexical-editor='true'] h2,
    [data-lexical-editor='true'] h3 {
      margin-block: 0;

      font-family: var(--page-editor-font-sans);
      font-weight: 600;
      color: var(--page-editor-text);
      letter-spacing: -0.003em;
    }

    [data-lexical-editor='true'] h1 {
      min-height: 40px;
      padding-block: 6px 3px;
      font-size: 30px;
      line-height: 1.2;
    }

    [data-lexical-editor='true'] h2 {
      min-height: 34px;
      padding-block: 5px 2px;
      font-size: 24px;
      line-height: 1.25;
    }

    [data-lexical-editor='true'] h3 {
      min-height: 30px;
      padding-block: 4px 2px;
      font-size: 20px;
      line-height: 1.3;
    }

    [data-lexical-editor='true'] a {
      color: var(--page-editor-link);
      text-decoration: underline;
      text-underline-offset: 2px;
      transition: color 100ms ease;
    }

    [data-lexical-editor='true'] code {
      padding-block: 0.2em;
      padding-inline: 0.4em;
      border-radius: 3px;

      font-family: var(--page-editor-font-mono);
      font-size: 85%;
      color: var(--page-editor-code-text);

      background: var(--page-editor-code-bg);
    }

    [data-lexical-editor='true'] pre,
    [data-lexical-editor='true'] pre code {
      font-family: var(--page-editor-font-mono);
      font-size: 13.6px;
      line-height: 1.45;
    }

    [data-lexical-editor='true'] strong,
    [data-lexical-editor='true'] b {
      font-weight: 600;
    }

    [data-lexical-editor='true'] ul,
    [data-lexical-editor='true'] ol {
      margin-block: 0;
      padding-block: 2px;
      padding-inline-start: 1.45em;
    }

    [data-lexical-editor='true'] li {
      min-height: 24px;
      padding-block: 1px;
      padding-inline-start: 0.15em;
    }

    [data-lexical-editor='true'] li::marker {
      color: var(--page-editor-text-secondary);
    }

    [data-lexical-editor='true'] input[type='checkbox'] {
      width: 16px;
      height: 16px;
      margin-block: 0;
      margin-inline: 0 8px;
      border: 1px solid var(--page-editor-border);
      border-radius: 3px;

      vertical-align: -2px;

      accent-color: #2383e2;
    }

    [data-lexical-editor='true'] li[aria-checked='true'],
    [data-lexical-editor='true'] li[data-checked='true'],
    [data-lexical-editor='true'] li.checked {
      color: var(--page-editor-text-tertiary);
      text-decoration: line-through;
    }

    [data-lexical-editor='true'] details {
      padding-block: 2px;
    }

    [data-lexical-editor='true'] summary {
      cursor: pointer;
      min-height: 24px;
      list-style-position: outside;
    }

    [data-lexical-editor='true'] summary::marker {
      color: var(--page-editor-text-tertiary);
    }

    [data-lexical-editor='true'] blockquote {
      margin-block: 4px;
      margin-inline: 0;
      padding-block: 2px;
      padding-inline-start: 14px;
      border-inline-start: 3px solid var(--page-editor-text);

      color: var(--page-editor-text);
    }

    [data-lexical-editor='true'] [data-callout],
    [data-lexical-editor='true'] .callout,
    [data-lexical-editor='true'] [class*='callout' i] {
      display: flex;
      gap: 10px;
      align-items: flex-start;

      margin-block: 4px;
      padding: 16px;
      border-radius: 3px;

      background: var(--page-editor-callout-bg);
    }

    [data-lexical-editor='true'] pre {
      overflow: auto;

      margin-block: 6px;
      padding: 16px;
      border-radius: 4px;

      background: var(--page-editor-code-block-bg);
    }

    [data-lexical-editor='true'] pre code {
      padding: 0;
      color: var(--page-editor-text);
      background: transparent;
    }

    [data-lexical-editor='true'] hr {
      height: 1px;
      margin-block: 13px;
      border: 0;
      background: var(--page-editor-border);
    }

    [data-lexical-editor='true'] img {
      display: block;

      max-width: 100%;
      height: auto;
      margin-block: 6px;
      border-radius: 3px;
    }

    [data-lexical-editor='true'] figure {
      margin-block: 6px;
      margin-inline: 0;
    }

    [data-lexical-editor='true'] figcaption,
    [data-lexical-editor='true'] [data-caption] {
      min-height: 20px;
      margin-block-start: 6px;

      font-size: 14px;
      line-height: 20px;
      color: var(--page-editor-text-tertiary);
      text-align: center;
    }

    [data-lexical-editor='true'] table {
      table-layout: fixed;
      border-collapse: collapse;

      width: 100%;
      margin-block: 8px;

      font-size: 14px;
      line-height: 20px;
    }

    [data-lexical-editor='true'] th,
    [data-lexical-editor='true'] td {
      min-width: 120px;
      height: 32px;
      padding-block: 6px;
      padding-inline: 8px;
      border: 1px solid var(--page-editor-border);

      vertical-align: top;
    }

    [data-lexical-editor='true'] th {
      font-weight: 500;
      color: var(--page-editor-text-secondary);
      background: color-mix(in srgb, ${cssVar.colorText} 4%, transparent);
    }

    [data-lexical-editor='true'] tr:hover td {
      background: color-mix(in srgb, ${cssVar.colorText} 2.5%, transparent);
    }

    [data-lexical-editor='true'] .editor_table_scrollable_wrapper,
    [data-lexical-editor='true'] .PlaygroundEditorTheme__tableScrollableWrapper {
      overflow: auto hidden;
      margin-block: 8px;
      padding-block-end: 4px;
      border-radius: 3px;
    }

    [data-lexical-editor='true'] .editor_table {
      width: max-content;
      min-width: 100%;
      margin-block: 0;
    }

    [data-lexical-editor='true'] .editor_table_cell,
    [data-lexical-editor='true'] .PlaygroundEditorTheme__tableCell {
      position: relative;

      min-width: 120px;
      height: 34px;
      padding-block: 7px;
      padding-inline: 8px;
      border-color: var(--page-editor-border);

      transition: background-color 80ms ease;
    }

    [data-lexical-editor='true'] .editor_table_cell_header,
    [data-lexical-editor='true'] .PlaygroundEditorTheme__tableCellHeader {
      color: var(--page-editor-text-secondary);
      background: color-mix(in srgb, ${cssVar.colorText} 4.5%, transparent);
    }

    [data-lexical-editor='true'] .editor_table_cell:hover,
    [data-lexical-editor='true'] .PlaygroundEditorTheme__tableCell:hover {
      background: color-mix(in srgb, ${cssVar.colorText} 3%, transparent);
    }

    .tableAddRows,
    .tableAddColumns {
      width: 24px !important;
      height: 24px !important;
      border: 1px solid var(--page-editor-border) !important;
      border-radius: 4px !important;

      color: var(--page-editor-text-secondary) !important;

      opacity: 0.86;
      background: ${cssVar.colorBgElevated} !important;
      box-shadow: 0 2px 6px rgb(0 0 0 / 8%) !important;

      transition:
        background-color 100ms ease,
        opacity 100ms ease,
        transform 100ms ease;
    }

    .tableAddRows:hover,
    .tableAddColumns:hover {
      transform: scale(1.03);
      opacity: 1;
      background: color-mix(in srgb, ${cssVar.colorText} 6%, ${cssVar.colorBgElevated}) !important;
    }

    .TableCellResizer__resizer {
      z-index: 12;
    }

    .TableCellResizer__resizer:hover {
      background: #2383e2 !important;
      mix-blend-mode: unset !important;
    }

    .table-cell-action-button-container--active {
      opacity: 1;
      transition: opacity 100ms ease;
    }

    .table-cell-action-button-container--inactive {
      pointer-events: none;
      opacity: 0;
      transition: opacity 100ms ease;
    }

    [data-block-drag-handle='true'],
    [aria-label='Block actions and drag'],
    [aria-label='Add block below'] {
      width: 20px !important;
      min-width: 20px !important;
      height: 22px !important;
      border-radius: 3px !important;

      color: ${cssVar.colorTextQuaternary} !important;

      opacity: 0.58;

      transition:
        background-color 100ms ease,
        color 100ms ease,
        opacity 100ms ease,
        transform 100ms ease;
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
      width: 14px !important;
      height: 14px !important;
    }
  `,
  slashMenu: css`
    position: fixed;
    z-index: 1500;
    transform-origin: top center;

    overflow: hidden;

    width: min(${SLASH_MENU_WIDTH}px, calc(100vw - 24px));
    max-height: min(${SLASH_MENU_MAX_HEIGHT}px, calc(100vh - 24px));
    padding: 4px;
    border: 1px solid color-mix(in srgb, ${cssVar.colorBorder} 58%, transparent);
    border-radius: 10px;

    background: ${cssVar.colorBgElevated};
    box-shadow:
      0 12px 28px rgb(15 23 42 / 16%),
      0 2px 8px rgb(15 23 42 / 10%);

    animation: lobe-slash-menu-pop 100ms cubic-bezier(0.16, 1, 0.3, 1);
  `,
  slashMenuSectionLabel: css`
    user-select: none;

    display: flex;
    align-items: center;

    height: 26px;
    padding-inline: 10px;

    font-size: 11px;
    font-weight: 600;
    color: ${cssVar.colorTextTertiary};
  `,
  slashMenuDivider: css`
    height: 1px;
    margin-block: 4px;
    background: color-mix(in srgb, ${cssVar.colorBorder} 58%, transparent);
  `,
  slashMenuFooter: css`
    display: flex;
    align-items: center;
    justify-content: space-between;

    height: 30px;
    margin-block: 4px -4px;
    margin-inline: -4px;
    padding-inline: 12px;
    border-block-start: 1px solid color-mix(in srgb, ${cssVar.colorBorder} 58%, transparent);

    font-size: 12px;
    color: ${cssVar.colorTextTertiary};
  `,
  slashMenuFooterShortcut: css`
    font-size: 12px;
    color: ${cssVar.colorTextQuaternary};
  `,
  slashMenuList: css`
    overflow: hidden auto;
    max-height: min(356px, calc(100vh - 72px));
    padding-block: 2px;
  `,
  slashMenuItem: css`
    cursor: pointer;

    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;

    width: 100%;
    min-height: 46px;
    padding-block: 5px;
    padding-inline: 6px 8px;
    border: 0;
    border-radius: 6px;

    color: ${cssVar.colorText};
    text-align: start;

    background: transparent;

    transition: background-color 80ms ease;

    &:hover {
      background: color-mix(in srgb, ${cssVar.colorText} 7%, transparent);
    }
  `,
  slashMenuItemActive: css`
    background: color-mix(in srgb, ${cssVar.colorText} 8%, transparent);
  `,
  slashMenuItemExtra: css`
    overflow: hidden;
    display: block;

    margin-block-start: 1px;

    font-size: 12px;
    line-height: 16px;
    color: ${cssVar.colorTextTertiary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  slashMenuItemIcon: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 24px;
    height: 24px;
    border-radius: 4px;

    color: ${cssVar.colorTextSecondary};

    background: color-mix(in srgb, ${cssVar.colorText} 5%, transparent);
  `,
  slashMenuItemTitle: css`
    overflow: hidden;
    display: block;

    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  slashMenuShortcut: css`
    font-size: 12px;
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
    const slashMenuListRef = useRef<HTMLDivElement>(null);
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

    // Inject real search input + structural chrome into block operation dropdown
    useEffect(() => {
      const DROPDOWN_SELECTOR = '.lobe-block-operation-dropdown .ant-dropdown-menu';
      const ITEM_SELECTOR =
        '.ant-dropdown-menu-item:not(.block-menu-search-item):not(.block-menu-meta-item)';
      const SEARCH_CLASS = 'block-menu-search-item';
      const META_CLASS = 'block-menu-meta-item';
      const DIVIDER_CLASS = 'block-menu-group-divider';

      let activeInput: HTMLInputElement | null = null;
      let activeHighlight = 0;

      const getVisibleItems = (menu: Element): HTMLElement[] =>
        Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
          (el) => el.style.display !== 'none',
        );

      const highlightItem = (menu: Element, index: number) => {
        const items = getVisibleItems(menu);
        for (const [i, item] of items.entries()) {
          item.classList.toggle('ant-dropdown-menu-item-active', i === index);
        }
      };

      // Detect block type label for the hovered block
      const getBlockTypeLabel = (): string => {
        const blockEl = hoveredBlockElementRef.current;
        if (!blockEl) return '';
        const tag = blockEl.tagName.toLowerCase();
        if (tag === 'h1') return tEditor('slash.h1', { defaultValue: 'Heading 1' });
        if (tag === 'h2') return tEditor('slash.h2', { defaultValue: 'Heading 2' });
        if (tag === 'h3') return tEditor('slash.h3', { defaultValue: 'Heading 3' });
        if (tag === 'h4') return tEditor('slash.h4', { defaultValue: 'Heading 4' });
        const closestList = blockEl.closest('ul, ol');
        if (closestList?.tagName.toLowerCase() === 'ul')
          return tEditor('typobar.bulletList', { defaultValue: 'Bulleted list' });
        if (closestList?.tagName.toLowerCase() === 'ol')
          return tEditor('typobar.numberList', { defaultValue: 'Numbered list' });
        return tEditor('selectionToolbar.text', { defaultValue: 'Text' });
      };

      // Map known item labels to keyboard shortcut display strings
      const getItemShortcut = (text: string): string => {
        const lower = text.toLowerCase().trim();
        if (lower.includes('copy link') || lower.includes('copy block link')) return '⌘^L';
        if (lower.includes('duplicate')) return '⌘D';
        if (lower.includes('move to')) return '⌘⇧P';
        if (lower.includes('delete')) return 'Del';
        if (lower.includes('suggest edits')) return '⌘⇧^X';
        if (lower.includes('ask ai')) return '⌘J';
        return '';
      };

      const injectIntoMenu = (menu: Element) => {
        if (menu.querySelector(`.${SEARCH_CLASS}`)) return;

        // ── Search input ──
        const searchLi = document.createElement('li');
        searchLi.className = `${SEARCH_CLASS} ant-dropdown-menu-item`;
        searchLi.setAttribute('role', 'none');

        const input = document.createElement('input');
        input.className = 'block-menu-search-input';
        input.placeholder = tEditor('blockMenu.searchActions', {
          defaultValue: 'Search actions...',
        });
        input.type = 'text';
        input.setAttribute('aria-label', 'Search actions');
        input.setAttribute('spellcheck', 'false');
        searchLi.append(input);
        menu.prepend(searchLi);
        activeInput = input;
        activeHighlight = 0;

        // ── Block type label ──
        const blockTypeLabel = getBlockTypeLabel();
        if (blockTypeLabel) {
          const typeLi = document.createElement('li');
          typeLi.className = 'block-menu-type-label';
          typeLi.setAttribute('role', 'none');
          typeLi.textContent = blockTypeLabel;
          searchLi.after(typeLi);
        }

        // ── Keyboard shortcuts on each item ──
        const allItems = Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
        for (const item of allItems) {
          const titleContent = item.querySelector('.ant-dropdown-menu-title-content');
          if (!titleContent) continue;
          const text = titleContent.textContent || '';
          const shortcut = getItemShortcut(text);
          if (shortcut && !item.querySelector('.block-menu-item-shortcut')) {
            const shortcutSpan = document.createElement('span');
            shortcutSpan.className = 'block-menu-item-shortcut';
            shortcutSpan.textContent = shortcut;
            titleContent.append(shortcutSpan);
          }
        }

        // ── Dividers between action groups (after Delete / after Comment) ──
        // Items: copy-block, copy-link, duplicate, move-to, delete | comment, suggest-edits | present, ask-ai
        const insertDividerBefore = (itemIndex: number) => {
          const items = Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
          const target = items[itemIndex];
          if (!target) return;
          const existing = target.previousElementSibling;
          if (existing?.classList.contains(DIVIDER_CLASS)) return;
          const divider = document.createElement('li');
          divider.className = DIVIDER_CLASS;
          divider.setAttribute('role', 'separator');
          menu.insertBefore(divider, target);
        };
        // Groups: [0-4] core | [5-6] ai-tools | [7-8] present/ai
        insertDividerBefore(5); // before Comment
        insertDividerBefore(7); // before Present

        // ── Last edited metadata ──
        const metaLi = document.createElement('li');
        metaLi.className = `${META_CLASS} ant-dropdown-menu-item`;
        metaLi.setAttribute('role', 'none');
        const metaText = document.createElement('div');
        metaText.className = 'block-menu-meta-text';
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        metaText.textContent = `${tEditor('blockMenu.lastEditedAt', { defaultValue: 'Just now at' })} ${timeStr}`;
        metaLi.append(metaText);
        menu.append(metaLi);

        // Focus after brief delay so the menu renders first
        setTimeout(() => {
          input.focus({ preventScroll: true });
          activeHighlight = 0;
          highlightItem(menu, 0);
        }, 40);

        // Filter items
        input.addEventListener('input', () => {
          const query = input.value.toLowerCase().trim();
          const items = Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
          for (const item of items) {
            const text = item.textContent?.toLowerCase() || '';
            item.style.display = !query || text.includes(query) ? '' : 'none';
          }
          // Hide dividers if the surrounding groups are empty
          for (const div of menu.querySelectorAll<HTMLElement>(`.${DIVIDER_CLASS}`)) {
            const next = div.nextElementSibling as HTMLElement | null;
            div.style.display = next?.style.display === 'none' || !next ? 'none' : '';
          }
          activeHighlight = 0;
          highlightItem(menu, 0);
        });

        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            document.documentElement.dataset.pageEditorBlockMenuDismissed = 'true';
            return;
          }
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const items = getVisibleItems(menu);
            if (items.length === 0) return;
            activeHighlight =
              e.key === 'ArrowDown'
                ? (activeHighlight + 1) % items.length
                : (activeHighlight - 1 + items.length) % items.length;
            highlightItem(menu, activeHighlight);
            items[activeHighlight]?.scrollIntoView({ block: 'nearest' });
            return;
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            const items = getVisibleItems(menu);
            const target = items[activeHighlight] ?? items[0];
            target?.click();
          }
        });
      };

      const observer = new MutationObserver(() => {
        const menu = document.querySelector(DROPDOWN_SELECTOR);
        if (menu) {
          injectIntoMenu(menu);
        } else {
          activeInput = null;
          activeHighlight = 0;
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      return () => {
        observer.disconnect();
        activeInput = null;
      };
    }, [tEditor]);

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

          if (
            (event.key === 'Enter' || event.key === 'Tab') &&
            filteredSelectableSlashItems.length > 0
          ) {
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
        const hasTrigger = slashFallback.triggerText !== undefined;

        // When opened via "/", the command marker must still precede the query.
        if (hasTrigger && !prefixText.startsWith('/')) {
          closeSlashFallback();
          return;
        }

        const rawQuery = hasTrigger ? prefixText.slice(1) : prefixText;
        const normalizedQuery = rawQuery.trim();

        // "/" followed only by whitespace means the command was abandoned.
        if (rawQuery.length > 0 && normalizedQuery.length === 0) {
          closeSlashFallback();
          return;
        }

        // Allow interior spaces (e.g. "/heading 1") so multi-word queries keep
        // filtering — as long as the query still matches at least one block.
        // A query that matches nothing dismisses the menu so typing prose after
        // a finished word isn't hijacked.
        const stillMatchesQuery =
          normalizedQuery.length === 0 ||
          selectableSlashItems.some((item) => matchesSlashQuery(item, normalizedQuery));

        if (!stillMatchesQuery) {
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
    }, [closeSlashFallback, editor, slashFallback, selectableSlashItems]);

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

    // Keep the highlighted item visible while navigating with the arrow keys.
    useEffect(() => {
      const activeIndex = slashFallback?.activeIndex;
      if (activeIndex === undefined) return;

      slashMenuListRef.current
        ?.querySelector(`[data-slash-index="${activeIndex}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    }, [slashFallback?.activeIndex]);

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
          // Keep the toolbar in place while interacting with its own controls
          // (e.g. the inline AI input), which would otherwise collapse the selection.
          if (document.activeElement?.closest('.page-editor-selection-toolbar')) return;

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
        <style>{getBlockOperationPortalStyles()}</style>
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
            <div className={styles.slashMenuList} ref={slashMenuListRef}>
              <div className={styles.slashMenuSectionLabel}>
                {tEditor('slash.category.basic', { defaultValue: 'Basic blocks' })}
              </div>
              {(() => {
                let dividerIndex = 0;

                return slashItemList.map((item, index) => {
                  if (!isSlashMenuOption(item)) {
                    const labels = [
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
                      aria-selected={isActive}
                      className={cx(styles.slashMenuItem, isActive && styles.slashMenuItemActive)}
                      data-slash-index={optionIndex}
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
                        {Icon ? <Icon size={17} /> : null}
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
