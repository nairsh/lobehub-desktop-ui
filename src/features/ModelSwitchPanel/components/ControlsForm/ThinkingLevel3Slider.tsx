import { MODEL_REASONING_CONFIGS } from '@/utils/modelReasoning';

import { createLevelSliderComponent } from './createLevelSlider';
import { type CreatedLevelSliderProps } from './createLevelSlider';

type ThinkingLevel3 = (typeof MODEL_REASONING_CONFIGS.thinkingLevel3.levels)[number];

export type ThinkingLevel3SliderProps = CreatedLevelSliderProps<ThinkingLevel3>;

const ThinkingLevel3Slider = createLevelSliderComponent<ThinkingLevel3>(
  MODEL_REASONING_CONFIGS.thinkingLevel3,
);

export default ThinkingLevel3Slider;
