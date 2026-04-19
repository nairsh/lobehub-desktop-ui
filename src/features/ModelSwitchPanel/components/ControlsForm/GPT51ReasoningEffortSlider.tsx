import { MODEL_REASONING_CONFIGS } from '@/utils/modelReasoning';

import { createLevelSliderComponent } from './createLevelSlider';
import { type CreatedLevelSliderProps } from './createLevelSlider';

type GPT51ReasoningEffort = (typeof MODEL_REASONING_CONFIGS.gpt5_1ReasoningEffort.levels)[number];

export type GPT51ReasoningEffortSliderProps = CreatedLevelSliderProps<GPT51ReasoningEffort>;

const GPT51ReasoningEffortSlider = createLevelSliderComponent<GPT51ReasoningEffort>(
  MODEL_REASONING_CONFIGS.gpt5_1ReasoningEffort,
);

export default GPT51ReasoningEffortSlider;
