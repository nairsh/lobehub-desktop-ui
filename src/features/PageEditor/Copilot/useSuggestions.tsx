'use client';

import {
  AlignLeftIcon,
  BotIcon,
  type LucideIcon,
  ScanSearchIcon,
  WorkflowIcon,
} from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useConversationStore } from '@/features/Conversation';

import { usePageEditorStore } from '../store';

export interface CopilotSuggestion {
  badge?: boolean;
  icon: LucideIcon;
  key: string;
  label: string;
  onClick: () => void;
}

/**
 * Welcome-screen suggestions for the page AI island. Each one sends a real
 * message to the page agent, attaching the current page text as context so the
 * model can act on what the user is looking at.
 */
export const useSuggestions = (): CopilotSuggestion[] => {
  const { t } = useTranslation('chat');
  const sendMessage = useConversationStore((s) => s.sendMessage);
  const editor = usePageEditorStore((s) => s.editor);
  const documentId = usePageEditorStore((s) => s.documentId);

  const send = useCallback(
    (prompt: string) => {
      const text = (editor?.getDocument('text') as unknown as string) || '';

      void sendMessage({
        message: prompt,
        pageSelections: text.trim()
          ? [{ content: text, id: documentId || 'page', pageId: documentId || '' }]
          : undefined,
      });
    },
    [editor, documentId, sendMessage],
  );

  return useMemo(
    () => [
      {
        badge: true,
        icon: BotIcon,
        key: 'create-agent',
        label: t('pageCopilot.suggestion.createAgent'),
        onClick: () => send(t('pageCopilot.suggestion.createAgentPrompt')),
      },
      {
        badge: true,
        icon: WorkflowIcon,
        key: 'create-diagram',
        label: t('pageCopilot.suggestion.createDiagram'),
        onClick: () => send(t('pageCopilot.suggestion.createDiagramPrompt')),
      },
      {
        icon: AlignLeftIcon,
        key: 'summarize',
        label: t('pageCopilot.suggestion.summarize'),
        onClick: () => send(t('pageCopilot.suggestion.summarizePrompt')),
      },
      {
        icon: ScanSearchIcon,
        key: 'analyze',
        label: t('pageCopilot.suggestion.analyze'),
        onClick: () => send(t('pageCopilot.suggestion.analyzePrompt')),
      },
    ],
    [send, t],
  );
};
