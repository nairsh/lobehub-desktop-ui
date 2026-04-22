import type { BuiltinServerRuntimeOutput } from '@lobechat/types';

import type {
  ActivatedToolInfo,
  ActivateSkillParams,
  ActivateToolsParams,
  SearchToolMatch,
  SearchToolsParams,
} from '../types';

export interface ToolManifestInfo {
  apiDescriptions: Array<{ description: string; name: string }>;
  avatar?: string;
  identifier: string;
  name: string;
  systemRole?: string;
}

export interface ActivatorRuntimeService {
  activateSkill?: (args: ActivateSkillParams) => Promise<BuiltinServerRuntimeOutput>;
  getActivatedToolIds: () => string[];
  getToolManifests: (identifiers: string[]) => Promise<ToolManifestInfo[]>;
  markActivated: (identifiers: string[]) => void;
  searchTools?: (
    args: SearchToolsParams,
  ) => Promise<{ items: SearchToolMatch[]; limit: number; query: string; total: number }>;
}

export interface ActivatorExecutionRuntimeOptions {
  service: ActivatorRuntimeService;
}

export class ActivatorExecutionRuntime {
  private service: ActivatorRuntimeService;

  constructor(options: ActivatorExecutionRuntimeOptions) {
    this.service = options.service;
  }

  async activateSkill(args: ActivateSkillParams): Promise<BuiltinServerRuntimeOutput> {
    if (!this.service.activateSkill) {
      return {
        content: 'Skill activation is not available.',
        success: false,
      };
    }

    return this.service.activateSkill(args);
  }

  async searchTools(args: SearchToolsParams): Promise<BuiltinServerRuntimeOutput> {
    if (!this.service.searchTools) {
      return {
        content: 'Tool search is not available in this environment.',
        success: false,
      };
    }

    const query = args.query.trim();
    const limit = Math.min(Math.max(args.limit ?? 5, 1), 10);

    if (!query) {
      return {
        content: 'Please provide a search query describing the capability you need.',
        success: false,
      };
    }

    try {
      const result = await this.service.searchTools({ ...args, limit, query });

      if (result.items.length === 0) {
        return {
          content: `No tools found matching "${query}". Try broader capability words or review the <available_tools> list.`,
          state: result,
          success: true,
        };
      }

      const toolsList = result.items
        .map((tool, index) => {
          const apis =
            tool.apiDescriptions.length > 0
              ? tool.apiDescriptions
                  .slice(0, 3)
                  .map((api) => `${api.name}: ${api.description || 'No description'}`)
                  .join('; ')
              : 'No APIs listed';

          return `${index + 1}. **${tool.name}** (\`${tool.identifier}\`) — ${tool.source}\n   ${tool.description || 'No description available.'}\n   Matched on: ${tool.matchedFields.join(', ')}\n   APIs: ${apis}`;
        })
        .join('\n\n');

      return {
        content: `Found ${result.total} matching tools for "${query}". Top ${result.items.length} results:\n\n${toolsList}\n\nIf you want to use one of them, call activateTools with its identifier.`,
        state: result,
        success: true,
      };
    } catch (e) {
      return {
        content: `Failed to search tools: ${(e as Error).message}`,
        success: false,
      };
    }
  }

  async activateTools(args: ActivateToolsParams): Promise<BuiltinServerRuntimeOutput> {
    const { identifiers } = args;

    if (!identifiers || identifiers.length === 0) {
      return {
        content: 'No tool identifiers provided. Please specify which tools to activate.',
        success: false,
      };
    }

    try {
      const alreadyActive = this.service.getActivatedToolIds();
      const toActivate: string[] = [];
      const alreadyActiveList: string[] = [];

      for (const id of identifiers) {
        if (alreadyActive.includes(id)) {
          alreadyActiveList.push(id);
        } else {
          toActivate.push(id);
        }
      }

      // Fetch manifests for tools to activate
      const manifests = await this.service.getToolManifests(toActivate);

      const foundIdentifiers = new Set(manifests.map((m) => m.identifier));
      const notFound = toActivate.filter((id) => !foundIdentifiers.has(id));

      const activatedTools: ActivatedToolInfo[] = manifests.map((m) => ({
        apiCount: m.apiDescriptions.length,
        avatar: m.avatar,
        identifier: m.identifier,
        name: m.name,
      }));

      // Mark newly activated tools
      if (manifests.length > 0) {
        this.service.markActivated(manifests.map((m) => m.identifier));
      }

      // Build response content
      const parts: string[] = [];

      if (activatedTools.length > 0) {
        parts.push('Successfully activated tools:');
        for (const manifest of manifests) {
          parts.push(`\n## ${manifest.name} (${manifest.identifier})`);
          if (manifest.systemRole) {
            parts.push(manifest.systemRole);
          }
          if (manifest.apiDescriptions.length > 0) {
            parts.push('\nAvailable APIs:');
            for (const api of manifest.apiDescriptions) {
              parts.push(`- **${api.name}**: ${api.description}`);
            }
          }
        }
      }

      if (alreadyActiveList.length > 0) {
        parts.push(`\nAlready active: ${alreadyActiveList.join(', ')}`);
      }

      if (notFound.length > 0) {
        parts.push(`\nNot found: ${notFound.join(', ')}`);
      }

      return {
        content: parts.join('\n'),
        state: {
          activatedTools,
          alreadyActive: alreadyActiveList,
          notFound,
        },
        success: true,
      };
    } catch (e) {
      return {
        content: `Failed to activate tools: ${(e as Error).message}`,
        success: false,
      };
    }
  }
}
