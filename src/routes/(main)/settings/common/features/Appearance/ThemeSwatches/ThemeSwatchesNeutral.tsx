import type { NeutralColors } from '@lobehub/ui';
import { neutralColors } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { createThemeSwatchBackground, defaultThemeSwatchBackground } from '@/utils/customTheme';

import ThemeSwatchesBase from './ThemeSwatchesBase';

interface IProps {
  onChange?: (v: NeutralColors | '') => void;
  value?: NeutralColors;
}

const ThemeSwatchesNeutral = memo<IProps>(({ value, onChange }) => {
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
          background: createThemeSwatchBackground(neutralColors.mauve),
          label: t('mauve'),
          value: 'mauve',
        },
        {
          background: createThemeSwatchBackground(neutralColors.olive),
          label: t('olive'),
          value: 'olive',
        },
        {
          background: createThemeSwatchBackground(neutralColors.sage),
          label: t('sage'),
          value: 'sage',
        },
        {
          background: createThemeSwatchBackground(neutralColors.sand),
          label: t('sand'),
          value: 'sand',
        },
        {
          background: createThemeSwatchBackground(neutralColors.slate),
          label: t('slate'),
          value: 'slate',
        },
      ]}
      onChange={(next) => onChange?.(next as NeutralColors | '')}
    />
  );
});

export default ThemeSwatchesNeutral;
