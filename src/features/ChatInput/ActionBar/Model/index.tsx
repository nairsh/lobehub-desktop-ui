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
import type { LobeAgentChatConfig } from '@/types/agent';

import { useAgentId } from '../../hooks/useAgentId';
import { useUpdateAgentConfig } from '../../hooks/useUpdateAgentConfig';
import Action from '../components/Action';
import { useActionBarContext } from '../context';

const styles = createStaticStyles(({ css, cssVar }) => ({
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
  reasoningLabel: css`
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 500;
    color: ${cssVar.colorTextTertiary};
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

  const { updateAgentChatConfig } = useUpdateAgentConfig();

  const isModelHasExtendParams = useAiInfraStore(
    aiModelSelectors.isModelHasExtendParams(model, provider),
  );

  const modelCard = useAiInfraStore(aiModelSelectors.getEnabledModelById(model, provider));
  const reasoning = useModelReasoning(model, provider, chatConfig);
  const modelDisplayName =
    modelCard?.displayName ?? (model.includes('/') ? model.split('/').at(-1)! : model);

  const showExtendParams = isDevMode && isModelHasExtendParams;

  const handleModelChange = useCallback(
    async (params: { model: string; provider: string }) => {
      await updateAgentConfigById(agentId, params);
    },
    [agentId, updateAgentConfigById],
  );

  const handleChatConfigChange = useCallback(
    (config: Partial<LobeAgentChatConfig>) => {
      updateAgentChatConfig(config);
    },
    [updateAgentChatConfig],
  );

  return (
    <Flexbox horizontal align={'center'} gap={4}>
      <ModelSwitchPanel
        showReasoningLabel
        chatConfig={chatConfig}
        model={model}
        placement={dropdownPlacement}
        provider={provider}
        onChatConfigChange={handleChatConfigChange}
        onModelChange={handleModelChange}
      >
        <Flexbox
          horizontal
          align={'center'}
          className={styles.model}
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
          {reasoning && reasoning.value !== 'none' && (
            <span className={styles.reasoningLabel}>{reasoning.label}</span>
          )}
          <ChevronDown size={12} style={{ color: cssVar.colorTextTertiary, flexShrink: 0 }} />
        </Flexbox>
      </ModelSwitchPanel>

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
