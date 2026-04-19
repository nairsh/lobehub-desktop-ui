import { MODEL_REASONING_CONFIGS } from '@/utils/modelReasoning';

import { createLevelSliderComponent } from './createLevelSlider';
import { type CreatedLevelSliderProps } from './createLevelSlider';

type ReasoningEffort = (typeof MODEL_REASONING_CONFIGS.reasoningEffort.levels)[number];

export type ReasoningEffortSliderProps = CreatedLevelSliderProps<ReasoningEffort>;

const ReasoningEffortSlider = createLevelSliderComponent<ReasoningEffort>(
  MODEL_REASONING_CONFIGS.reasoningEffort,
);

export default ReasoningEffortSlider;
