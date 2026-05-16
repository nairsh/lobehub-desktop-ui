import type { ProjectItem } from '@/types/project';

export interface ProjectStoreState {
  activeProjectId: string | null;
  isProjectListLoading: boolean;
  pinnedProjectIds: string[];
  projectList: ProjectItem[];
  /** projectId -> list of topicIds created from that project workspace */
  topicIdsByProject: Record<string, string[]>;
}

export const initialProjectState: ProjectStoreState = {
  activeProjectId: null,
  isProjectListLoading: false,
  pinnedProjectIds: [],
  projectList: [],
  topicIdsByProject: {},
};
