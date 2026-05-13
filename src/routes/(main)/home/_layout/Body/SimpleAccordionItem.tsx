'use client';

import { AccordionItem, Text } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const CommunityItem = memo<{ itemKey: string }>(({ itemKey }) => {
  const { t } = useTranslation('common');

  return (
    <Link style={{ color: 'inherit', textDecoration: 'none' }} to="/community">
      <AccordionItem
        hideIndicator
        itemKey={itemKey}
        paddingBlock={4}
        paddingInline={'8px 4px'}
        title={
          <Text ellipsis fontSize={12} weight={600}>
            {t('tab.community')}
          </Text>
        }
      />
    </Link>
  );
});

export const ResourceItem = memo<{ itemKey: string }>(({ itemKey }) => {
  const { t } = useTranslation('common');

  return (
    <Link style={{ color: 'inherit', textDecoration: 'none' }} to="/resource">
      <AccordionItem
        hideIndicator
        itemKey={itemKey}
        paddingBlock={4}
        paddingInline={'8px 4px'}
        title={
          <Text ellipsis fontSize={12} weight={600}>
            {t('tab.resource')}
          </Text>
        }
      />
    </Link>
  );
});
