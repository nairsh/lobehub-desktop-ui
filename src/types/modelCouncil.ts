export interface ModelCouncilModelConfig {
  label?: string;
  model: string;
  provider: string;
  reasoning?: boolean;
}

export interface ModelCouncilSettings {
  councilModels: ModelCouncilModelConfig[];
  enabled?: boolean;
  judgeModel?: ModelCouncilModelConfig;
  judgeTimeoutMs?: number;
  maxModels?: number;
  perModelTimeoutMs?: number;
  showIntermediates?: 'collapsed' | 'expanded';
}

export interface ModelCouncilStartPayload {
  agentId?: string;
  editorData?: Record<string, unknown>;
  files?: string[];
  groupId?: string | null;
  newTopic?: {
    title?: string;
    topicMessageIds?: string[];
  };
  overrideCouncil?: ModelCouncilSettings;
  pageSelections?: unknown[];
  parentId?: string;
  prompt: string;
  sessionId?: string | null;
  threadId?: string | null;
  topicId?: string | null;
}
