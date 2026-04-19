'use client';

import { useMemo } from 'react';

import { aiModelSelectors, useAiInfraStore } from '@/store/aiInfra';
import type { LobeAgentChatConfig } from '@/types/agent';
import { resolveReasoningOption } from '@/utils/modelReasoning';

export const useModelReasoning = (
  model: string,
  provider: string,
  chatConfig?: Partial<LobeAgentChatConfig>,
) => {
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
