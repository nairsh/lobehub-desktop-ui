import { type ChatModelCard } from '@lobechat/types';
import { memo } from 'react';

import { ModelItemRender } from '@/components/ModelSelect';
import { useModelReasoning } from '@/features/ModelSwitchPanel/hooks/useModelReasoning';

interface ModelItemWithReasoningProps extends ChatModelCard {
  newBadgeLabel?: string;
  proBadgeLabel?: string;
  provider: string;
  showInfoTag?: boolean;
}

const ModelItemWithReasoning = memo<ModelItemWithReasoningProps>(
  ({ provider, showInfoTag, newBadgeLabel, proBadgeLabel, ...model }) => {
    const reasoning = useModelReasoning(model.id, provider);

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
