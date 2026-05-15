import { projectService } from '@/services/project';
import type { ProjectStore } from '@/store/project/store';
import type { StoreSetter } from '@/store/types';
import type { ProjectCreate, ProjectItem, ProjectUpdate } from '@/types/project';

export interface ProjectCrudAction {
  createProject: (params: ProjectCreate) => Promise<ProjectItem | undefined>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  updateProject: (id: string, value: ProjectUpdate) => Promise<void>;
}

export const createProjectCrudSlice = (set: StoreSetter<ProjectStore>, get: () => ProjectStore) =>
  new ProjectCrudActionImpl(set, get);

export class ProjectCrudActionImpl implements ProjectCrudAction {
  readonly #set: StoreSetter<ProjectStore>;
  readonly #get: () => ProjectStore;

  constructor(set: StoreSetter<ProjectStore>, get: () => ProjectStore) {
    this.#set = set;
    this.#get = get;
  }

  createProject = async (params: ProjectCreate): Promise<ProjectItem | undefined> => {
    const result = await projectService.create(params);
    await this.#get().refreshProjects();
    return result as ProjectItem | undefined;
  };

  deleteProject = async (id: string): Promise<void> => {
    await projectService.delete(id);
    const { activeProjectId } = this.#get();
    if (activeProjectId === id) {
      this.#set({ activeProjectId: null });
    }
    await this.#get().refreshProjects();
  };

  refreshProjects = async (): Promise<void> => {
    this.#set({ isProjectListLoading: true });
    try {
      const list = await projectService.list();
      this.#set({ isProjectListLoading: false, projectList: list as ProjectItem[] });
    } catch {
      this.#set({ isProjectListLoading: false });
    }
  };

  updateProject = async (id: string, value: ProjectUpdate): Promise<void> => {
    await projectService.update(id, value);
    await this.#get().refreshProjects();
  };
}
