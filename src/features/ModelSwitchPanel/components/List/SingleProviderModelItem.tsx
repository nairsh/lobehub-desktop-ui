import { memo } from 'react';

import { type ModelWithProviders } from '../../types';
import ModelItemWithReasoning from './ModelItemWithReasoning';

interface SingleProviderModelItemProps {
  data: ModelWithProviders;
  newLabel: string;
  proBadgeLabel?: string;
  showInfoTag?: boolean;
}

export const SingleProviderModelItem = memo<SingleProviderModelItemProps>(
  ({ data, newLabel, proBadgeLabel, showInfoTag }) => {
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
