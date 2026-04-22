import { getKlavisServerByServerIdentifier, getLobehubSkillProviderById } from '@lobechat/const';
import { type RenderDisplayControl, type ToolManifest } from '@lobechat/types';

import {
  isInstalledPluginAvailableInCurrentEnv,
  isToolAvailableInCurrentEnv,
} from '@/helpers/toolAvailability';
import { type MetaData } from '@/types/meta';
import { type LobeToolMeta } from '@/types/tool/tool';

import { type ToolStoreState } from '../initialState';
import { builtinToolSelectors } from '../slices/builtin/selectors';
import { KlavisServerStatus } from '../slices/klavisStore';
import { lobehubSkillStoreSelectors } from '../slices/lobehubSkillStore';
import { LobehubSkillStatus } from '../slices/lobehubSkillStore/types';
import { pluginSelectors } from '../slices/plugin/selectors';

const metaList = (s: ToolStoreState): LobeToolMeta[] => {
  const pluginList = pluginSelectors.installedPluginMetaList(s) as LobeToolMeta[];
  const lobehubSkillList = lobehubSkillStoreSelectors.metaList(s) as LobeToolMeta[];

  return builtinToolSelectors.metaList(s).concat(pluginList).concat(lobehubSkillList);
};

const getMetaById =
  (id: string) =>
  (s: ToolStoreState): MetaData | undefined => {
    const item = metaList(s).find((m) => m.identifier === id);

    if (!item) return;

    if (item.meta) return item.meta;

    return {
      avatar: item?.avatar,
      backgroundColor: item?.backgroundColor,
      description: item?.description,
      title: item?.title,
    };
  };

const getManifestById =
  (id: string) =>
  (s: ToolStoreState): ToolManifest | undefined =>
    pluginSelectors
      .installedPluginManifestList(s)
      .concat(s.builtinTools.map((b) => b.manifest as ToolManifest))
      .find((i) => i.identifier === id);

// Get plugin manifest loading status
const getManifestLoadingStatus = (id: string) => (s: ToolStoreState) => {
  const manifest = getManifestById(id)(s);

  if (s.pluginInstallLoading[id]) return 'loading';

  if (!manifest) return 'error';

  if (!!manifest) return 'success';
};

const isToolHasUI = (id: string) => (s: ToolStoreState) => {
  const manifest = getManifestById(id)(s);
  if (!manifest) return false;
  const builtinTool = s.builtinTools.find((tool) => tool.identifier === id);

  if (builtinTool && builtinTool.type === 'builtin') {
    return true;
  }

  return !!manifest.ui;
};

/**
 * Get the renderDisplayControl configuration for a specific tool API
 * Only works for builtin tools, plugins don't support this feature yet
 * @param identifier - Tool identifier
 * @param apiName - API name
 * @returns RenderDisplayControl value, defaults to 'collapsed'
 */
const getRenderDisplayControl =
  (identifier: string, apiName: string) =>
  (s: ToolStoreState): RenderDisplayControl => {
    // Only builtin tools support renderDisplayControl
    const builtinTool = s.builtinTools.find((t) => t.identifier === identifier);
    if (!builtinTool) return 'collapsed';

    const api = builtinTool.manifest.api.find((a) => a.name === apiName);
    return api?.renderDisplayControl ?? 'collapsed';
  };

export interface AvailableToolForDiscovery {
  apiDescriptions?: Array<{ description: string; name: string }>;
  description: string;
  identifier: string;
  name: string;
  source: string;
}

export type ToolDiscoveryMatchField = 'api' | 'description' | 'identifier' | 'name' | 'source';

export interface AvailableToolSearchResult extends AvailableToolForDiscovery {
  matchedFields: ToolDiscoveryMatchField[];
  score: number;
}

const toApiDescriptions = (apis?: Array<{ description?: string; name: string }>) =>
  (apis || []).map((api) => ({
    description: api.description || '',
    name: api.name,
  }));

