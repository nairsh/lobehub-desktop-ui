'use client';

import { Flexbox, stopPropagation } from '@lobehub/ui';
import { Segmented } from 'antd';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useModelReasoning } from '@/features/ModelSwitchPanel/hooks/useModelReasoning';
import type { LobeAgentChatConfig } from '@/types/agent';
import { formatReasoningLabel } from '@/utils/modelReasoning';

import { styles as panelStyles } from '../styles';

// Abbreviated labels for the compact segmented control; full labels used elsewhere
const SEGMENT_ABBREV: Partial<Record<string, string>> = {
  medium: 'Med',
  minimal: 'Min',
};

const labelStyles = createStaticStyles(({ css, cssVar }) => ({
  label: css`
    font-size: 11px;
    font-weight: 500;
    color: ${cssVar.colorTextTertiary};
    text-transform: uppercase;
    letter-spacing: 0.04em;
  `,
}));

interface ReasoningFooterProps {
  chatConfig?: Partial<LobeAgentChatConfig>;
  model?: string;
  onChatConfigChange: (config: Partial<LobeAgentChatConfig>) => void;
  provider?: string;
}

const ReasoningFooter = memo<ReasoningFooterProps>(
  ({ chatConfig, model = '', onChatConfigChange, provider = '' }) => {
    const { t } = useTranslation('chat');
    const reasoning = useModelReasoning(model, provider, chatConfig);

    if (!reasoning) return null;

    const options = reasoning.levels.map((level) => ({
      label: SEGMENT_ABBREV[level] ?? formatReasoningLabel(level),
      value: level,
    }));

    return (
      // Prevent clicks inside the footer from closing the dropdown
      <Flexbox
        className={panelStyles.footer}
        gap={8}
        padding="10px 12px"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
      >
        <span className={labelStyles.label}>{t(reasoning.titleKey, 'Reasoning')}</span>
        <Segmented
          block
          options={options}
          size="small"
          value={reasoning.value}
          onChange={(value) => onChatConfigChange({ [reasoning.configKey]: value as string })}
        />
      </Flexbox>
    );
  },
);

ReasoningFooter.displayName = 'ReasoningFooter';

export default ReasoningFooter;
