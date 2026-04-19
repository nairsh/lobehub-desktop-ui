import { MODEL_REASONING_CONFIGS } from '@/utils/modelReasoning';

import { createLevelSliderComponent } from './createLevelSlider';
import { type CreatedLevelSliderProps } from './createLevelSlider';

type Grok420ReasoningEffort =
  (typeof MODEL_REASONING_CONFIGS.grok4_20ReasoningEffort.levels)[number];

export type Grok420ReasoningEffortSliderProps = CreatedLevelSliderProps<Grok420ReasoningEffort>;

const Grok420ReasoningEffortSlider = createLevelSliderComponent<Grok420ReasoningEffort>(
  MODEL_REASONING_CONFIGS.grok4_20ReasoningEffort,
);

export default Grok420ReasoningEffortSlider;
