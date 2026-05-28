export type AgentMode =
  | 'agent-builder'
  | 'bot-builder'
  | 'cloud-sandbox'
  | 'group-builder'
  | 'self-iteration';

export interface ModeConfig {
  contextBlock: string;
  extraToolIdentifiers: string[];
}

export const MODE_CONFIGS: Record<AgentMode, ModeConfig> = {
  'agent-builder': {
    contextBlock:
      '<mode>Agent Builder - help the user create or edit an agent. Use agent management tools to read the current agent config, make requested changes, and confirm updates.</mode>',
    extraToolIdentifiers: ['lobe-agent-builder', 'lobe-agent-management'],
  },
  'bot-builder': {
    contextBlock:
      "<mode>Bot Builder - help the user configure a chat bot's behavior, responses, and platform connections. Use message and bot management tools when needed.</mode>",
    extraToolIdentifiers: ['lobe-message'],
  },
  'cloud-sandbox': {
    contextBlock: `<environment>
Cloud sandbox (isolated, session-scoped). Shell: /bin/sh.
Pre-installed: Python 3, Node 20, Bun, curl, jq, FFmpeg, LibreOffice, Pandoc, GitHub CLI, Playwright/Chromium, Marp.
Python libs: numpy, pandas, scipy, scikit-learn, matplotlib, plotly, FastAPI, requests.
Credentials: source ~/.creds/env or use files at ~/.creds/files/{key}/
</environment>`,
    extraToolIdentifiers: ['lobe-cloud-sandbox'],
  },
  'group-builder': {
    contextBlock:
      "<mode>Group Builder - help the user create or edit a multi-agent group. Use group management tools to configure the group's agents, supervisor, and shared system prompt.</mode>",
    extraToolIdentifiers: ['lobe-group-agent-builder', 'lobe-group-management'],
  },
  'self-iteration': {
    contextBlock:
      '<mode>Self-Iteration - read and update your own agent configuration when useful. Use self-iteration tools to refine your system role, capabilities, and tool set based on feedback.</mode>',
    extraToolIdentifiers: ['lobe-self-iteration'],
  },
};

export const getModeConfig = (mode?: string | null) =>
  mode ? MODE_CONFIGS[mode as AgentMode] : undefined;

export const appendModeContext = (systemRole: string | undefined, modeConfig?: ModeConfig) => {
  if (!modeConfig?.contextBlock) return systemRole || '';

  return systemRole ? `${systemRole}\n\n${modeConfig.contextBlock}` : modeConfig.contextBlock;
};

export const mergeModeTools = (plugins: string[] | undefined, modeConfig?: ModeConfig) => {
  if (!modeConfig?.extraToolIdentifiers.length) return plugins ?? [];

  return Array.from(new Set([...(plugins ?? []), ...modeConfig.extraToolIdentifiers]));
};
