'use client';

import { memo, useCallback } from 'react';

import PromptTransformAction from '@/features/PromptTransform/PromptTransformAction';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors, agentSelectors } from '@/store/agent/selectors';
import { buildRefineSuggestion } from '@/utils/chat/refineSuggestion';

import { useAgentId } from '../../hooks/useAgentId';
import { useChatInputStore, useStoreApi } from '../../store';

const PromptTransform = memo(() => {
  const [editor, markdownContent] = useChatInputStore((s) => [s.editor, s.markdownContent]);
  const storeApi = useStoreApi();
  const routeAgentId = useAgentId();
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const agentId = activeAgentId || routeAgentId || '';
  const taskConfig = useAgentStore((s) => ({
    model: agentId
      ? agentByIdSelectors.getAgentModelById(agentId)(s)
      : agentSelectors.currentAgentModel(s),
    provider: agentId
      ? agentByIdSelectors.getAgentModelProviderById(agentId)(s)
      : agentSelectors.currentAgentModelProvider(s),
  }));

  const onPromptChange = useCallback(
    (prompt: string) => {
      if (!editor) return;

      const result = buildRefineSuggestion({
        currentPrompt: markdownContent,
        rewrittenPrompt: prompt,
      });
      if (!result) return;

      if (result.prefix !== markdownContent.trimEnd()) {
        editor.setDocument('markdown', result.prefix);
      }

      editor.focus();
      storeApi.setState({
        pendingSuggestion: {
          id: Date.now(),
          text: result.suggestion,
        },
      });
    },
    [editor, markdownContent, storeApi],
  );

  const getPrompt = useCallback(() => markdownContent || '', [markdownContent]);

  return (
    <PromptTransformAction
      getPrompt={getPrompt}
      mode={'text'}
      prompt={markdownContent}
      taskConfig={taskConfig}
      onPromptChange={onPromptChange}
    />
  );
});

PromptTransform.displayName = 'PromptTransform';

export default PromptTransform;
