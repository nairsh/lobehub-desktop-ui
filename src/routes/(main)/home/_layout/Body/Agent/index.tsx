'use client';

import { AccordionItem, ContextMenuTrigger, Flexbox, Text } from '@lobehub/ui';
import { FolderArchiveIcon, UsersIcon } from 'lucide-react';
import React, { memo, Suspense, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import NeuralNetworkLoading from '@/components/NeuralNetworkLoading';
import NavItem from '@/features/NavPanel/components/NavItem';
import SkeletonList from '@/features/NavPanel/components/SkeletonList';
import { useActiveTabKey } from '@/hooks/useActiveTabKey';
import { useFetchAgentList } from '@/hooks/useFetchAgentList';

import { useCreateMenuItems } from '../../hooks';
import Actions from './Actions';
import List from './List';
import { useAgentModal } from './ModalProvider';
import { useAgentActionsDropdownMenu } from './useDropdownMenu';

interface AgentProps {
  itemKey: string;
}

const CommunityResourceItems = memo(() => {
  const { t } = useTranslation('common');
  const tab = useActiveTabKey();

  return (
    <>
      <Link style={{ color: 'inherit', textDecoration: 'none' }} to="/community">
        <NavItem active={tab === 'community'} icon={UsersIcon} title={t('tab.community')} />
      </Link>
      <Link style={{ color: 'inherit', textDecoration: 'none' }} to="/resource">
        <NavItem active={tab === 'resource'} icon={FolderArchiveIcon} title={t('tab.resource')} />
      </Link>
    </>
  );
});

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
          <Text ellipsis fontSize={12} weight={600}>
            {t('navPanel.agent')}
          </Text>
          {isRevalidating && <NeuralNetworkLoading size={12} />}
        </Flexbox>
      }
    >
      <Suspense fallback={<SkeletonList rows={6} />}>
        <Flexbox gap={4} paddingBlock={1}>
          <List />
          <CommunityResourceItems />
        </Flexbox>
      </Suspense>
    </AccordionItem>
  );
});

export default Agent;
