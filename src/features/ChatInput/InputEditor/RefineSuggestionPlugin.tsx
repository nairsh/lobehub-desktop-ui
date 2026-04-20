'use client';

import { useLexicalComposerContext } from '@lobehub/editor';
import { type FC, useLayoutEffect } from 'react';

import {
  getAutoCompletePlugin,
  hasPlaceholderSuggestion,
} from '@/utils/chat/placeholderSuggestion';

import { useChatInputStore, useStoreApi } from '../store';

interface LexicalEditorLike {
  registerUpdateListener: (listener: () => void) => () => void;
}

const ReactRefineSuggestionPlugin: FC = () => {
  const [editor] = useLexicalComposerContext();
  const pendingSuggestion = useChatInputStore((s) => s.pendingSuggestion);
  const storeApi = useStoreApi();
  const lexicalEditor = editor.getLexicalEditor?.() as LexicalEditorLike | null;

  useLayoutEffect(() => {
    if (!lexicalEditor) return;

    const autoCompletePlugin = getAutoCompletePlugin(editor);

    if (!autoCompletePlugin || !pendingSuggestion?.text.trim()) return;

    autoCompletePlugin.clearPlaceholderNodes(lexicalEditor);
    autoCompletePlugin.currentSuggestion = pendingSuggestion.text;
    autoCompletePlugin.showPlaceholderNodes(lexicalEditor, pendingSuggestion.text);
    storeApi.setState({ pendingSuggestion: null });
  }, [editor, lexicalEditor, pendingSuggestion, storeApi]);

  useLayoutEffect(() => {
    if (!lexicalEditor) return;

    return lexicalEditor.registerUpdateListener(() => {
      const autoCompletePlugin = getAutoCompletePlugin(editor);

      if (!autoCompletePlugin?.currentSuggestion) return;
      if (hasPlaceholderSuggestion(editor)) return;

      autoCompletePlugin.currentSuggestion = null;
    });
  }, [editor, lexicalEditor]);

  return null;
};

ReactRefineSuggestionPlugin.displayName = 'ReactRefineSuggestionPlugin';

export default ReactRefineSuggestionPlugin;
