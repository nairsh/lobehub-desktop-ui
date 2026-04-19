'use client';

import { useMemo } from 'react';

import { useAgentId } from '@/features/ChatInput/hooks/useAgentId';
import { useAgentStore } from '@/store/agent';
import { chatConfigByIdSelectors } from '@/store/agent/selectors';
import { aiModelSelectors, useAiInfraStore } from '@/store/aiInfra';
import { resolveReasoningOption } from '@/utils/modelReasoning';

export const useModelReasoning = (model: string, provider: string) => {
  const agentId = useAgentId();
  const chatConfig = useAgentStore((s) => chatConfigByIdSelectors.getChatConfigById(agentId)(s));
  const modelExtendParams = useAiInfraStore(aiModelSelectors.modelExtendParams(model, provider));

  return useMemo(
    () =>
      resolveReasoningOption({
        chatConfig,
        modelExtendParams,
      }),
    [chatConfig, modelExtendParams],
  );
};
