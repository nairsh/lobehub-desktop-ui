import { useAgentStore } from '@/store/agent';
import { chatConfigByIdSelectors } from '@/store/agent/selectors';

/**
 * Returns the effective memory enabled state for an agent.
 * Memory is only exposed when the current agent explicitly opts in.
 */
export const useMemoryEnabled = (agentId: string): boolean => {
  return useAgentStore((s) => chatConfigByIdSelectors.isMemoryToolEnabledById(agentId)(s));
};
