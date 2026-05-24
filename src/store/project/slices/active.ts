import { savePinnedIds } from '@/store/project/initialState';
import type { ProjectStore } from '@/store/project/store';
import type { StoreSetter } from '@/store/types';

export interface ProjectActiveAction {
  addTopicToProject: (projectId: string, topicId: string) => void;
  clearActiveProject: () => void;
  removeTopicFromProject: (projectId: string, topicId: string) => void;
  setActiveProject: (id: string | null) => void;
  setPendingProjectForAgent: (agentId: string, projectId: string | null) => void;
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

  removeTopicFromProject = (projectId: string, topicId: string): void => {
    const { topicIdsByProject } = this.#get();
    const existing = topicIdsByProject[projectId] ?? [];
    this.#set({
      topicIdsByProject: {
        ...topicIdsByProject,
        [projectId]: existing.filter((id) => id !== topicId),
      },
    });
  };

  setActiveProject = (id: string | null): void => {
    this.#set({ activeProjectId: id });
  };

  setPendingProjectForAgent = (agentId: string, projectId: string | null): void => {
    const { pendingProjectIdByAgentId } = this.#get();
    if (projectId === null) {
      const next = { ...pendingProjectIdByAgentId };
      delete next[agentId];
      this.#set({ pendingProjectIdByAgentId: next });
    } else {
      this.#set({
        pendingProjectIdByAgentId: { ...pendingProjectIdByAgentId, [agentId]: projectId },
      });
    }
  };

  togglePinProject = (id: string): void => {
    const { pinnedProjectIds } = this.#get();
    const alreadyPinned = pinnedProjectIds.includes(id);
    const next = alreadyPinned
      ? pinnedProjectIds.filter((p) => p !== id)
      : [...pinnedProjectIds, id];
    this.#set({ pinnedProjectIds: next });
    savePinnedIds(next);
  };
}
