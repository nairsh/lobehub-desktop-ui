import type { ProjectStore } from '@/store/project/store';
import type { StoreSetter } from '@/store/types';

export interface ProjectActiveAction {
  addTopicToProject: (projectId: string, topicId: string) => void;
  clearActiveProject: () => void;
  setActiveProject: (id: string | null) => void;
  togglePinProject: (id: string) => void;
}

export const createProjectActiveSlice = (set: StoreSetter<ProjectStore>, get: () => ProjectStore) =>
  new ProjectActiveActionImpl(set, get);

export class ProjectActiveActionImpl implements ProjectActiveAction {
  readonly #set: StoreSetter<ProjectStore>;
  readonly #get: () => ProjectStore;

  constructor(set: StoreSetter<ProjectStore>, get: () => ProjectStore) {
    this.#set = set;
    this.#get = get;
  }

  addTopicToProject = (projectId: string, topicId: string): void => {
    const { topicIdsByProject } = this.#get();
    const existing = topicIdsByProject[projectId] ?? [];
    if (existing.includes(topicId)) return;
    this.#set({
      topicIdsByProject: { ...topicIdsByProject, [projectId]: [topicId, ...existing] },
    });
  };

  clearActiveProject = (): void => {
    this.#set({ activeProjectId: null });
  };

  setActiveProject = (id: string | null): void => {
    this.#set({ activeProjectId: id });
  };

  togglePinProject = (id: string): void => {
    const { pinnedProjectIds } = this.#get();
    const alreadyPinned = pinnedProjectIds.includes(id);
    this.#set({
      pinnedProjectIds: alreadyPinned
        ? pinnedProjectIds.filter((p) => p !== id)
        : [...pinnedProjectIds, id],
    });
  };
}