const normalizeSearchValue = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKC')
    .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const tokenizeSearchValue = (value: string) =>
  Array.from(new Set(normalizeSearchValue(value).split(/\s+/).filter(Boolean)));

const scoreAvailableTool = (
  tool: AvailableToolForDiscovery,
  normalizedQuery: string,
  tokens: string[],
): AvailableToolSearchResult | null => {
  if (!normalizedQuery) return null;

  const identifier = normalizeSearchValue(tool.identifier);
  const name = normalizeSearchValue(tool.name);
  const description = normalizeSearchValue(tool.description);
  const source = normalizeSearchValue(tool.source);
  const apiNames = normalizeSearchValue(
    (tool.apiDescriptions || []).map((api) => api.name).join(' '),
  );
  const apiDescriptions = normalizeSearchValue(
    (tool.apiDescriptions || []).map((api) => api.description).join(' '),
  );

  const matchedFields = new Set<ToolDiscoveryMatchField>();
  let matchedTokenCount = 0;
  let score = 0;

  if (identifier === normalizedQuery) {
    matchedFields.add('identifier');
    score += 140;
  }

  if (name === normalizedQuery) {
    matchedFields.add('name');
    score += 130;
  }

  if (identifier.startsWith(normalizedQuery)) {
    matchedFields.add('identifier');
    score += 80;
  } else if (identifier.includes(normalizedQuery)) {
    matchedFields.add('identifier');
    score += 50;
  }

  if (name.startsWith(normalizedQuery)) {
    matchedFields.add('name');
    score += 75;
  } else if (name.includes(normalizedQuery)) {
    matchedFields.add('name');
    score += 45;
  }

  if (description.includes(normalizedQuery)) {
    matchedFields.add('description');
    score += 30;
  }

  if (apiNames.includes(normalizedQuery) || apiDescriptions.includes(normalizedQuery)) {
    matchedFields.add('api');
    score += 35;
  }

  if (source.includes(normalizedQuery)) {
    matchedFields.add('source');
    score += 15;
  }

  for (const token of tokens) {
    let tokenMatched = false;

    if (identifier.includes(token)) {
      matchedFields.add('identifier');
      score += 24;
      tokenMatched = true;
    }

    if (name.includes(token)) {
      matchedFields.add('name');
      score += 22;
      tokenMatched = true;
    }

    if (description.includes(token)) {
      matchedFields.add('description');
      score += 10;
      tokenMatched = true;
    }

    if (apiNames.includes(token) || apiDescriptions.includes(token)) {
      matchedFields.add('api');
      score += 12;
      tokenMatched = true;
    }

    if (source.includes(token)) {
      matchedFields.add('source');
      score += 6;
      tokenMatched = true;
    }

    if (tokenMatched) matchedTokenCount += 1;
  }

  if (matchedFields.size === 0 || matchedTokenCount === 0) return null;

  if (tokens.length > 1 && matchedTokenCount === tokens.length) score += 25;

  return {
    ...tool,
    matchedFields: Array.from(matchedFields),
    score,
  };
};

export const searchAvailableToolsForDiscovery = (
  tools: AvailableToolForDiscovery[],
  query: string,
  limit = 5,
) => {
  const normalizedQuery = normalizeSearchValue(query);
  const tokens = tokenizeSearchValue(query);
  const clampedLimit = Math.min(Math.max(limit, 1), 10);

  if (!normalizedQuery || tokens.length === 0) {
    return { items: [] as AvailableToolSearchResult[], total: 0 };
  }

  const results = tools
    .map((tool) => scoreAvailableTool(tool, normalizedQuery, tokens))
    .filter((tool): tool is AvailableToolSearchResult => tool !== null)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.name.localeCompare(right.name);
    });

  return {
    items: results.slice(0, clampedLimit),
    total: results.length,
  };
};

