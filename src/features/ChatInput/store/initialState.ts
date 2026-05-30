import { type OpenAIChatMessage } from '@lobechat/types';
import { type IEditor, type SlashOptions } from '@lobehub/editor';
import { type ChatInputProps } from '@lobehub/editor/react';
import { type MenuProps } from '@lobehub/ui';

import { type ActionKeys } from '@/features/ChatInput';

export type SendButtonHandler = (params: {
  clearContent: () => void;
  councilMode: boolean;
  editor: IEditor;
  getEditorData: () => Record<string, any> | undefined;
  getMarkdownContent: () => string;
}) => Promise<void> | void;

export interface SendButtonProps {
  disabled?: boolean;
  generating: boolean;
  onStop: (params: { editor: IEditor }) => void;
  shape?: 'round' | 'default';
  size?: number;
}

export const initialSendButtonState: SendButtonProps = {
  disabled: false,
  generating: false,
  onStop: () => {},
};

export type SlashPlacement = 'top' | 'bottom';

export interface PublicState {
  agentId?: string;
  allowExpand?: boolean;
  expand?: boolean;
  getMessages?: () => OpenAIChatMessage[];
  leftActions: ActionKeys[];
  mentionItems?: SlashOptions['items'];
  mobile?: boolean;
  onMarkdownContentChange?: (content: string) => void;
  onSend?: SendButtonHandler;
  rightActions: ActionKeys[];
  sendButtonProps?: SendButtonProps;
  sendMenu?: MenuProps;
  showTypoBar?: boolean;
  /** Whether this input surface honors Model Council mode on send (gates the dropdown toggle) */
  supportsCouncil?: boolean;
  /**
   * Slash menu placement: 'bottom' for home page (input in center), 'top' for page input (at bottom)
   */
  slashPlacement?: SlashPlacement;
}

export interface State extends PublicState {
  _savedEditorState?: Record<string, any>;
  /** Whether Model Council mode is armed — sends the next message to multiple models */
  councilMode: boolean;
  editor?: IEditor;
  isContentEmpty: boolean;
  markdownContent: string;
  pendingSuggestion: null | {
    id: number;
    text: string;
  };
  slashMenuRef: ChatInputProps['slashMenuRef'];
}

export const initialState: State = {
  allowExpand: true,
  councilMode: false,
  expand: false,
  isContentEmpty: false,
  leftActions: [],
  markdownContent: '',
  pendingSuggestion: null,
  rightActions: [],
  slashMenuRef: { current: null },
  slashPlacement: 'top',
};
