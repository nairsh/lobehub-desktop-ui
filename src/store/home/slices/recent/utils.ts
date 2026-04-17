import type { RecentTopic } from '@lobechat/types';

export interface RecentChatItem extends Omit<RecentTopic, 'title'> {
  routePath: string;
  title: string;
}

export const getRecentChatRoutePath = (topic: RecentTopic) => {
  if (topic.type === 'group' && topic.group?.id) {
    return `/group/${topic.group.id}?topic=${topic.id}`;
  }

  if (topic.agent?.id) {
    return `/agent/${topic.agent.id}?topic=${topic.id}`;
  }

  return `/chat?topic=${topic.id}`;
};

export const mapRecentTopicToRecentChatItem = (
  topic: RecentTopic,
  fallbackTitle: string,
): RecentChatItem => ({
  ...topic,
  routePath: getRecentChatRoutePath(topic),
  title: topic.title?.trim() || fallbackTitle,
});
