import type { ProjectStore } from '@/store/project/store';
import type { StoreSetter } from '@/store/types';

export interface ProjectActiveAction {
  clearActiveProject: () => void;
  setActiveProject: (id: string | null) => void;
}

export const createProjectActiveSlice = (set: StoreSetter<ProjectStore>) =>
  new ProjectActiveActionImpl(set);

export class ProjectActiveActionImpl implements ProjectActiveAction {
  readonly #set: StoreSetter<ProjectStore>;

  constructor(set: StoreSetter<ProjectStore>) {
    this.#set = set;
  }

  clearActiveProject = (): void => {
    this.#set({ activeProjectId: null });
  };

  setActiveProject = (id: string | null): void => {
    this.#set({ activeProjectId: id });
  };
}
