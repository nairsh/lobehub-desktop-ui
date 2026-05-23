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

export const initialProjectState: ProjectStoreState = {
  activeProjectId: null,
  isProjectListLoading: false,
  pendingProjectIdByAgentId: {},
  pinnedProjectIds: [],
  projectList: [],
  topicIdsByProject: {},
};
