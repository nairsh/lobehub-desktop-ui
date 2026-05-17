/**
 * Module-level singleton that tracks the active project's system prompt.
 * Set by ProjectWorkspace while mounted; read by agentConfigResolver to append
 * project instructions to the resolved system role.
 */

let activeProjectSystemPrompt: string | undefined;

export const setActiveProjectSystemPrompt = (prompt: string | undefined) => {
  activeProjectSystemPrompt = prompt;
};

export const getActiveProjectSystemPrompt = () => activeProjectSystemPrompt;
