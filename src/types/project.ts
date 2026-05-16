export interface ProjectSettings {
  contextWindowSize?: number;
  defaultModel?: string;
  defaultSystemPrompt?: string;
}

export interface ProjectItem {
  accessedAt: string;
  avatar?: string;
  createdAt: string;
  description?: string;
  defaultKnowledgeBaseId?: string;
  id: string;
  name: string;
  settings?: ProjectSettings;
  status: 'active' | 'archived';
  updatedAt: string;
  userId: string;
}

export type ProjectCreate = Pick<ProjectItem, 'name'> &
  Partial<Pick<ProjectItem, 'avatar' | 'description' | 'settings'>>;

export type ProjectUpdate = Partial<
  Pick<ProjectItem, 'avatar' | 'description' | 'name' | 'settings' | 'status'>
>;
