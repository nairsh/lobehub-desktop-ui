import { MODEL_REASONING_CONFIGS } from '@/utils/modelReasoning';

import { createLevelSliderComponent } from './createLevelSlider';
import { type CreatedLevelSliderProps } from './createLevelSlider';

type ThinkingLevel4 = (typeof MODEL_REASONING_CONFIGS.thinkingLevel4.levels)[number];

export type ThinkingLevel4SliderProps = CreatedLevelSliderProps<ThinkingLevel4>;

const ThinkingLevel4Slider = createLevelSliderComponent<ThinkingLevel4>(
  MODEL_REASONING_CONFIGS.thinkingLevel4,
);

export default ThinkingLevel4Slider;
