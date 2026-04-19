import { MODEL_REASONING_CONFIGS } from '@/utils/modelReasoning';

import { createLevelSliderComponent } from './createLevelSlider';
import { type CreatedLevelSliderProps } from './createLevelSlider';

type ThinkingLevel2 = (typeof MODEL_REASONING_CONFIGS.thinkingLevel2.levels)[number];

export type ThinkingLevel2SliderProps = CreatedLevelSliderProps<ThinkingLevel2>;

const ThinkingLevel2Slider = createLevelSliderComponent<ThinkingLevel2>(
  MODEL_REASONING_CONFIGS.thinkingLevel2,
);

export default ThinkingLevel2Slider;
