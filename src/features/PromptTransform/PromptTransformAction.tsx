'use client';

import { type TextRewriteMode } from '@lobechat/prompts';
import { Check, Languages, Lightbulb, Sparkles } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Action from '@/features/ChatInput/ActionBar/components/Action';

import { usePromptTransform } from './usePromptTransform';

interface PromptTransformActionProps {
  getPrompt?: () => string;
  mode: 'image' | 'video' | 'text';
  onPromptChange: (prompt: string) => void;
  onTextRewriteModeChange?: (textRewriteMode: TextRewriteMode) => void;
  prompt?: string | null;
  taskConfig?: {
    model?: string;
    provider?: string;
  };
  textRewriteMode?: TextRewriteMode;
}

const promptRewriteModes: Array<{
  descriptionKey: string;
  labelKey: string;
  value: TextRewriteMode;
}> = [
  {
    descriptionKey: 'promptTransform.modes.general.description',
    labelKey: 'promptTransform.modes.general.label',
    value: 'general',
  },
  {
    descriptionKey: 'promptTransform.modes.deepResearch.description',
    labelKey: 'promptTransform.modes.deepResearch.label',
    value: 'deepResearch',
  },
  {
    descriptionKey: 'promptTransform.modes.debateSteelman.description',
    labelKey: 'promptTransform.modes.debateSteelman.label',
    value: 'debateSteelman',
  },
  {
    descriptionKey: 'promptTransform.modes.neutralizeFraming.description',
    labelKey: 'promptTransform.modes.neutralizeFraming.label',
    value: 'neutralizeFraming',
  },
  {
    descriptionKey: 'promptTransform.modes.structuredQuestion.description',
    labelKey: 'promptTransform.modes.structuredQuestion.label',
    value: 'structuredQuestion',
  },
];

const PromptTransformAction = memo<PromptTransformActionProps>(
  ({
    getPrompt,
    mode,
    onPromptChange,
    onTextRewriteModeChange,
    prompt,
    taskConfig,
    textRewriteMode = 'general',
  }) => {
    const { t } = useTranslation('common');

    const {
      isTransformDisabled,
      isTransforming,
      transformAction,
      isRewriteEnabled,
      rewritePrompt,
      translatePrompt,
    } = usePromptTransform({
      getPrompt,
      mode,
      textRewriteMode,
      onPromptChange,
      prompt,
      taskConfig,
    });

    const rewriteModeMenuItems = useMemo(
      () =>
        promptRewriteModes.map((modeItem) => ({
          description: t(modeItem.descriptionKey),
          icon: modeItem.value === textRewriteMode ? <Check size={16} /> : <Sparkles size={16} />,
          key: `rewrite-mode-${modeItem.value}`,
          label: t(modeItem.labelKey),
          onClick: () => onTextRewriteModeChange?.(modeItem.value),
        })),
      [onTextRewriteModeChange, textRewriteMode, t],
    );

    const menuItems = useMemo(
      () => [
        {
          icon: <Sparkles size={16} />,
          key: 'rewrite',
          label: t('promptTransform.actions.rewrite'),
          onClick: rewritePrompt,
        },
        {
          icon: <Languages size={16} />,
          key: 'translate',
          label: t('promptTransform.actions.translate'),
          onClick: translatePrompt,
        },
      ],
      [rewritePrompt, t, translatePrompt],
    );

    const handlePrimaryAction = useMemo(
      () => (isRewriteEnabled ? rewritePrompt : translatePrompt),
      [isRewriteEnabled, rewritePrompt, translatePrompt],
    );

    const textDropdown = useMemo(
      () => ({
        menu: {
          items: [...rewriteModeMenuItems, { type: 'divider' }, ...menuItems],
        },
        trigger: 'hover' as const,
      }),
      [menuItems, rewriteModeMenuItems],
    );

    const dropdown = useMemo(() => {
      if (!isRewriteEnabled) return undefined;
      if (mode === 'text') return textDropdown;
      return { menu: { items: menuItems }, trigger: 'hover' as const };
    }, [isRewriteEnabled, menuItems, mode, textDropdown]);

    const primaryIcon = isRewriteEnabled ? Lightbulb : Languages;
    const isActionDisabled = isTransformDisabled || isTransforming;

    return (
      <Action
        disabled={isActionDisabled}
        dropdown={dropdown}
        icon={primaryIcon}
        loading={isTransforming}
        title={
          isTransforming
            ? t(
                transformAction === 'translate'
                  ? 'promptTransform.status.translate'
                  : 'promptTransform.status.rewrite',
              )
            : t(isRewriteEnabled ? 'promptTransform.action' : 'promptTransform.actions.translate')
        }
        onClick={handlePrimaryAction}
      />
    );
  },
);

PromptTransformAction.displayName = 'PromptTransformAction';

export default PromptTransformAction;
