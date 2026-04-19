import { MODEL_REASONING_CONFIGS } from '@/utils/modelReasoning';

import { createLevelSliderComponent } from './createLevelSlider';
import { type CreatedLevelSliderProps } from './createLevelSlider';

type CodexMaxReasoningEffort =
  (typeof MODEL_REASONING_CONFIGS.codexMaxReasoningEffort.levels)[number];

export type CodexMaxReasoningEffortSliderProps = CreatedLevelSliderProps<CodexMaxReasoningEffort>;

const CodexMaxReasoningEffortSlider = createLevelSliderComponent<CodexMaxReasoningEffort>(
  MODEL_REASONING_CONFIGS.codexMaxReasoningEffort,
);

export default CodexMaxReasoningEffortSlider;