/**
 * Get all tools available for tool discovery (activateTools).
 * Built from raw state to avoid inheriting unrelated filtering logic.
 *
 * Sources:
 * 1. Builtin tools (from s.builtinTools) — exclude non-discoverable, skills, platform-unavailable
 * 2. User-installed plugins (from s.installedPlugins) — exclude Klavis/LobeHub Skill/agent skill overlap
 * 3. Klavis MCP servers (connected) — description from KLAVIS_SERVER_TYPES
 * 4. LobeHub Skill servers (connected) — description from LOBEHUB_SKILL_PROVIDERS
 */
const availableToolsForDiscovery = (s: ToolStoreState): AvailableToolForDiscovery[] => {
  // Build exclusion sets for deduplication
  const builtinSkillIds = new Set((s.builtinSkills || []).map((skill) => skill.identifier));
  const agentSkillIds = new Set((s.agentSkills || []).map((skill) => skill.identifier));
  const klavisIds = new Set((s.servers || []).map((server) => server.identifier));
  const lobehubSkillIds = new Set((s.lobehubSkillServers || []).map((server) => server.identifier));

  // 1. Builtin tools — directly from s.builtinTools
  const builtinItems = s.builtinTools
    .filter((tool) => tool.discoverable !== false)
    .filter((tool) => !builtinSkillIds.has(tool.identifier))
    .filter((tool) => isToolAvailableInCurrentEnv(tool.identifier))
    .map((tool) => ({
      apiDescriptions: toApiDescriptions(tool.manifest.api),
      description: tool.manifest.meta?.description || '',
      identifier: tool.identifier,
      name: tool.manifest.meta?.title || tool.identifier,
      source: 'builtin',
    }));

  // 2. User-installed plugins — directly from s.installedPlugins
  //    Exclude Klavis, LobeHub Skill, and agent skill entries (they are handled in dedicated sources)
  const pluginItems = s.installedPlugins
    .filter((p) => !klavisIds.has(p.identifier))
    .filter((p) => !lobehubSkillIds.has(p.identifier))
    .filter((p) => !agentSkillIds.has(p.identifier))
    .filter((p) => !p.customParams?.klavis) // extra safety for Klavis plugins
    .filter((plugin) => isInstalledPluginAvailableInCurrentEnv(plugin))
    .map((plugin) => {
      const meta = plugin.manifest?.meta;
      return {
        apiDescriptions: toApiDescriptions(plugin.manifest?.api || []),
        description: meta?.description || '',
        identifier: plugin.identifier,
        name: meta?.title || plugin.identifier,
        source: plugin.type === 'customPlugin' ? 'custom plugin' : 'community plugin',
      };
    });

  // 3. Klavis MCP servers (connected only)
  const klavisItems = (s.servers || [])
    .filter((server) => server.status === KlavisServerStatus.CONNECTED && server.tools?.length)
    .map((server) => {
      const config = getKlavisServerByServerIdentifier(server.identifier);
      return {
        apiDescriptions: toApiDescriptions(server.tools),
        description: config?.description || '',
        identifier: server.identifier,
        name: config?.label || server.serverName,
        source: 'klavis mcp',
      };
    });

  // 4. LobeHub Skill servers (connected only)
  const lobehubSkillItems = (s.lobehubSkillServers || [])
    .filter((server) => server.status === LobehubSkillStatus.CONNECTED)
    .map((server) => {
      const config = getLobehubSkillProviderById(server.identifier);
      return {
        apiDescriptions: toApiDescriptions(server.tools || []),
        description: config?.description || '',
        identifier: server.identifier,
        name: config?.label || server.name,
        source: 'lobehub skill',
      };
    });

  return [...builtinItems, ...pluginItems, ...klavisItems, ...lobehubSkillItems];
};

export const toolSelectors = {
  availableToolsForDiscovery,
  getManifestById,
  getManifestLoadingStatus,
  getMetaById,
  getRenderDisplayControl,
  isToolHasUI,
  metaList,
  searchAvailableToolsForDiscovery,
};
