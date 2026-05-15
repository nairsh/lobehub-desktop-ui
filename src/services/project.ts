import { lambdaClient } from '@/libs/trpc/client';
import type { ProjectCreate, ProjectUpdate } from '@/types/project';

class ProjectService {
  create = async (params: ProjectCreate) => lambdaClient.project.create.mutate(params);

  delete = async (id: string) => lambdaClient.project.delete.mutate({ id });

  getById = async (id: string) => lambdaClient.project.getById.query({ id });

  list = async () => lambdaClient.project.list.query();

  update = async (id: string, value: ProjectUpdate) =>
    lambdaClient.project.update.mutate({ id, value });
}

export const projectService = new ProjectService();
