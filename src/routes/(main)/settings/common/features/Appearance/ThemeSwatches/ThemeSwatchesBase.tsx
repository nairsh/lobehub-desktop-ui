import { Tooltip } from '@lobehub/ui';
import { createStaticStyles, cx } from 'antd-style';
import chroma from 'chroma-js';
import { CheckIcon } from 'lucide-react';
import { memo } from 'react';

const styles = createStaticStyles(({ css, cssVar }) => ({
  button: css`
    cursor: pointer;

    display: inline-flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: flex-start;

    padding: 0;
    border: 0;

    background: transparent;
  `,
  label: css`
    font-size: 11px;
    line-height: 1;
    color: ${cssVar.colorTextSecondary};
    text-transform: capitalize;
  `,
  preview: css`
    position: relative;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 30px;
    height: 30px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 999px;

    box-shadow:
      inset 0 0 0 1px rgb(255 255 255 / 32%),
      0 2px 8px rgb(0 0 0 / 8%);

    transition:
      transform 150ms ease,
      box-shadow 150ms ease,
      border-color 150ms ease;
  `,
  selected: css`
    transform: translateY(-1px);
    border-color: ${cssVar.colorPrimaryBorderHover};
    box-shadow:
      0 0 0 2px ${cssVar.colorPrimaryBg},
      inset 0 0 0 1px rgb(255 255 255 / 40%),
      0 4px 12px rgb(0 0 0 / 12%);
  `,
}));

interface ThemeSwatchOption<T extends string> {
  background: string;
  label: string;
  value?: T;
}

interface ThemeSwatchesBaseProps<T extends string> {
  onChange?: (value: T | '') => void;
  options: ThemeSwatchOption<T>[];
  value?: T;
}

const getCheckColor = (background: string) => {
  if (background.includes('linear-gradient')) return '#111';

  return chroma(background).luminance() > 0.45 ? '#111' : '#fff';
};

const ThemeSwatchesBase = memo(
  <T extends string>({ options, value, onChange }: ThemeSwatchesBaseProps<T>) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {options.map((option) => {
        const isSelected = option.value === value || (!option.value && !value);

        return (
          <Tooltip key={option.value || 'default'} title={option.label}>
            <button
              aria-label={option.label}
              aria-pressed={isSelected}
              className={styles.button}
              type="button"
              onClick={() => onChange?.((option.value ?? '') as T | '')}
            >
              <span
                className={cx(styles.preview, isSelected && styles.selected)}
                style={{ background: option.background }}
              >
                {isSelected && <CheckIcon color={getCheckColor(option.background)} size={14} />}
              </span>
              <span className={styles.label}>{option.label}</span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  ),
);

ThemeSwatchesBase.displayName = 'ThemeSwatchesBase';

export default ThemeSwatchesBase;
