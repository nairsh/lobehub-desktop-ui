import isEqual from 'fast-deep-equal';
import { type SWRResponse } from 'swr';

import { mutate, useClientDataSWRWithSync } from '@/libs/swr';
import { topicService } from '@/services/topic';
import { type HomeStore } from '@/store/home/store';
import { type StoreSetter } from '@/store/types';
import { setNamespace } from '@/utils/storeDebug';

import { mapRecentTopicToRecentChatItem, type RecentChatItem } from './utils';

const n = setNamespace('recent');

const FETCH_RECENTS_KEY = 'fetchRecents';

type Setter = StoreSetter<HomeStore>;
export const createRecentSlice = (set: Setter, get: () => HomeStore, _api?: unknown) =>
  new RecentActionImpl(set, get, _api);

export class RecentActionImpl {
  readonly #get: () => HomeStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => HomeStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  updateRecentTitle = (id: string, title: string): void => {
    const recents = this.#get().recents.map((item) => (item.id === id ? { ...item, title } : item));
    this.#set({ recents }, false, n('updateRecentTitle'));
  };

  refreshRecents = async (): Promise<void> => {
    await mutate((key: unknown) => Array.isArray(key) && key[0] === FETCH_RECENTS_KEY);
  };

  useFetchRecents = (
    isLogin: boolean | undefined,
    limit: number = 10,
    fallbackTitle: string,
  ): SWRResponse<RecentChatItem[]> => {
    return useClientDataSWRWithSync<RecentChatItem[]>(
      isLogin === true ? [FETCH_RECENTS_KEY, isLogin, limit, fallbackTitle] : null,
      async () => {
        const topics = await topicService.getRecentTopics(limit + 1);

        return topics.map((topic) => mapRecentTopicToRecentChatItem(topic, fallbackTitle));
      },
      {
        onData: (data) => {
          if (this.#get().isRecentsInit && isEqual(this.#get().recents, data)) return;

          this.#set({ isRecentsInit: true, recents: data }, false, n('useFetchRecents/onData'));
        },
      },
    );
  };
}

export type RecentAction = Pick<RecentActionImpl, keyof RecentActionImpl>;
