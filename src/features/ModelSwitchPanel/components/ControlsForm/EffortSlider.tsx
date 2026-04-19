import { MODEL_REASONING_CONFIGS } from '@/utils/modelReasoning';

import { type CreatedLevelSliderProps, createLevelSliderComponent } from './createLevelSlider';

type EffortLevel = (typeof MODEL_REASONING_CONFIGS.effort.levels)[number];

export type EffortSliderProps = CreatedLevelSliderProps<EffortLevel>;

const EffortSlider = createLevelSliderComponent<EffortLevel>(MODEL_REASONING_CONFIGS.effort);

export default EffortSlider;
