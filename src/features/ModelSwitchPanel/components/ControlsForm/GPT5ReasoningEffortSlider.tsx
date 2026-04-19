import { MODEL_REASONING_CONFIGS } from '@/utils/modelReasoning';

import { createLevelSliderComponent } from './createLevelSlider';
import { type CreatedLevelSliderProps } from './createLevelSlider';

type GPT5ReasoningEffort = (typeof MODEL_REASONING_CONFIGS.gpt5ReasoningEffort.levels)[number];

export type GPT5ReasoningEffortSliderProps = CreatedLevelSliderProps<GPT5ReasoningEffort>;

const GPT5ReasoningEffortSlider = createLevelSliderComponent<GPT5ReasoningEffort>(
  MODEL_REASONING_CONFIGS.gpt5ReasoningEffort,
);

export default GPT5ReasoningEffortSlider;
