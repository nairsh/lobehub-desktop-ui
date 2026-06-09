'use client';

import { ModelIcon } from '@lobehub/icons';
import { Tooltip } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { memo } from 'react';

import type { ModelCouncilModelConfig } from '@/types/modelCouncil';

import { dataSelectors, useConversationStore } from '../../../store';
import { type MarkdownElementProps } from '../type';

const styles = createStaticStyles(({ css, cssVar }) => ({
  chip: css`
    cursor: default;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 1.35em;
    height: 1.35em;
    margin-inline: 0.15em;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 50%;

    vertical-align: text-bottom;

    background: ${cssVar.colorBgContainer};

    & svg {
      width: 0.85em;
      height: 0.85em;
    }
  `,
}));

interface ModelCiteProps {
  citeIndex?: number | string;
}

// `councilModels` lets the compareGroup path inject the roster directly; otherwise we
// resolve it from the rendered message's settings snapshot in the store.
const Render = memo<
  MarkdownElementProps<ModelCiteProps> & { councilModels?: ModelCouncilModelConfig[] }
>(({ children, councilModels: overrideModels, id, node }) => {
  const citeIndex = Number(node?.properties?.citeIndex);

  const storeModel = useConversationStore((s) => {
    if (overrideModels) return undefined;

    const message = dataSelectors.getDisplayMessageById(id)(s);
    const meta = (message?.metadata as any) || {};
    const models: ModelCouncilModelConfig[] =
      meta.modelCouncil?.settingsSnapshot?.councilModels ||
      meta.settingsSnapshot?.councilModels ||
      [];

    return models[citeIndex - 1];
  }, isEqual);

  const model = overrideModels ? overrideModels[citeIndex - 1] : storeModel;

  if (!model || !Number.isFinite(citeIndex)) return <>{children}</>;

  const label = model.label || model.model;

  return (
    <Tooltip title={label}>
      <span className={styles.chip}>
        <ModelIcon model={model.model || model.provider} size={14} type={'color'} />
      </span>
    </Tooltip>
  );
});

Render.displayName = 'ModelCiteRender';

export default Render;
