/**
 * Lobe Skills Executor (Desktop)
 *
 * Desktop keeps the existing runtime selector semantics:
 * - local: execute skills through the desktop local runtime
 * - cloud: execute skills through the cloud sandbox provider
 * - none: block skill execution
 */
import { builtinSkills } from '@lobechat/builtin-skills';
import { SkillsExecutionRuntime } from '@lobechat/builtin-tool-skills/executionRuntime';
import { SkillsExecutor } from '@lobechat/builtin-tool-skills/executor';
import type { RuntimeEnvMode } from '@lobechat/types';

import { filterBuiltinSkills } from '@/helpers/skillFilters';
import { cloudSandboxService } from '@/services/cloudSandbox';
import { desktopSkillRuntimeService } from '@/services/electron/desktopSkillRuntime';
import { localFileService } from '@/services/electron/localFileService';
import { agentSkillService } from '@/services/skill';
import { useAgentStore } from '@/store/agent';
import { chatConfigByIdSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';

interface DesktopSkillRuntimeService {
  execScript: (
    command: string,
    options: {
      activatedSkills?: Array<{ description?: string; id: string; name: string }>;
      description: string;
    },
  ) => Promise<{
    exitCode: number;
    output: string;
    stderr?: string;
    success: boolean;
  }>;
  exportFile?: (path: string, filename: string) => Promise<any>;
  runCommand: (options: { command: string }) => Promise<{
    exitCode: number;
    output: string;
    stderr?: string;
    success: boolean;
  }>;
}

const getRuntimeMode = (): RuntimeEnvMode => {
  const agentState = useAgentStore.getState();
  const agentId = agentState.activeAgentId;

  if (!agentId) return 'local';

  return chatConfigByIdSelectors.getRuntimeModeById(agentId)(agentState);
};

const getTopicId = () => useChatStore.getState().activeTopicId || 'default';

const localSkillService: DesktopSkillRuntimeService = {
  execScript: async (
    command: string,
    options: {
      activatedSkills?: Array<{ description?: string; id: string; name: string }>;
      description: string;
    },
  ) => {
    const cwd = await desktopSkillRuntimeService.resolveExecutionDirectory(options.activatedSkills);
    const result = await localFileService.runCommand({
      command,
      cwd,
      description: options.description,
      timeout: undefined,
    });

    return {
      exitCode: result.exit_code ?? 1,
      output: result.stdout || result.output || '',
      stderr: result.stderr,
      success: result.success,
    };
  },
  runCommand: async ({ command }: { command: string }) => {
    const result = await localFileService.runCommand({ command, timeout: undefined });

    return {
      exitCode: result.exit_code ?? 1,
      output: result.stdout || result.output || '',
      stderr: result.stderr,
      success: result.success,
    };
  },
};

const cloudSkillService: DesktopSkillRuntimeService = {
  execScript: async (
    command: string,
    options: {
      activatedSkills?: Array<{ description?: string; id: string; name: string }>;
      description: string;
    },
  ) => {
    const { activatedSkills, description } = options;

    const result = await cloudSandboxService.callTool(
      'execScript',
      {
        activatedSkills,
        command,
        description,
      },
      { topicId: getTopicId() },
    );

    if (!result.success) {
      return {
        exitCode: 1,
        output: '',
        stderr: result.error?.message || 'Command execution failed',
        success: false,
      };
    }

    const sandboxResult = result.result || {};

    return {
      exitCode: sandboxResult.exitCode ?? (result.success ? 0 : 1),
      output: sandboxResult.stdout || sandboxResult.output || '',
      stderr: sandboxResult.stderr || '',
      success: sandboxResult.exitCode === 0 || sandboxResult.exitCode === undefined,
    };
  },
  exportFile: async (path: string, filename: string) => {
    return cloudSandboxService.exportAndUploadFile(path, filename, getTopicId());
  },
  runCommand: async ({ command }: { command: string }) => {
    const result = await cloudSandboxService.callTool(
      'runCommand',
      {
        command,
        description: `Execute skill command: ${command.slice(0, 100)}${command.length > 100 ? '...' : ''}`,
      },
      { topicId: getTopicId() },
    );

    if (!result.success) {
      return {
        exitCode: 1,
        output: '',
        stderr: result.error?.message || 'Command execution failed',
        success: false,
      };
    }

    const sandboxResult = result.result || {};

    return {
      exitCode: sandboxResult.exitCode ?? (result.success ? 0 : 1),
      output: sandboxResult.stdout || sandboxResult.output || '',
      stderr: sandboxResult.stderr || '',
      success: sandboxResult.exitCode === 0 || sandboxResult.exitCode === undefined,
    };
  },
};

const selectRuntimeService = (): DesktopSkillRuntimeService => {
  const runtimeMode = getRuntimeMode();

  if (runtimeMode === 'local') return localSkillService;
  if (runtimeMode === 'cloud') return cloudSkillService;

  throw new Error('Runtime environment is off for this agent.');
};

const runtime = new SkillsExecutionRuntime({
  builtinSkills: filterBuiltinSkills(builtinSkills),
  service: {
    execScript: async (command, options) => {
      return selectRuntimeService().execScript(command, options);
    },
    exportFile: async (path, filename) => {
      const runtimeService = selectRuntimeService();

      if (!runtimeService.exportFile) {
        throw new Error('File export is only available in cloud runtime mode.');
      }

      return runtimeService.exportFile(path, filename);
    },
    findAll: () => agentSkillService.list(),
    findById: (id) => agentSkillService.getById(id),
    findByName: (name) => agentSkillService.getByName(name),
    readResource: async (id, path) => {
      const resource = await agentSkillService.readResource(id, path);
      const fullPath = await desktopSkillRuntimeService.resolveReferenceFullPath({
        path,
        skillId: id,
      });

      return {
        ...resource,
        fullPath,
      };
    },
    runCommand: async ({ command }) => {
      return selectRuntimeService().runCommand({ command });
    },
  },
});

export const skillsExecutor = new SkillsExecutor(runtime);
