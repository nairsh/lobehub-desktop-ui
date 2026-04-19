import { MODEL_REASONING_CONFIGS } from '@/utils/modelReasoning';

import { createLevelSliderComponent } from './createLevelSlider';
import { type CreatedLevelSliderProps } from './createLevelSlider';

type GPT52ReasoningEffort = (typeof MODEL_REASONING_CONFIGS.gpt5_2ReasoningEffort.levels)[number];

export type GPT52ReasoningEffortSliderProps = CreatedLevelSliderProps<GPT52ReasoningEffort>;

const GPT52ReasoningEffortSlider = createLevelSliderComponent<GPT52ReasoningEffort>(
  MODEL_REASONING_CONFIGS.gpt5_2ReasoningEffort,
);

export default GPT52ReasoningEffortSlider;
