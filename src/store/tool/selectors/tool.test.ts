import { type ToolManifest } from '@lobechat/types';
import { describe, expect, it } from 'vitest';

import { type ToolStoreState } from '../initialState';
import { initialState } from '../initialState';
import { searchAvailableToolsForDiscovery, toolSelectors } from './tool';

// Mock builtin skill for testing
const mockBuiltinSkill = {
  avatar: '🧪',
  content: '# Test Skill',
  description: 'A test skill',
  identifier: 'test-skill',
  name: 'Test Skill',
  source: 'builtin' as const,
};

const mockState = {
  ...initialState,
  builtinSkills: [mockBuiltinSkill],
  installedPlugins: [
    {
      identifier: 'plugin-1',
      manifest: {
        identifier: 'plugin-1',
        api: [{ name: 'api-1' }],
        author: 'Test Author',
        createdAt: '2024-01-01',
        homepage: 'https://example.com/plugin-1',
        meta: { title: 'Plugin 1', description: 'Plugin 1 description' },
      } as ToolManifest,
      runtimeType: 'standalone',
      type: 'plugin',
    },
    {
      identifier: 'plugin-2',
      manifest: {
        identifier: 'plugin-2',
        api: [{ name: 'api-2' }],
        author: 'Another Author',
        homepage: 'https://example.com/plugin-2',
      } as ToolManifest,
      runtimeType: 'default',
      type: 'plugin',
    },
    {
      identifier: 'plugin-3',
      manifest: {
        identifier: 'plugin-3',
        api: [
          {
            name: 'api-3',
            url: 'bac',
            description: '123123',
            parameters: { type: 'object', properties: { a: { type: 'string' } } },
          },
        ],
      },
      type: 'customPlugin',
    },
  ],
  builtinTools: [
    {
      type: 'builtin',
      identifier: 'builtin-1',
      manifest: {
        identifier: 'builtin-1',
        api: [{ name: 'builtin-api-1' }],
        meta: { title: 'Builtin 1', description: 'Builtin 1 description' },
      } as ToolManifest,
    },
  ],
  pluginInstallLoading: {
    'plugin-1': false,
    'plugin-2': true,
  },
  uninstalledBuiltinTools: [],
} as ToolStoreState;

