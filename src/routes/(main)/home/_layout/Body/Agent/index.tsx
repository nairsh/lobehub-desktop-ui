'use client';

import { AccordionItem, ContextMenuTrigger, Flexbox, Text } from '@lobehub/ui';
import React, { memo, Suspense, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import NeuralNetworkLoading from '@/components/NeuralNetworkLoading';
import SkeletonList from '@/features/NavPanel/components/SkeletonList';
import { useFetchAgentList } from '@/hooks/useFetchAgentList';

import { useCreateMenuItems } from '../../hooks';
import Actions from './Actions';
import List from './List';
import { useAgentModal } from './ModalProvider';
import { useAgentActionsDropdownMenu } from './useDropdownMenu';

interface AgentProps {
  itemKey: string;
}

const Agent = memo<AgentProps>(({ itemKey }) => {
  const { t } = useTranslation('common');
  const { isRevalidating } = useFetchAgentList();

  const { openConfigGroupModal } = useAgentModal();

  // Create menu items
  const { createAgentMenuItem, createGroupChatMenuItem, isLoading } = useCreateMenuItems();

  const addMenuItems = useMemo(
    () => [createAgentMenuItem(), createGroupChatMenuItem()],
    [createAgentMenuItem, createGroupChatMenuItem],
  );

  const handleOpenConfigGroupModal = useCallback(() => {
    openConfigGroupModal();
  }, [openConfigGroupModal]);

  const dropdownMenu = useAgentActionsDropdownMenu({
    openConfigGroupModal: handleOpenConfigGroupModal,
  });

  return (
    <AccordionItem
      hideIndicator
      itemKey={itemKey}
      paddingBlock={2}
      paddingInline={'8px 4px'}
      action={
        <Actions addMenuItems={addMenuItems} dropdownMenu={dropdownMenu} isLoading={isLoading} />
      }
      headerWrapper={(header) => (
        <ContextMenuTrigger items={dropdownMenu}>{header}</ContextMenuTrigger>
      )}
      title={
        <Flexbox horizontal align="center" gap={4}>
          <Text ellipsis fontSize={11} style={{ opacity: 0.6 }} type={'secondary'} weight={400}>
            {t('navPanel.agent')}
          </Text>
          {isRevalidating && <NeuralNetworkLoading size={12} />}
        </Flexbox>
      }
    >
      <Suspense fallback={<SkeletonList rows={6} />}>
        <Flexbox gap={4} paddingBlock={1}>
          <List />
        </Flexbox>
      </Suspense>
    </AccordionItem>
  );
});

export default Agent;
