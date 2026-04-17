import { type RecentChatItem } from './utils';

export interface RecentState {
  isRecentsInit: boolean;
  recents: RecentChatItem[];
}

export const initialRecentState: RecentState = {
  isRecentsInit: false,
  recents: [],
};
