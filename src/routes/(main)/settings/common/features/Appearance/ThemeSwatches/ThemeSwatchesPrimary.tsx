import type { PrimaryColors } from '@lobehub/ui';
import { primaryColors } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { createThemeSwatchBackground, defaultThemeSwatchBackground } from '@/utils/customTheme';

import ThemeSwatchesBase from './ThemeSwatchesBase';

interface IProps {
  onChange?: (v: PrimaryColors | '') => void;
  value?: PrimaryColors;
}

const ThemeSwatchesPrimary = memo<IProps>(({ onChange, value }) => {
  const { t } = useTranslation('color');

  return (
    <ThemeSwatchesBase
      value={value}
      options={[
        {
          background: defaultThemeSwatchBackground,
          label: t('default'),
        },
        {
          background: createThemeSwatchBackground(primaryColors.red),
          label: t('red'),
          value: 'red',
        },
        {
          background: createThemeSwatchBackground(primaryColors.orange),
          label: t('orange'),
          value: 'orange',
        },
        {
          background: createThemeSwatchBackground(primaryColors.gold),
          label: t('gold'),
          value: 'gold',
        },
        {
          background: createThemeSwatchBackground(primaryColors.yellow),
          label: t('yellow'),
          value: 'yellow',
        },
        {
          background: createThemeSwatchBackground(primaryColors.lime),
          label: t('lime'),
          value: 'lime',
        },
        {
          background: createThemeSwatchBackground(primaryColors.green),
          label: t('green'),
          value: 'green',
        },
        {
          background: createThemeSwatchBackground(primaryColors.cyan),
          label: t('cyan'),
          value: 'cyan',
        },
        {
          background: createThemeSwatchBackground(primaryColors.blue),
          label: t('blue'),
          value: 'blue',
        },
        {
          background: createThemeSwatchBackground(primaryColors.geekblue),
          label: t('geekblue'),
          value: 'geekblue',
        },
        {
          background: createThemeSwatchBackground(primaryColors.purple),
          label: t('purple'),
          value: 'purple',
        },
        {
          background: createThemeSwatchBackground(primaryColors.magenta),
          label: t('magenta'),
          value: 'magenta',
        },
        {
          background: createThemeSwatchBackground(primaryColors.volcano),
          label: t('volcano'),
          value: 'volcano',
        },
      ]}
      onChange={(next) => onChange?.(next as PrimaryColors | '')}
    />
  );
});

export default ThemeSwatchesPrimary;
