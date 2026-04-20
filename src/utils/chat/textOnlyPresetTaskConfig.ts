interface PresetTaskModelConfig {
  model?: string;
  provider?: string;
}

export const buildTextOnlyPresetTaskConfig = (config: PresetTaskModelConfig) => ({
  ...config,
  thinking: {
    type: 'disabled' as const,
  },
});
