import type { NeutralColors } from '@lobehub/ui';
import { neutralColors } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { createNeutralSwatchBackground, defaultThemeSwatchBackground } from '@/utils/customTheme';

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
          background: createNeutralSwatchBackground(neutralColors.mauve),
          label: t('mauve'),
          value: 'mauve',
        },
        {
          background: createNeutralSwatchBackground(neutralColors.olive),
          label: t('olive'),
          value: 'olive',
        },
        {
          background: createNeutralSwatchBackground(neutralColors.sage),
          label: t('sage'),
          value: 'sage',
        },
        {
          background: createNeutralSwatchBackground(neutralColors.sand),
          label: t('sand'),
          value: 'sand',
        },
        {
          background: createNeutralSwatchBackground(neutralColors.slate),
          label: t('slate'),
          value: 'slate',
        },
      ]}
      onChange={(next) => onChange?.(next as NeutralColors | '')}
    />
  );
});

export default ThemeSwatchesNeutral;
