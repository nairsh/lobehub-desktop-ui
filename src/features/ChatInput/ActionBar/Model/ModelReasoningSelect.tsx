'use client';

import { Select } from 'antd';
import { createStaticStyles } from 'antd-style';
import { memo, useMemo } from 'react';

import { useUpdateAgentConfig } from '@/features/ChatInput/hooks/useUpdateAgentConfig';
import { useModelReasoning } from '@/features/ModelSwitchPanel/hooks/useModelReasoning';
import { formatReasoningLabel } from '@/utils/modelReasoning';

const styles = createStaticStyles(({ css, cssVar }) => ({
  select: css`
    min-width: 84px;

    .ant-select-selector {
      padding-inline: 10px 8px !important;
      border: 1px solid ${cssVar.colorBorderSecondary} !important;
      border-radius: 18px !important;

      background: ${cssVar.colorFillQuaternary} !important;
      box-shadow: none !important;
    }

    .ant-select-selection-item {
      font-size: 12px;
      font-weight: 500;
      color: ${cssVar.colorTextSecondary};
    }

    &.ant-select-focused .ant-select-selector,
    &:hover .ant-select-selector {
      border-color: ${cssVar.colorPrimaryBorderHover} !important;
      background: ${cssVar.colorPrimaryBg} !important;
    }
  `,
}));

interface ModelReasoningSelectProps {
  model: string;
  provider: string;
}

const ModelReasoningSelect = memo<ModelReasoningSelectProps>(({ model, provider }) => {
  const { updateAgentChatConfig } = useUpdateAgentConfig();
  const reasoning = useModelReasoning(model, provider);

  const options = useMemo(
    () =>
      reasoning?.levels.map((level) => ({
        label: formatReasoningLabel(level),
        value: level,
      })) ?? [],
    [reasoning?.levels],
  );

  if (!reasoning) return null;

  return (
    <Select
      className={styles.select}
      options={options}
      size={'small'}
      value={reasoning.value}
      variant={'borderless'}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onChange={async (value) => {
        await updateAgentChatConfig({ [reasoning.configKey]: value });
      }}
    />
  );
});

ModelReasoningSelect.displayName = 'ModelReasoningSelect';

export default ModelReasoningSelect;
