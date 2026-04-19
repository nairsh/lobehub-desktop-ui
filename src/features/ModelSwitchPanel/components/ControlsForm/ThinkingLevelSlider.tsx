import { MODEL_REASONING_CONFIGS } from '@/utils/modelReasoning';

import { createLevelSliderComponent } from './createLevelSlider';
import { type CreatedLevelSliderProps } from './createLevelSlider';

type ThinkingLevel = (typeof MODEL_REASONING_CONFIGS.thinkingLevel.levels)[number];

export type ThinkingLevelSliderProps = CreatedLevelSliderProps<ThinkingLevel>;

const ThinkingLevelSlider = createLevelSliderComponent<ThinkingLevel>(
  MODEL_REASONING_CONFIGS.thinkingLevel,
);

export default ThinkingLevelSlider;
