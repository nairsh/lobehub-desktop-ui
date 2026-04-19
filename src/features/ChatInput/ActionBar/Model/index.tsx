import { LoadingOutlined } from '@ant-design/icons';
import { ModelIcon } from '@lobehub/icons';
import { Flexbox, Text } from '@lobehub/ui';
import { Spin } from 'antd';
import { createStaticStyles, cssVar, cx } from 'antd-style';
import { ChevronDown, Settings2Icon } from 'lucide-react';
import { memo, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import ModelSwitchPanel from '@/features/ModelSwitchPanel';
import ModelDetailPanel from '@/features/ModelSwitchPanel/components/ModelDetailPanel';
import { useModelReasoning } from '@/features/ModelSwitchPanel/hooks/useModelReasoning';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors, chatConfigByIdSelectors } from '@/store/agent/selectors';
import { aiModelSelectors, useAiInfraStore } from '@/store/aiInfra';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';

import { useAgentId } from '../../hooks/useAgentId';
import Action from '../components/Action';
import { useActionBarContext } from '../context';
import ModelReasoningSelect from './ModelReasoningSelect';

const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    border-radius: 24px;
    background: ${cssVar.colorFillTertiary};
  `,
  icon: cx(
    'model-switch',
    css`
      display: flex;
      align-items: center;
      justify-content: center;
      transition: scale 400ms cubic-bezier(0.215, 0.61, 0.355, 1);
    `,
  ),
  model: css`
    cursor: pointer;
    border-radius: 24px;

    :hover {
      background: ${cssVar.colorFillSecondary};
    }

    :active {
      .model-switch {
        scale: 0.8;
      }
    }
  `,
  modelWithControl: css`
    border-radius: 24px;

    :hover {
      background: ${cssVar.colorFillTertiary};
    }
  `,
}));

const ModelSwitch = memo(() => {
  const { t } = useTranslation('chat');
  const { dropdownPlacement } = useActionBarContext();
  const isDevMode = useUserStore((s) => userGeneralSettingsSelectors.config(s).isDevMode);

  const agentId = useAgentId();
  const [chatConfig, model, provider, updateAgentConfigById] = useAgentStore((s) => [
    chatConfigByIdSelectors.getChatConfigById(agentId)(s),
    agentByIdSelectors.getAgentModelById(agentId)(s),
    agentByIdSelectors.getAgentModelProviderById(agentId)(s),
    s.updateAgentConfigById,
  ]);

  const isModelHasExtendParams = useAiInfraStore(
    aiModelSelectors.isModelHasExtendParams(model, provider),
  );

  const modelCard = useAiInfraStore(aiModelSelectors.getEnabledModelById(model, provider));
  const reasoning = useModelReasoning(model, provider, chatConfig);
  const modelDisplayName =
    modelCard?.displayName ?? (model.includes('/') ? model.split('/').at(-1)! : model);

  const showExtendParams = isDevMode && isModelHasExtendParams;
  const showModelControls = showExtendParams || !!reasoning;

  const handleModelChange = useCallback(
    async (params: { model: string; provider: string }) => {
      await updateAgentConfigById(agentId, params);
    },
    [agentId, updateAgentConfigById],
  );

  return (
    <Flexbox
      horizontal
      align={'center'}
      className={showModelControls ? styles.container : ''}
      gap={4}
    >
      <ModelSwitchPanel
        showReasoningLabel
        chatConfig={chatConfig}
        model={model}
        placement={dropdownPlacement}
        provider={provider}
        onModelChange={handleModelChange}
      >
        <Flexbox
          horizontal
          align={'center'}
          className={cx(styles.model, showModelControls && styles.modelWithControl)}
          gap={4}
          height={36}
          paddingInline={8}
        >
          <div className={styles.icon}>
            <ModelIcon model={model} size={18} type={'mono'} />
          </div>
          <Text
            ellipsis
            color={cssVar.colorTextSecondary}
            style={{ fontSize: 14, fontWeight: 500 }}
          >
            {modelDisplayName}
          </Text>
          <ChevronDown size={12} style={{ color: cssVar.colorTextTertiary, flexShrink: 0 }} />
        </Flexbox>
      </ModelSwitchPanel>

      {reasoning && <ModelReasoningSelect model={model} provider={provider} />}

      {showExtendParams && (
        <Action
          icon={Settings2Icon}
          showTooltip={false}
          style={{ borderRadius: 24, marginInlineStart: -4 }}
          title={t('extendParams.title')}
          popover={{
            content: (
              <Suspense
                fallback={
                  <Flexbox
                    align={'center'}
                    justify={'center'}
                    style={{ minHeight: 100, width: '100%' }}
                  >
                    <Spin indicator={<LoadingOutlined spin />} />
                  </Flexbox>
                }
              >
                <ModelDetailPanel model={model} provider={provider} />
              </Suspense>
            ),
            maxWidth: 400,
            minWidth: 400,
            placement: 'topLeft',
          }}
        />
      )}
    </Flexbox>
  );
});

ModelSwitch.displayName = 'ModelSwitch';

export default ModelSwitch;
