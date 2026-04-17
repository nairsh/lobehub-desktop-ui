import { ActionIcon, DropdownMenu, Flexbox } from '@lobehub/ui';
import { MessageSquareIcon, MoreHorizontalIcon, UsersIcon } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

import InlineRename from '@/components/InlineRename';
import NavItem from '@/features/NavPanel/components/NavItem';
import { usePrefetchAgent } from '@/hooks/usePrefetchAgent';
import { type RecentChatItem } from '@/store/home/slices/recent/utils';

import { useRecentItemDropdownMenu } from './useDropdownMenu';

const RecentListItem = memo<RecentChatItem>((item) => {
  const { agent, id, title, type } = item;
  const [editing, setEditing] = useState(false);
  const location = useLocation();
  const prefetchAgent = usePrefetchAgent();
  const activeTopicId = new URLSearchParams(location.search).get('topic');

  const toggleEditing = useCallback((visible?: boolean) => {
    setEditing(!!visible);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (agent?.id) prefetchAgent(agent.id);
  }, [agent?.id, prefetchAgent]);

  const { dropdownMenu, handleRename } = useRecentItemDropdownMenu(item, toggleEditing);

  return (
    <Flexbox style={{ position: 'relative' }}>
      <NavItem
        active={activeTopicId === id}
        contextMenuItems={dropdownMenu}
        disabled={editing}
        height={26}
        icon={type === 'group' ? UsersIcon : MessageSquareIcon}
        title={title}
        actions={
          <DropdownMenu items={dropdownMenu()} nativeButton={false}>
            <ActionIcon icon={MoreHorizontalIcon} size={'small'} style={{ flex: 'none' }} />
          </DropdownMenu>
        }
        onMouseEnter={handleMouseEnter}
      />
      <InlineRename
        open={editing}
        title={title}
        onOpenChange={(open) => toggleEditing(open)}
        onSave={handleRename}
      />
    </Flexbox>
  );
});

export default RecentListItem;
