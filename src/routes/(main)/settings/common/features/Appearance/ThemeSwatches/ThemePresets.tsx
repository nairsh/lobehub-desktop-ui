import type { ThemePreset } from '@lobechat/types';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  createPresetSwatchBackground,
  defaultThemeSwatchBackground,
  themePresetIds,
} from '@/utils/customTheme';

import ThemeSwatchesBase from './ThemeSwatchesBase';

interface IProps {
  onChange?: (v: ThemePreset | '') => void;
  value?: ThemePreset;
}

const ThemePresets = memo<IProps>(({ value, onChange }) => {
  const { t } = useTranslation('setting');

  return (
    <ThemeSwatchesBase
      value={value}
      options={[
        {
          background: defaultThemeSwatchBackground,
          label: t('settingAppearance.themePreset.none'),
        },
        ...themePresetIds.map((preset) => ({
          background: createPresetSwatchBackground(preset),
          label: t(`settingAppearance.themePreset.${preset}`),
          value: preset,
        })),
      ]}
      onChange={(next) => onChange?.(next as ThemePreset | '')}
    />
  );
});

export default ThemePresets;
