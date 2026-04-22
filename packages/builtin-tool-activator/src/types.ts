export const LobeActivatorIdentifier = 'lobe-activator';

export const ActivatorApiName = {
  activateSkill: 'activateSkill',
  searchTools: 'searchTools',
  activateTools: 'activateTools',
};

export interface ActivateToolsParams {
  identifiers: string[];
}

export interface ActivatedToolInfo {
  apiCount: number;
  avatar?: string;
  identifier: string;
  name: string;
}

export interface ActivateToolsState {
  activatedTools: ActivatedToolInfo[];
  alreadyActive: string[];
  notFound: string[];
}

export interface ActivateSkillParams {
  name: string;
}

export interface ActivateSkillState {
  description?: string;
  hasResources: boolean;
  id: string;
  name: string;
}

export interface SearchToolsParams {
  limit?: number;
  query: string;
}

export type SearchToolMatchField = 'api' | 'description' | 'identifier' | 'name' | 'source';

export interface SearchToolMatch {
  apiDescriptions: Array<{ description: string; name: string }>;
  description: string;
  identifier: string;
  matchedFields: SearchToolMatchField[];
  name: string;
  source: string;
}

export interface SearchToolsState {
  items: SearchToolMatch[];
  limit: number;
  query: string;
  total: number;
}
