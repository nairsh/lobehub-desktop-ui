'use client';

import { Command } from 'cmdk';
import dayjs from 'dayjs';
import { MessageSquareIcon, UsersIcon } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { type RecentChatItem } from '@/store/home/slices/recent/utils';

import { CommandItem } from './components';

interface TopicBrowseResultsProps {
  isLoading: boolean;
  onClose: () => void;
  topics: RecentChatItem[];
}

const TopicBrowseResults = memo<TopicBrowseResultsProps>(({ isLoading, onClose, topics }) => {
  const { t } = useTranslation(['chat', 'common']);
  const navigate = useNavigate();

  if (isLoading && topics.length === 0) {
    return <Command.Loading>{t('loading', { ns: 'common' })}</Command.Loading>;
  }

  return (
    <Command.Group heading={t('cmdk.browseChats', { ns: 'common' })}>
      {topics.map((topic) => {
        const subtitle =
          topic.type === 'group'
            ? topic.group?.title?.trim() || t('untitledGroup')
            : topic.agent?.title?.trim() || t('untitledAgent');

        return (
          <CommandItem
            description={`${subtitle} · ${dayjs(topic.updatedAt).format('MMM D, YYYY')}`}
            icon={
              topic.type === 'group' ? <UsersIcon size={16} /> : <MessageSquareIcon size={16} />
            }
            key={topic.id}
            title={topic.title}
            value={`browse-topic ${topic.id} ${topic.title} ${subtitle}`.trim()}
            variant="detailed"
            onSelect={() => {
              navigate(topic.routePath);
              onClose();
            }}
          />
        );
      })}
    </Command.Group>
  );
});

TopicBrowseResults.displayName = 'TopicBrowseResults';

export default TopicBrowseResults;
