import { MODEL_REASONING_CONFIGS } from '@/utils/modelReasoning';

import { createLevelSliderComponent } from './createLevelSlider';
import { type CreatedLevelSliderProps } from './createLevelSlider';

type GPT52ProReasoningEffort =
  (typeof MODEL_REASONING_CONFIGS.gpt5_2ProReasoningEffort.levels)[number];

export type GPT52ProReasoningEffortSliderProps = CreatedLevelSliderProps<GPT52ProReasoningEffort>;

const GPT52ProReasoningEffortSlider = createLevelSliderComponent<GPT52ProReasoningEffort>(
  MODEL_REASONING_CONFIGS.gpt5_2ProReasoningEffort,
);

export default GPT52ProReasoningEffortSlider;
