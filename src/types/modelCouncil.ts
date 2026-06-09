export interface ModelCouncilModelConfig {
  label?: string;
  model: string;
  personalityId?: string;
  provider: string;
  reasoning?: boolean;
  reasoningLevel?: string;
  reasoningParam?: string;
  systemPrompt?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
}

export interface ModelCouncilSettings {
  councilModels: ModelCouncilModelConfig[];
  enabled?: boolean;
  judgeModel?: ModelCouncilModelConfig;
  judgeTimeoutMs?: number;
  maxModels?: number;
  perModelTimeoutMs?: number;
  showIntermediates?: 'collapsed' | 'expanded';
  /** Which council roles may use web search. Search adds significant latency per member. */
  webSearch?: 'all' | 'judge' | 'off';
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
