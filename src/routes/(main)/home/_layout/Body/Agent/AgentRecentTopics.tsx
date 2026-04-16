'use client';

import { Flexbox, Text } from '@lobehub/ui';
import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useInitRecents } from '@/hooks/useInitRecents';
import { useHomeStore } from '@/store/home';
import { homeRecentSelectors } from '@/store/home/selectors';

import RecentListItem from '../../../features/Recents/Item';

const MAX_RECENT = 3;

const AgentRecentTopics = memo(() => {
  // Ensure recents are fetched even if the Recents accordion section is collapsed
  useInitRecents();

  const recents = useHomeStore(homeRecentSelectors.recents);
  const isInit = useHomeStore(homeRecentSelectors.isRecentsInit);

  const topics = useMemo(
    () => recents.filter((item) => item.type === 'topic').slice(0, MAX_RECENT),
    [recents],
  );

  if (!isInit || topics.length === 0) return null;

  return (
    <Flexbox gap={1} style={{ marginTop: 4 }}>
      <Text
        fontSize={10}
        type={'secondary'}
        style={{ opacity: 0.5, paddingInline: 8, paddingBlock: 2 }}
      >
        Recent
      </Text>
      {topics.map((item) => (
        <Link
          key={item.id}
          style={{ color: 'inherit', textDecoration: 'none' }}
          to={item.routePath}
        >
          <RecentListItem {...item} />
        </Link>
      ))}
    </Flexbox>
  );
});

export default AgentRecentTopics;
