import type { ProjectItem } from '@/types/project';

export interface ProjectStoreState {
  activeProjectId: string | null;
  isProjectListLoading: boolean;
  projectList: ProjectItem[];
}

export const initialProjectState: ProjectStoreState = {
  activeProjectId: null,
  isProjectListLoading: false,
  projectList: [],
};
