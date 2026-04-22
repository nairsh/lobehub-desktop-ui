import type { BuiltinToolManifest } from '@lobechat/types';

import { systemPrompt } from './systemRole';
import { ActivatorApiName, LobeActivatorIdentifier } from './types';

export const LobeActivatorManifest: BuiltinToolManifest = {
  api: [
    {
      description:
        'Search the discoverable tool catalog by capability, keywords, or task intent. Returns a concise ranked shortlist with tool identifiers, descriptions, source, and available APIs. Use this when you are not sure which tool to activate from the <available_tools> list.',
      name: ActivatorApiName.searchTools,
      parameters: {
        properties: {
          limit: {
            description: 'Maximum number of matching tools to return. Default: 5. Maximum: 10.',
            type: 'number',
          },
          query: {
            description:
              'A short natural-language description of the capability you need, such as "search PDFs", "edit local files", or "send message to another agent".',
            type: 'string',
          },
        },
        required: ['query'],
        type: 'object',
      },
    },
    {
      description:
        'Activate tools from the <available_tools> list so their full API schemas become available for use. Call this before using any tool that is not yet activated. You can activate multiple tools at once.',
      humanIntervention: 'required',
      name: ActivatorApiName.activateTools,
      parameters: {
        properties: {
          identifiers: {
            description:
              'Array of tool identifiers to activate. Use the identifiers from the <available_tools> list.',
            items: {
              type: 'string',
            },
            type: 'array',
          },
        },
        required: ['identifiers'],
        type: 'object',
      },
    },
    {
      description:
        'Activate a skill by name to load its instructions. Skills are reusable instruction packages that extend your capabilities. Returns the skill content that you should follow to complete the task. If the skill is not found, returns a list of available skills.',
      humanIntervention: 'required',
      name: ActivatorApiName.activateSkill,
      parameters: {
        properties: {
          name: {
            description: 'The exact name of the skill to activate.',
            type: 'string',
          },
        },
        required: ['name'],
        type: 'object',
      },
    },
  ],
  identifier: LobeActivatorIdentifier,
  meta: {
    avatar: '🔧',
    description: 'Discover and activate tools and skills',
    title: 'Tools & Skills Activator',
  },
  systemRole: systemPrompt,
  type: 'builtin',
};
