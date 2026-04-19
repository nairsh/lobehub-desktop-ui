import { describe, expect, it } from 'vitest';

import {
  findReasoningConfig,
  formatReasoningLabel,
  resolveReasoningOption,
} from './modelReasoning';

describe('modelReasoning', () => {
  it('prefers the model-specific reasoning control exposed by extend params', () => {
    expect(findReasoningConfig(['enableReasoning', 'effort'])?.extendParam).toBe('effort');
    expect(findReasoningConfig(['gpt5_2ReasoningEffort', 'reasoningEffort'])?.extendParam).toBe(
      'gpt5_2ReasoningEffort',
    );
  });

  it('resolves the active reasoning value from chat config', () => {
    expect(
      resolveReasoningOption({
        chatConfig: { gpt5_2ReasoningEffort: 'xhigh' },
        modelExtendParams: ['gpt5_2ReasoningEffort'],
      }),
    ).toMatchObject({
      configKey: 'gpt5_2ReasoningEffort',
      label: 'XHigh',
      value: 'xhigh',
    });
  });

  it('falls back to the model default reasoning level when unset', () => {
    expect(
      resolveReasoningOption({
        chatConfig: {},
        modelExtendParams: ['thinkingLevel2'],
      }),
    ).toMatchObject({
      configKey: 'thinkingLevel2',
      label: 'High',
      value: 'high',
    });
  });

  it('formats raw reasoning labels for display', () => {
    expect(formatReasoningLabel('minimal')).toBe('Minimal');
    expect(formatReasoningLabel('xhigh')).toBe('XHigh');
  });
});
