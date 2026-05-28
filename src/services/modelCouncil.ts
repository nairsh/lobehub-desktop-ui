import { cleanObject } from '@lobechat/utils';

import { lambdaClient } from '@/libs/trpc/client';
import type { ModelCouncilStartPayload } from '@/types/modelCouncil';

class ModelCouncilService {
  cancel = async (operationId: string) =>
    (lambdaClient as any).modelCouncil.cancel.mutate(
      { operationId },
      { context: { showNotification: false } },
    );

  start = async (params: ModelCouncilStartPayload, abortController: AbortController) =>
    (lambdaClient as any).modelCouncil.start.mutate(cleanObject(params), {
      context: { showNotification: false },
      signal: abortController.signal,
    });
}

export const modelCouncilService = new ModelCouncilService();
