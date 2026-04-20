import type { IEditor } from '@lobehub/editor';

const PLACEHOLDER_NODE_TYPES = new Set(['PlaceholderBlock', 'PlaceholderInline']);

interface LexicalEditorLike {
  getEditorState: () => {
    _nodeMap?: Map<string, { getType: () => string; isAttached: () => boolean }>;
    read: (fn: () => void) => void;
  };
}

interface AutoCompletePluginInstance {
  clearPlaceholderNodes: (editor: unknown) => void;
  currentSuggestion: null | string;
  showPlaceholderNodes: (editor: unknown, suggestion: string) => void;
}

interface KernelEditorLike {
  getLexicalEditor?: () => LexicalEditorLike | null;
  pluginsInstances?: Array<{
    constructor?: { pluginName?: string };
  }>;
}

export const getAutoCompletePlugin = (editor: IEditor) => {
  const kernelEditor = editor as unknown as KernelEditorLike;
  const plugin = kernelEditor.pluginsInstances?.find(
    (instance) => instance.constructor?.pluginName === 'AutoCompletePlugin',
  );

  if (!plugin) return null;

  return plugin as AutoCompletePluginInstance;
};

export const hasPlaceholderSuggestion = (editor?: IEditor) => {
  const lexicalEditor = (editor as unknown as KernelEditorLike | undefined)?.getLexicalEditor?.();

  if (!lexicalEditor) return false;

  let found = false;

  lexicalEditor.getEditorState().read(() => {
    lexicalEditor.getEditorState()._nodeMap?.forEach((node) => {
      if (found || !node.isAttached()) return;
      if (PLACEHOLDER_NODE_TYPES.has(node.getType())) found = true;
    });
  });

  return found;
};
