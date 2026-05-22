import { lambdaClient } from '@/libs/trpc/client';
import type { ProjectCreate, ProjectUpdate } from '@/types/project';

class ProjectService {
  private client = (lambdaClient as any).project;

  create = async (params: ProjectCreate) => this.client.create.mutate(params);

  delete = async (id: string) => this.client.delete.mutate({ id });

  getById = async (id: string) => this.client.getById.query({ id });

  list = async () => this.client.list.query();

  update = async (id: string, value: ProjectUpdate) => this.client.update.mutate({ id, value });
}

export const projectService = new ProjectService();
