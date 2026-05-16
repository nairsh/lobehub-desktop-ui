import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';

// This router mirrors the backend's terminalRouter for type inference only.
// Cloud-sandbox terminal management runs on the LobeHub server, not here.
// These procedures throw PRECONDITION_FAILED if somehow invoked locally.

const notEnabled = (): never => {
  throw new TRPCError({
    code: 'PRECONDITION_FAILED',
    message: 'TERMINAL_NOT_ENABLED',
  });
};

const base = authedProcedure.use(serverDatabase);

export const terminalRouter = router({
  callTool: base
    .input(
      z.object({
        params: z.record(z.any()),
        toolName: z.string(),
        topicId: z.string(),
      }),
    )
    .mutation((): { error?: { message: string }; result: any; success: boolean } => notEnabled()),

  exportAndUploadFile: base
    .input(
      z.object({
        filename: z.string(),
        path: z.string(),
        topicId: z.string(),
      }),
    )
    .mutation(
      (): {
        error?: { message: string };
        fileId?: string;
        filename: string;
        mimeType?: string;
        size?: number;
        success: boolean;
        url?: string;
      } => notEnabled(),
    ),

  ensureTerminal: base.mutation((): { ready: boolean } => notEnabled()),

  stopTerminal: base.mutation((): { stopped: boolean } => notEnabled()),

  getStatus: base.query((): { running: boolean; status: string } => notEnabled()),
});

export type TerminalRouter = typeof terminalRouter;
