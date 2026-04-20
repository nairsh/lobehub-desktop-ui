'use client';

import { memo, useCallback } from 'react';

import PromptTransformAction from '@/features/PromptTransform/PromptTransformAction';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors, agentSelectors } from '@/store/agent/selectors';

import { useAgentId } from '../../hooks/useAgentId';
import { useChatInputStore } from '../../store';

const PromptTransform = memo(() => {
  const [editor, markdownContent] = useChatInputStore((s) => [s.editor, s.markdownContent]);
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
      editor.setDocument('markdown', prompt);
    },
    [editor],
  );

  const getPrompt = useCallback(
    () => String(editor?.getDocument('markdown') || markdownContent || ''),
    [editor, markdownContent],
  );

  return (
    <PromptTransformAction
      getPrompt={getPrompt}
      mode={'text'}
      prompt={getPrompt()}
      taskConfig={taskConfig}
      onPromptChange={onPromptChange}
    />
  );
});

PromptTransform.displayName = 'PromptTransform';

export default PromptTransform;
