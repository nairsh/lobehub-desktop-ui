import type { ProjectStore } from './store';

export const projectSelectors = {
  activeProject: (s: ProjectStore) => s.projectList.find((p) => p.id === s.activeProjectId) ?? null,

  activeProjectId: (s: ProjectStore) => s.activeProjectId,

  isLoading: (s: ProjectStore) => s.isProjectListLoading,

  projectById: (id: string) => (s: ProjectStore) => s.projectList.find((p) => p.id === id) ?? null,

  projectList: (s: ProjectStore) => s.projectList,
};
