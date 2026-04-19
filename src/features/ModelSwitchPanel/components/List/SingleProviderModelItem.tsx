import { memo } from 'react';

import { ModelItemRender } from '@/components/ModelSelect';

import { type ModelWithProviders } from '../../types';
import ModelItemWithReasoning from './ModelItemWithReasoning';

interface SingleProviderModelItemProps {
  data: ModelWithProviders;
  newLabel: string;
  proBadgeLabel?: string;
  showInfoTag?: boolean;
  showReasoningLabel?: boolean;
}

export const SingleProviderModelItem = memo<SingleProviderModelItemProps>(
  ({ data, newLabel, proBadgeLabel, showInfoTag, showReasoningLabel }) => {
    if (!showReasoningLabel) {
      return (
        <ModelItemRender
          {...data.model}
          newBadgeLabel={newLabel}
          proBadgeLabel={proBadgeLabel}
          showInfoTag={showInfoTag}
        />
      );
    }

    return (
      <ModelItemWithReasoning
        {...data.model}
        newBadgeLabel={newLabel}
        proBadgeLabel={proBadgeLabel}
        provider={data.providers[0].id}
        showInfoTag={showInfoTag}
      />
    );
  },
);

SingleProviderModelItem.displayName = 'SingleProviderModelItem';
