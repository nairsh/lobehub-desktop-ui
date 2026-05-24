import {
  chainRewriteGenerationPrompt,
  chainTranslate,
  type TextRewriteMode,
} from '@lobechat/prompts';
import { useCallback, useState } from 'react';

import { chatService } from '@/services/chat';
import { useUserStore } from '@/store/user';
import { systemAgentSelectors } from '@/store/user/selectors';
import { buildTextOnlyPresetTaskConfig } from '@/utils/chat/textOnlyPresetTaskConfig';
import { merge } from '@/utils/merge';

interface UsePromptTransformParams {
  getPrompt?: () => string;
  mode: 'image' | 'video' | 'text';
  onPromptChange: (prompt: string) => void;
  prompt?: string | null;
  taskConfig?: {
    model?: string;
    provider?: string;
  };
  textRewriteMode?: TextRewriteMode;
}

type PromptTransformAction = 'rewrite' | 'translate';

export const usePromptTransform = ({
  getPrompt,
  mode,
  textRewriteMode,
  prompt,
  onPromptChange,
  taskConfig,
}: UsePromptTransformParams) => {
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformAction, setTransformAction] = useState<PromptTransformAction>('rewrite');

  const rewriteConfig = useUserStore(systemAgentSelectors.promptRewrite);
  const translateConfig = useUserStore(systemAgentSelectors.translation);
  const isRewriteActionEnabled = rewriteConfig?.enabled ?? false;
  const currentPrompt = getPrompt?.()?.trim() || prompt?.trim() || '';

  const getConfigByAction = useCallback(
    (action: PromptTransformAction) =>
      action === 'rewrite' ? (rewriteConfig ?? {}) : (translateConfig ?? {}),
    [rewriteConfig, translateConfig],
  );

  const runPresetTask = useCallback(
    async (config: Record<string, unknown>, action: PromptTransformAction) => {
      let transformedPrompt = '';
      let requestFailed = false;
      const promptContent = getPrompt?.()?.trim() || prompt?.trim();

      if (!promptContent) return null;

      await chatService.fetchPresetTaskResult({
        onError: (error, rawError) => {
          requestFailed = true;
          console.error('[PromptTransform] request failed:', rawError ?? error, config);
        },
        onFinish: async (text) => {
          const nextPrompt = text.trim();
          if (nextPrompt) transformedPrompt = nextPrompt;
        },
        onMessageHandle: (chunk) => {
          if (chunk.type === 'text') {
            transformedPrompt += chunk.text;
          }
        },
        params: merge(
          buildTextOnlyPresetTaskConfig(config),
          action === 'rewrite'
            ? chainRewriteGenerationPrompt({
                mode,
                prompt: promptContent,
                textRewriteMode: mode === 'text' ? textRewriteMode : undefined,
              })
            : chainTranslate(promptContent, 'English'),
        ),
      });

      if (requestFailed) return null;

      return transformedPrompt.trim() || null;
    },
    [getPrompt, mode, prompt],
  );

  const runTransform = useCallback(
    async (action: PromptTransformAction) => {
      const promptContent = getPrompt?.()?.trim() || prompt?.trim();

      if (isTransforming || !promptContent) return;
      if (action === 'rewrite' && !isRewriteActionEnabled) return;

      setTransformAction(action);
      setIsTransforming(true);

      try {
        const resolvedConfig =
          mode === 'text' && taskConfig?.model && taskConfig?.provider
            ? taskConfig
            : getConfigByAction(action);

        const nextPrompt = await runPresetTask(resolvedConfig, action);
        if (nextPrompt) {
          onPromptChange(nextPrompt);
        }
      } finally {
        setIsTransforming(false);
        setTransformAction('rewrite');
      }
    },
    [
      getPrompt,
      getConfigByAction,
      isRewriteActionEnabled,
      isTransforming,
      mode,
      textRewriteMode,
      onPromptChange,
      runPresetTask,
      taskConfig,
    ],
  );

  const rewritePrompt = useCallback(async () => {
    await runTransform('rewrite');
  }, [runTransform]);

  const translatePrompt = useCallback(async () => {
    await runTransform('translate');
  }, [runTransform]);

  return {
    isRewriteEnabled: isRewriteActionEnabled,
    isTransformDisabled: !currentPrompt,
    isTransforming,
    rewritePrompt,
    transformAction,
    translatePrompt,
  };
};
