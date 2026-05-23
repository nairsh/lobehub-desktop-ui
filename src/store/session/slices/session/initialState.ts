import { type LobeSessions } from '@/types/session';

export interface SessionState {
  activeAgentId?: string;
  /**
   * @title Current active session
   * @description The session currently being edited or viewed
   */
  activeId: string;
  /**
   * @title Current active normal-chat session
   * @description Explicit session identity for agent-free / normal chat flows.
   */
  activeSessionId: string;
  /**
   * whether all agents drawer is open
   */
  allAgentsDrawerOpen: boolean;
  defaultSessions: LobeSessions;
  /**
   * @title Whether the agent panel is pinned
   * @description Controls the agent panel pinning state in the UI layout
   */
  isAgentPinned: boolean;
  isSearching: boolean;
  isSessionsFirstFetchFinished: boolean;
  pinnedSessions: LobeSessions;
  searchKeywords: string;
  /**
   * @title Session ID being renamed
   * @description Used to control the display state of the session rename modal
   */
  sessionRenamingId: string | null;
  /**
   * it means defaultSessions
   */
  sessions: LobeSessions;
  sessionSearchKeywords?: string;
  /**
   * @title Session ID being updated
   * @description Used to display loading state when session is being updated
   */
  sessionUpdatingId: string | null;
}

export const initialSessionState: SessionState = {
  activeSessionId: 'inbox',
  activeId: 'inbox',
  allAgentsDrawerOpen: false,
  defaultSessions: [],
  isAgentPinned: false,
  isSearching: false,
  isSessionsFirstFetchFinished: false,
  pinnedSessions: [],
  searchKeywords: '',
  sessionRenamingId: null,
  sessionUpdatingId: null,
  sessions: [],
};
