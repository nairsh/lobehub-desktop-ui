import type { ProjectItem } from '@/types/project';

export interface ProjectStoreState {
  activeProjectId: string | null;
  isProjectListLoading: boolean;
  /** agentId -> projectId selected for the next new topic (no activeTopicId yet) */
  pendingProjectIdByAgentId: Record<string, string>;
  pinnedProjectIds: string[];
  projectList: ProjectItem[];
  /** projectId -> list of topicIds created from that project workspace */
  topicIdsByProject: Record<string, string[]>;
}

const PINNED_PROJECTS_KEY = 'LOBE_PINNED_PROJECT_IDS';

const loadPinnedIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(PINNED_PROJECTS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const savePinnedIds = (ids: string[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PINNED_PROJECTS_KEY, JSON.stringify(ids));
};

export const initialProjectState: ProjectStoreState = {
  activeProjectId: null,
  isProjectListLoading: false,
  pendingProjectIdByAgentId: {},
  pinnedProjectIds: loadPinnedIds(),
  projectList: [],
  topicIdsByProject: {},
};
