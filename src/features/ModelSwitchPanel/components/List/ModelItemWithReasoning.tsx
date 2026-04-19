import { type ChatModelCard } from '@lobechat/types';
import { memo } from 'react';

import { ModelItemRender } from '@/components/ModelSelect';
import { useModelReasoning } from '@/features/ModelSwitchPanel/hooks/useModelReasoning';
import type { LobeAgentChatConfig } from '@/types/agent';

interface ModelItemWithReasoningProps extends ChatModelCard {
  chatConfig?: Partial<LobeAgentChatConfig>;
  newBadgeLabel?: string;
  proBadgeLabel?: string;
  provider: string;
  showInfoTag?: boolean;
}

const ModelItemWithReasoning = memo<ModelItemWithReasoningProps>(
  ({ chatConfig, provider, showInfoTag, newBadgeLabel, proBadgeLabel, ...model }) => {
    const reasoning = useModelReasoning(model.id, provider, chatConfig);

    return (
      <ModelItemRender
        {...model}
        newBadgeLabel={newBadgeLabel}
        proBadgeLabel={proBadgeLabel}
        reasoningLabel={reasoning?.label}
        showInfoTag={showInfoTag}
      />
    );
  },
);

ModelItemWithReasoning.displayName = 'ModelItemWithReasoning';

export default ModelItemWithReasoning;
