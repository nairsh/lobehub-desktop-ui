'use client';

import { Flexbox } from '@lobehub/ui';
import { MessageSquarePlusIcon, SearchIcon } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import urlJoin from 'url-join';

import NavItem from '@/features/NavPanel/components/NavItem';
import { useQueryRoute } from '@/hooks/useQueryRoute';
import { usePathname } from '@/libs/router/navigation';
import { useActionSWR } from '@/libs/swr';
import { useChatStore } from '@/store/chat';
import { useGlobalStore } from '@/store/global';

const Nav = memo(() => {
  const { t } = useTranslation('chat');
  const { t: tCommon } = useTranslation('common');
  const params = useParams();
  const agentId = params.aid;
  const pathname = usePathname();
  const isProfileActive = pathname.includes('/profile');
  const isChannelActive = pathname.includes('/channel');
  const router = useQueryRoute();
  const toggleCommandMenu = useGlobalStore((s) => s.toggleCommandMenu);

  const [openNewTopicOrSaveTopic] = useChatStore((s) => [s.openNewTopicOrSaveTopic]);

  const { mutate } = useActionSWR('openNewTopicOrSaveTopic', openNewTopicOrSaveTopic);
  const handleNewTopic = () => {
    // If in agent sub-route, navigate back to agent chat first
    if ((isProfileActive || isChannelActive) && agentId) {
      router.push(urlJoin('/agent', agentId));
    }
    mutate();
  };

  return (
    <Flexbox gap={1} paddingInline={4}>
      <NavItem
        icon={MessageSquarePlusIcon}
        title={tCommon('navPanel.newChat')}
        onClick={handleNewTopic}
      />
      <NavItem
        icon={SearchIcon}
        title={t('tab.search')}
        onClick={() => {
          toggleCommandMenu(true);
        }}
      />
    </Flexbox>
  );
});

export default Nav;
