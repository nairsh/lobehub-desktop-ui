/**
 * Module-level singletons tracking the active project context.
 * Set by ProjectWorkspace while mounted; read by the agent pipeline to inject
 * project instructions and knowledge base into every chat sent from that workspace.
 */

let activeProjectSystemPrompt: string | undefined;

export const setActiveProjectSystemPrompt = (prompt: string | undefined) => {
  activeProjectSystemPrompt = prompt;
};

export const getActiveProjectSystemPrompt = () => activeProjectSystemPrompt;

let activeProjectKnowledgeBaseId: string | undefined;

export const setActiveProjectKnowledgeBaseId = (id: string | undefined) => {
  activeProjectKnowledgeBaseId = id;
};

export const getActiveProjectKnowledgeBaseId = () => activeProjectKnowledgeBaseId;
