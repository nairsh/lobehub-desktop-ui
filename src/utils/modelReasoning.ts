import type { ExtendParamsType } from 'model-bank';

import type { LevelSliderConfig } from '@/features/ModelSwitchPanel/components/ControlsForm/createLevelSlider';
import type { LobeAgentChatConfig } from '@/types/agent';

export type ReasoningExtendParam =
  | 'codexMaxReasoningEffort'
  | 'deepseekV4ReasoningEffort'
  | 'effort'
  | 'gpt5ReasoningEffort'
  | 'gpt5_1ReasoningEffort'
  | 'gpt5_2ProReasoningEffort'
  | 'gpt5_2ReasoningEffort'
  | 'grok4_20ReasoningEffort'
  | 'reasoningEffort'
  | 'thinkingLevel'
  | 'thinkingLevel2'
  | 'thinkingLevel3'
  | 'thinkingLevel4'
  | 'thinkingLevel5';

export interface ReasoningOptionConfig<T extends string = string> extends LevelSliderConfig<T> {
  titleKey: string;
}

export interface ResolvedReasoningOption<
  T extends string = string,
> extends ReasoningOptionConfig<T> {
  extendParam: ReasoningExtendParam;
  label: string;
  value: T;
}

export const MODEL_REASONING_CONFIGS = {
  codexMaxReasoningEffort: {
    configKey: 'codexMaxReasoningEffort',
    defaultValue: 'medium',
    levels: ['low', 'medium', 'high', 'xhigh'],
    style: { minWidth: 200 },
    titleKey: 'extendParams.reasoningEffort.title',
  },
  deepseekV4ReasoningEffort: {
    configKey: 'deepseekV4ReasoningEffort',
    defaultValue: 'high',
    levels: ['none', 'high', 'max'],
    style: { minWidth: 180 },
    titleKey: 'extendParams.reasoningEffort.title',
  },
  effort: {
    configKey: 'effort',
    defaultValue: 'high',
    levels: ['low', 'medium', 'high', 'max'],
    style: { minWidth: 200 },
    titleKey: 'extendParams.effort.title',
  },
  gpt5ReasoningEffort: {
    configKey: 'gpt5ReasoningEffort',
    defaultValue: 'medium',
    levels: ['minimal', 'low', 'medium', 'high'],
    style: { minWidth: 200 },
    titleKey: 'extendParams.reasoningEffort.title',
  },
  gpt5_1ReasoningEffort: {
    configKey: 'gpt5_1ReasoningEffort',
    defaultValue: 'none',
    levels: ['none', 'low', 'medium', 'high'],
    style: { minWidth: 200 },
    titleKey: 'extendParams.reasoningEffort.title',
  },
  gpt5_2ProReasoningEffort: {
    configKey: 'gpt5_2ProReasoningEffort',
    defaultValue: 'medium',
    levels: ['medium', 'high', 'xhigh'],
    style: { minWidth: 160 },
    titleKey: 'extendParams.reasoningEffort.title',
  },
  gpt5_2ReasoningEffort: {
    configKey: 'gpt5_2ReasoningEffort',
    defaultValue: 'none',
    levels: ['none', 'low', 'medium', 'high', 'xhigh'],
    style: { minWidth: 230 },
    titleKey: 'extendParams.reasoningEffort.title',
  },
  grok4_20ReasoningEffort: {
    configKey: 'grok4_20ReasoningEffort',
    defaultValue: 'medium',
    levels: ['low', 'medium', 'high', 'xhigh'],
    style: { minWidth: 200 },
    titleKey: 'extendParams.reasoningEffort.title',
  },
  reasoningEffort: {
    configKey: 'reasoningEffort',
    defaultValue: 'medium',
    levels: ['low', 'medium', 'high'],
    style: { minWidth: 200 },
    titleKey: 'extendParams.reasoningEffort.title',
  },
  thinkingLevel: {
    configKey: 'thinkingLevel',
    defaultValue: 'high',
    levels: ['minimal', 'low', 'medium', 'high'],
    style: { minWidth: 200 },
    titleKey: 'extendParams.thinkingLevel.title',
  },
  thinkingLevel2: {
    configKey: 'thinkingLevel2',
    defaultValue: 'high',
    levels: ['low', 'high'],
    style: { minWidth: 110 },
    titleKey: 'extendParams.thinkingLevel.title',
  },
  thinkingLevel3: {
    configKey: 'thinkingLevel3',
    defaultValue: 'high',
    levels: ['low', 'medium', 'high'],
    style: { minWidth: 160 },
    titleKey: 'extendParams.thinkingLevel.title',
  },
  thinkingLevel4: {
    configKey: 'thinkingLevel4',
    defaultValue: 'minimal',
    levels: ['minimal', 'high'],
    style: { minWidth: 110 },
    titleKey: 'extendParams.thinkingLevel.title',
  },
  thinkingLevel5: {
    configKey: 'thinkingLevel5',
    defaultValue: 'minimal',
    levels: ['minimal', 'low', 'medium', 'high'],
    style: { minWidth: 200 },
    titleKey: 'extendParams.thinkingLevel.title',
  },
} as const satisfies Record<ReasoningExtendParam, ReasoningOptionConfig<string>>;

const REASONING_PARAM_PRIORITY: ReasoningExtendParam[] = [
  'gpt5_2ProReasoningEffort',
  'gpt5_2ReasoningEffort',
  'gpt5_1ReasoningEffort',
  'gpt5ReasoningEffort',
  'deepseekV4ReasoningEffort',
  'codexMaxReasoningEffort',
  'grok4_20ReasoningEffort',
  'reasoningEffort',
  'effort',
  'thinkingLevel5',
  'thinkingLevel4',
  'thinkingLevel3',
  'thinkingLevel2',
  'thinkingLevel',
];

const REASONING_LABEL_OVERRIDES: Partial<Record<string, string>> = {
  xhigh: 'XHigh',
};

export const formatReasoningLabel = (value: string) => {
  const override = REASONING_LABEL_OVERRIDES[value];
  if (override) return override;

  return value
    .split(/[_\s-]+/)
    .map((segment) => {
      if (!segment) return segment;

      return segment[0].toUpperCase() + segment.slice(1);
    })
    .join(' ');
};

export const findReasoningConfig = (modelExtendParams?: ExtendParamsType[]) => {
  if (!modelExtendParams?.length) return null;

  const extendParam = REASONING_PARAM_PRIORITY.find((param) => modelExtendParams.includes(param));

  if (!extendParam) return null;

  return { ...MODEL_REASONING_CONFIGS[extendParam], extendParam };
};

export const resolveReasoningOption = ({
  chatConfig,
  modelExtendParams,
}: {
  chatConfig?: Partial<LobeAgentChatConfig>;
  modelExtendParams?: ExtendParamsType[];
}): ResolvedReasoningOption | null => {
  const config = findReasoningConfig(modelExtendParams);

  if (!config) return null;

  const rawValue = chatConfig?.[config.configKey];
  const value =
    typeof rawValue === 'string' && (config.levels as readonly string[]).includes(rawValue)
      ? rawValue
      : config.defaultValue;

  return {
    ...config,
    label: formatReasoningLabel(value),
    value,
  };
};
