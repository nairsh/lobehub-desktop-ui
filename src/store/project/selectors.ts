import type { ProjectStore } from './store';

export const projectSelectors = {
  activeProject: (s: ProjectStore) => s.projectList.find((p) => p.id === s.activeProjectId) ?? null,

  activeProjectId: (s: ProjectStore) => s.activeProjectId,

  isLoading: (s: ProjectStore) => s.isProjectListLoading,

  isPinned: (id: string) => (s: ProjectStore) => s.pinnedProjectIds.includes(id),

  pinnedProjectIds: (s: ProjectStore) => s.pinnedProjectIds,

  projectById: (id: string) => (s: ProjectStore) => s.projectList.find((p) => p.id === id) ?? null,

  projectTopicIds: (projectId: string) => (s: ProjectStore) => s.topicIdsByProject[projectId] ?? [],

  projectList: (s: ProjectStore) => s.projectList,

  sortedProjectList: (s: ProjectStore) => {
    const pinned = s.pinnedProjectIds;
    return [...s.projectList].sort((a, b) => {
      const aPinned = pinned.includes(a.id) ? 0 : 1;
      const bPinned = pinned.includes(b.id) ? 0 : 1;
      return aPinned - bPinned;
    });
  },
};
