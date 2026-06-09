import { type IEditor } from '@lobehub/editor';

export type MetaSaveStatus = 'idle' | 'saving' | 'saved';

export interface PublicState {
  autoSave?: boolean;
  emoji?: string;
  knowledgeBaseId?: string;
  onBack?: () => void;
  onDelete?: () => void;
  onDocumentIdChange?: (newId: string) => void;
  onEmojiChange?: (emoji: string | undefined) => void;
  onSave?: () => void;
  onTitleChange?: (title: string) => void;
  parentId?: string;
  title?: string;
}

export interface State extends PublicState {
  aiIsland?: PageAiIslandState;
  documentId: string | undefined;
  editor?: IEditor;
  isMetaDirty?: boolean;
  lastSavedEmoji?: string;
  lastSavedTitle?: string;
  metaSaveStatus?: MetaSaveStatus;
}

export interface PageAiIslandState {
  content: string;
  format: 'text' | 'xml';
  id: string;
  pageId?: string;
  preview?: string;
  rect: {
    left: number;
    top: number;
    width: number;
  };
}

export const initialState: State = {
  aiIsland: undefined,
  autoSave: true,
  documentId: undefined,
  emoji: undefined,
  isMetaDirty: false,
  metaSaveStatus: 'idle',
  title: undefined,
};
