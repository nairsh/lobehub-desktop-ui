import { SESSION_CHAT_URL } from '@lobechat/const';
import { type SidebarAgentItem } from '@lobechat/types';
import { ActionIcon, Icon } from '@lobehub/ui';
import { BotPromptIcon } from '@lobehub/ui/icons';
import { cssVar } from 'antd-style';
import { Loader2, PinIcon, RadioTowerIcon } from 'lucide-react';
import { type CSSProperties, type DragEvent } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import urlJoin from 'url-join';

import NavItem from '@/features/NavPanel/components/NavItem';
import { usePrefetchAgent } from '@/hooks/usePrefetchAgent';
import { useChatStore } from '@/store/chat';
import { operationSelectors } from '@/store/chat/selectors';
import { useGlobalStore } from '@/store/global';
import { useHomeStore } from '@/store/home';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { prefetchRoute } from '@/utils/router';

import { useAgentModal } from '../../context';
import Actions from '../Item/Actions';
import Avatar from './Avatar';
import { useAgentDropdownMenu } from './useDropdownMenu';

interface AgentItemProps {
  className?: string;
  item: SidebarAgentItem;
  style?: CSSProperties;
}

const AgentItem = memo<AgentItemProps>(({ item, style, className }) => {
  const { id, avatar, backgroundColor, title, pinned } = item;
  const { t } = useTranslation('chat');
  const { openCreateGroupModal } = useAgentModal();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const openAgentInNewWindow = useGlobalStore((s) => s.openAgentInNewWindow);
  const navigate = useNavigate();
  const switchTopic = useChatStore((s) => s.switchTopic);
  const { isAgentEditable } = useServerConfigStore(featureFlagsSelectors);

  const prefetchAgent = usePrefetchAgent();
  const isUpdating = useHomeStore((s) => s.agentUpdatingId === id);

  // Separate loading state from chat store - only show loading for this specific agent
  const isLoading = useChatStore(operationSelectors.isAgentRunning(id));

  // Get display title with fallback
  const displayTitle = title || t('untitledAgent');

  // Get URL for this agent
  const agentUrl = SESSION_CHAT_URL(id, false);

  // Memoize event handlers
  const handleMouseEnter = useCallback(() => {
    prefetchAgent(id);
    prefetchRoute(agentUrl);
  }, [id, prefetchAgent, agentUrl]);

  const handleDoubleClick = useCallback(() => {
    openAgentInNewWindow(id);
  }, [id, openAgentInNewWindow]);

  const handleDragStart = useCallback(
    (e: DragEvent) => {
      e.dataTransfer.setData('text/plain', id);
    },
    [id],
  );

  const handleDragEnd = useCallback(
    (e: DragEvent) => {
      if (e.dataTransfer.dropEffect === 'none') {
        openAgentInNewWindow(id);
      }
    },
    [id, openAgentInNewWindow],
  );

  const handleOpenCreateGroupModal = useCallback(() => {
    openCreateGroupModal(id);
  }, [id, openCreateGroupModal]);

  // Memoize pin icon
  const pinIcon = useMemo(
    () =>
      pinned ? (
        <ActionIcon icon={PinIcon} size={12} style={{ opacity: 0.5, pointerEvents: 'none' }} />
      ) : undefined,
    [pinned],
  );

  // Memoize avatar icon (show loader when updating)
  const avatarIcon = useMemo(() => {
    if (isUpdating) {
      return <Icon spin color={cssVar.colorTextDescription} icon={Loader2} size={18} />;
    }

    return (
      <Avatar
        avatar={typeof avatar === 'string' ? avatar : undefined}
        avatarBackground={backgroundColor || undefined}
      />
    );
  }, [isUpdating, avatar, backgroundColor]);

  const dropdownMenu = useAgentDropdownMenu({
    anchor,
    avatar: typeof avatar === 'string' ? avatar : undefined,
    group: undefined, // TODO: pass group from parent if needed
    id,
    openCreateGroupModal: handleOpenCreateGroupModal,
    pinned: pinned ?? false,
    title: displayTitle,
  });

  const handleNavigate = useCallback(
    (subPath: 'profile' | 'channel') => {
      switchTopic(null, { skipRefreshMessage: true });
      navigate(urlJoin('/agent', id, subPath));
    },
    [id, navigate, switchTopic],
  );

  const actions = useMemo(
    () => (
      <>
        {isAgentEditable && (
          <ActionIcon
            icon={BotPromptIcon}
            size={'small'}
            title={t('tab.profile')}
            tooltipProps={{ placement: 'top' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNavigate('profile');
            }}
          />
        )}
        {isAgentEditable && (
          <ActionIcon
            icon={RadioTowerIcon}
            size={'small'}
            title={t('tab.integration')}
            tooltipProps={{ placement: 'top' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNavigate('channel');
            }}
          />
        )}
        <Actions dropdownMenu={dropdownMenu} />
      </>
    ),
    [dropdownMenu, handleNavigate, isAgentEditable, t],
  );

  return (
    <Link aria-label={displayTitle} ref={setAnchor} to={agentUrl} onMouseEnter={handleMouseEnter}>
      <NavItem
        actions={actions}
        className={className}
        contextMenuItems={dropdownMenu}
        disabled={isUpdating}
        draggable={!isUpdating}
        extra={pinIcon}
        icon={avatarIcon}
        key={id}
        loading={isLoading}
        style={style}
        title={displayTitle}
        onDoubleClick={handleDoubleClick}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      />
    </Link>
  );
});

export default AgentItem;
