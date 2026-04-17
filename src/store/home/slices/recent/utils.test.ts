import { describe, expect, it } from 'vitest';

import { getRecentChatRoutePath, mapRecentTopicToRecentChatItem } from './utils';

describe('recent chat utils', () => {
  it('should map agent topics to agent topic routes', () => {
    expect(
      getRecentChatRoutePath({
        agent: { avatar: null, backgroundColor: null, id: 'agent-1', title: 'Writer' },
        group: null,
        id: 'topic-1',
        title: 'Plan release',
        type: 'agent',
        updatedAt: new Date('2026-04-17T09:00:00.000Z'),
      }),
    ).toBe('/agent/agent-1?topic=topic-1');
  });

  it('should map group topics to group topic routes', () => {
    expect(
      getRecentChatRoutePath({
        agent: null,
        group: { id: 'group-1', members: [], title: 'Team' },
        id: 'topic-2',
        title: 'Retrospective',
        type: 'group',
        updatedAt: new Date('2026-04-17T09:00:00.000Z'),
      }),
    ).toBe('/group/group-1?topic=topic-2');
  });

  it('should apply fallback title and chat route for legacy topics', () => {
    expect(
      mapRecentTopicToRecentChatItem(
        {
          agent: null,
          group: null,
          id: 'topic-3',
          title: null,
          type: 'agent',
          updatedAt: new Date('2026-04-17T09:00:00.000Z'),
        },
        'Untitled Topic',
      ),
    ).toEqual({
      agent: null,
      group: null,
      id: 'topic-3',
      routePath: '/chat?topic=topic-3',
      title: 'Untitled Topic',
      type: 'agent',
      updatedAt: new Date('2026-04-17T09:00:00.000Z'),
    });
  });
});