describe('toolSelectors', () => {
  describe('getToolManifestLoadingStatus', () => {
    it('should return "loading" if the plugin manifest is being loaded', () => {
      const result = toolSelectors.getManifestLoadingStatus('plugin-2')(mockState);
      expect(result).toBe('loading');
    });

    it('should return "error" if the plugin manifest is not found', () => {
      const result = toolSelectors.getManifestLoadingStatus('non-existing-plugin')(mockState);
      expect(result).toBe('error');
    });

    it('should return "success" if the plugin manifest is loaded', () => {
      const result = toolSelectors.getManifestLoadingStatus('plugin-1')(mockState);
      expect(result).toBe('success');
    });
  });

  describe('metaList and getMetaById', () => {
    it('should return the correct list of tool metadata', () => {
      const result = toolSelectors.metaList(mockState);
      expect(result).toEqual([
        {
          author: 'LobeHub',
          identifier: 'test-skill',
          meta: { avatar: '🧪', description: 'A test skill', title: 'Test Skill' },
          type: 'builtin',
        },
        {
          type: 'builtin',
          author: 'LobeHub',
          identifier: 'builtin-1',
          meta: { title: 'Builtin 1', description: 'Builtin 1 description' },
        },
        {
          author: 'Test Author',
          createdAt: '2024-01-01',
          description: 'Plugin 1 description',
          homepage: 'https://example.com/plugin-1',
          identifier: 'plugin-1',
          meta: { title: 'Plugin 1', description: 'Plugin 1 description' },
          runtimeType: 'standalone',
          title: 'Plugin 1',
          type: 'plugin',
        },
        {
          author: 'Another Author',
          createdAt: undefined,
          homepage: 'https://example.com/plugin-2',
          identifier: 'plugin-2',
          meta: undefined,
          runtimeType: 'default',
          type: 'plugin',
        },
        {
          author: undefined,
          createdAt: undefined,
          homepage: undefined,
          identifier: 'plugin-3',
          meta: undefined,
          runtimeType: undefined,
          type: 'customPlugin',
        },
      ]);
    });

    it('should return the correct metadata by identifier', () => {
      const result = toolSelectors.getMetaById('plugin-1')(mockState);
      expect(result).toEqual({ title: 'Plugin 1', description: 'Plugin 1 description' });
    });

    it('should return undefined for non-existent identifier', () => {
      const result = toolSelectors.getMetaById('non-existent')(mockState);
      expect(result).toBeUndefined();
    });
  });

  describe('getManifestById and getManifestLoadingStatus', () => {
    it('should return the correct manifest by identifier', () => {
      const result = toolSelectors.getManifestById('plugin-1')(mockState);
      expect(result).toEqual({
        identifier: 'plugin-1',
        api: [{ name: 'api-1' }],
        author: 'Test Author',
        createdAt: '2024-01-01',
        homepage: 'https://example.com/plugin-1',
        meta: { title: 'Plugin 1', description: 'Plugin 1 description' },
      });
    });

    it('should return undefined for non-existent identifier', () => {
      const result = toolSelectors.getManifestById('non-existent')(mockState);
      expect(result).toBeUndefined();
    });

    it('should return the correct loading status for a plugin', () => {
      expect(toolSelectors.getManifestLoadingStatus('plugin-1')(mockState)).toBe('success');
      expect(toolSelectors.getManifestLoadingStatus('plugin-2')(mockState)).toBe('loading');
      expect(toolSelectors.getManifestLoadingStatus('non-existent')(mockState)).toBe('error');
    });
  });

  describe('isToolHasUI', () => {
    it('should return false if the tool has no UI', () => {
      expect(toolSelectors.isToolHasUI('plugin-1')(mockState)).toBe(false);
    });

    it('should return true if the tool has UI', () => {
      expect(toolSelectors.isToolHasUI('builtin-1')(mockState)).toBe(true);
    });

    it('should return false if the tool does not exist', () => {
      expect(toolSelectors.isToolHasUI('non-existent')(mockState)).toBe(false);
    });
  });

  describe('availableToolsForDiscovery', () => {
    it('includes source and api descriptions for discoverable tools', () => {
      const result = toolSelectors.availableToolsForDiscovery(mockState);

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            apiDescriptions: [{ description: '', name: 'builtin-api-1' }],
            identifier: 'builtin-1',
            source: 'builtin',
          }),
          expect.objectContaining({
            apiDescriptions: [{ description: '', name: 'api-1' }],
            identifier: 'plugin-1',
            source: 'community plugin',
          }),
          expect.objectContaining({
            apiDescriptions: [{ description: '123123', name: 'api-3' }],
            identifier: 'plugin-3',
            source: 'custom plugin',
          }),
        ]),
      );
    });
  });

  describe('searchAvailableToolsForDiscovery', () => {
    it('ranks tools by capability matches and respects the result limit', () => {
      const result = searchAvailableToolsForDiscovery(
        [
          {
            apiDescriptions: [
              {
                description: 'Search attached knowledge base documents',
                name: 'searchKnowledgeBase',
              },
            ],
            description: 'Search indexed documents and notes',
            identifier: 'knowledge-base',
            name: 'Knowledge Base',
            source: 'builtin',
          },
          {
            apiDescriptions: [
              {
                description: 'Search local files with glob and grep helpers',
                name: 'searchLocalFiles',
              },
            ],
            description: 'Search files on the local runtime',
            identifier: 'local-system',
            name: 'Local System',
            source: 'builtin',
          },
          {
            apiDescriptions: [
              { description: 'Store and retrieve long-term memories', name: 'searchUserMemory' },
            ],
            description: 'Recall user memories',
            identifier: 'memory',
            name: 'Memory',
            source: 'builtin',
          },
        ],
        'search local files',
        2,
      );

      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual(
        expect.objectContaining({
          identifier: 'local-system',
          matchedFields: expect.arrayContaining(['api', 'description']),
        }),
      );
      expect(result.items[1].identifier).toBe('knowledge-base');
    });

    it('returns no results for an empty query', () => {
      const result = searchAvailableToolsForDiscovery(
        [
          {
            description: 'A calculator',
            identifier: 'calculator',
            name: 'Calculator',
            source: 'builtin',
          },
        ],
        '   ',
      );

      expect(result).toEqual({ items: [], total: 0 });
    });
  });
});
