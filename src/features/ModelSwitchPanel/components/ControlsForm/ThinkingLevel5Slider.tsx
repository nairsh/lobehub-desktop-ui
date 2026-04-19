import { MODEL_REASONING_CONFIGS } from '@/utils/modelReasoning';

import { createLevelSliderComponent } from './createLevelSlider';
import { type CreatedLevelSliderProps } from './createLevelSlider';

type ThinkingLevel5 = (typeof MODEL_REASONING_CONFIGS.thinkingLevel5.levels)[number];

export type ThinkingLevel5SliderProps = CreatedLevelSliderProps<ThinkingLevel5>;

const ThinkingLevel5Slider = createLevelSliderComponent<ThinkingLevel5>(
  MODEL_REASONING_CONFIGS.thinkingLevel5,
);

export default ThinkingLevel5Slider;
