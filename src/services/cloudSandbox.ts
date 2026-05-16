import { lambdaClient } from '@/libs/trpc/client';

export interface CallToolResult {
  error?: {
    message: string;
    name?: string;
  };
  result: any;
  sessionExpiredAndRecreated?: boolean;
  success: boolean;
}

export interface ExportAndUploadFileResult {
  error?: {
    message: string;
  };
  fileId?: string;
  filename: string;
  mimeType?: string;
  size?: number;
  success: boolean;
  url?: string;
}

interface CloudSandboxContext {
  topicId: string;
  userId?: string;
}

class TrpcCloudSandboxProvider {
  async callTool(
    toolName: string,
    params: Record<string, any>,
    context: CloudSandboxContext,
  ): Promise<CallToolResult> {
    const result = await lambdaClient.terminal.callTool.mutate({
      params,
      toolName,
      topicId: context.topicId,
    });
    return result as CallToolResult;
  }

  async exportAndUploadFile(
    path: string,
    filename: string,
    topicId: string,
  ): Promise<ExportAndUploadFileResult> {
    const result = await lambdaClient.terminal.exportAndUploadFile.mutate({
      filename,
      path,
      topicId,
    });
    return result as ExportAndUploadFileResult;
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
