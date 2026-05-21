import {
  type SandboxCallToolResult as CallToolResult,
  type SandboxExportFileResult as ExportAndUploadFileResult,
} from '@lobechat/builtin-tool-cloud-sandbox';

import { toolsClient } from '@/libs/trpc/client';

interface CloudSandboxContext {
  topicId: string;
  userId?: string;
}

interface ExecInSandboxInput {
  params: Record<string, any>;
  toolName: string;
  topicId: string;
  userId?: string;
}

interface ExportAndUploadFileInput {
  filename: string;
  path: string;
  topicId: string;
}

class TrpcCloudSandboxProvider {
  async callTool(
    toolName: string,
    params: Record<string, any>,
    context: CloudSandboxContext,
  ): Promise<CallToolResult> {
    const input: ExecInSandboxInput = {
      params,
      toolName,
      topicId: context.topicId,
      userId: context.userId,
    };

    return toolsClient.market.execInSandbox.mutate(input) as Promise<CallToolResult>;
  }

  async exportAndUploadFile(
    path: string,
    filename: string,
    topicId: string,
  ): Promise<ExportAndUploadFileResult> {
    const input: ExportAndUploadFileInput = {
      filename,
      path,
      topicId,
    };

    return toolsClient.market.exportAndUploadFile.mutate(
      input,
    ) as Promise<ExportAndUploadFileResult>;
  }
}

class CloudSandboxService {
  private readonly provider = new TrpcCloudSandboxProvider();

  async callTool(
    toolName: string,
    params: Record<string, any>,
    context: CloudSandboxContext,
  ): Promise<CallToolResult> {
    return this.provider.callTool(toolName, params, context);
  }

  async exportAndUploadFile(
    path: string,
    filename: string,
    topicId: string,
  ): Promise<ExportAndUploadFileResult> {
    return this.provider.exportAndUploadFile(path, filename, topicId);
  }
}

export const cloudSandboxService = new CloudSandboxService();
