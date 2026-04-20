'use client';

import { ToolNameResolver } from '@lobechat/context-engine';
import { pluginPrompts } from '@lobechat/prompts';
import { Center, Flexbox, Tooltip } from '@lobehub/ui';
import { Progress } from 'antd';
import { cssVar } from 'antd-style';
import numeral from 'numeral';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import ActionPopover from '@/features/ChatInput/ActionBar/components/ActionPopover';
import TokenProgress from '@/features/ChatInput/ActionBar/Token/TokenProgress';
import { useAgentId } from '@/features/ChatInput/hooks/useAgentId';
import { createAgentToolsEngine } from '@/helpers/toolEngineering';
import { useModelContextWindowTokens } from '@/hooks/useModelContextWindowTokens';
import { useModelSupportToolUse } from '@/hooks/useModelSupportToolUse';
import { useTokenCount } from '@/hooks/useTokenCount';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors, chatConfigByIdSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { topicSelectors } from '@/store/chat/selectors';
import { useToolStore } from '@/store/tool';
import { pluginHelpers } from '@/store/tool/helpers';

const toolNameResolver = new ToolNameResolver();

const CIRCLE_SIZE = 18;

const getStrokeColor = (percent: number): string => {
  if (percent >= 60) return cssVar.colorError;
  if (percent >= 50) return cssVar.colorWarning;
  return cssVar.colorSuccess;
};

interface CircleContentProps {
  total: string;
}

const CircleContent = memo<CircleContentProps>(({ total: messageString }) => {
  const { t } = useTranslation(['chat', 'components']);

  const [input, historySummary] = useChatStore((s) => [
    s.inputMessage,
    topicSelectors.currentActiveTopicSummary(s)?.content || '',
  ]);

  const agentId = useAgentId();
  const [systemRole, model, provider] = useAgentStore((s) => {
    return [
      agentByIdSelectors.getAgentSystemRoleById(agentId)(s),
      agentByIdSelectors.getAgentModelById(agentId)(s),
      agentByIdSelectors.getAgentModelProviderById(agentId)(s),
      // subscribe to re-render on history config changes
      chatConfigByIdSelectors.getHistoryCountById(agentId)(s),
      chatConfigByIdSelectors.getEnableHistoryCountById(agentId)(s),
    ];
  });

  const maxTokens = useModelContextWindowTokens(model, provider);

  const canUseTool = useModelSupportToolUse(model, provider);
  const pluginIds = useAgentStore((s) => agentByIdSelectors.getAgentPluginsById(agentId)(s));

  const toolsString = useToolStore(() => {
    const toolsEngine = createAgentToolsEngine({ model, provider });

    const { tools, enabledManifests } = toolsEngine.generateToolsDetailed({
      model,
      provider,
      toolIds: pluginIds,
    });
    const schemaNumber = tools?.map((i) => JSON.stringify(i)).join('') || '';

    const toolsSystemRole =
      enabledManifests.length > 0
        ? pluginPrompts({
            tools: enabledManifests.map((manifest) => ({
              apis: manifest.api.map((api) => ({
                desc: api.description,
                name: toolNameResolver.generate(manifest.identifier, api.name, manifest.type),
              })),
              identifier: manifest.identifier,
              name: pluginHelpers.getPluginTitle(manifest.meta) || manifest.identifier,
              systemRole: manifest.systemRole,
            })),
          })
        : '';

    return toolsSystemRole + schemaNumber;
  });

  const toolsToken = useTokenCount(canUseTool ? toolsString : '');

  const inputTokenCount = useTokenCount(input);
  const chatsToken = useTokenCount(messageString) + inputTokenCount;

  const systemRoleToken = useTokenCount(systemRole);
  const historySummaryToken = useTokenCount(historySummary);

  const totalToken = systemRoleToken + historySummaryToken + toolsToken + chatsToken;

  const percent = useMemo(() => {
    if (!maxTokens || maxTokens <= 0) return 0;
    return Math.min(100, (totalToken / maxTokens) * 100);
  }, [totalToken, maxTokens]);

  const strokeColor = getStrokeColor(percent);

  const content = (
    <Flexbox gap={12} style={{ minWidth: 220 }}>
      <Flexbox horizontal align={'center'} gap={4} justify={'space-between'} width={'100%'}>
        <div style={{ color: cssVar.colorTextDescription }}>{t('tokenDetails.title')}</div>
        <Tooltip
          styles={{ root: { maxWidth: 'unset', pointerEvents: 'none' } }}
          title={t('ModelSelect.featureTag.tokens', {
            ns: 'components',
            tokens: numeral(maxTokens).format('0,0'),
          })}
        >
          <Center
            height={20}
            paddingInline={4}
            style={{
              background: cssVar.colorFillTertiary,
              borderRadius: 4,
              color: cssVar.colorTextSecondary,
              fontFamily: cssVar.fontFamilyCode,
              fontSize: 11,
            }}
          >
            TOKEN
          </Center>
        </Tooltip>
      </Flexbox>
      <TokenProgress
        showIcon
        data={[
          {
            color: cssVar.magenta,
            id: 'systemRole',
            title: t('tokenDetails.systemRole'),
            value: systemRoleToken,
          },
          {
            color: cssVar.geekblue,
            id: 'tools',
            title: t('tokenDetails.tools'),
            value: toolsToken,
          },
          {
            color: cssVar.orange,
            id: 'historySummary',
            title: t('tokenDetails.historySummary'),
            value: historySummaryToken,
          },
          {
            color: cssVar.gold,
            id: 'chats',
            title: t('tokenDetails.chats'),
            value: chatsToken,
          },
        ]}
      />
      <TokenProgress
        showTotal={t('tokenDetails.total')}
        data={[
          {
            color: strokeColor,
            id: 'used',
            title: t('tokenDetails.used'),
            value: totalToken,
          },
          {
            color: cssVar.colorFill,
            id: 'rest',
            title: t('tokenDetails.rest'),
            value: Math.max(0, maxTokens - totalToken),
          },
        ]}
      />
    </Flexbox>
  );

  return (
    <ActionPopover content={content} placement={'top'}>
      <Center
        aria-label={t('tokenTag.used')}
        role={'img'}
        style={{ cursor: 'pointer', height: CIRCLE_SIZE, width: CIRCLE_SIZE }}
      >
        <Progress
          percent={percent}
          showInfo={false}
          size={CIRCLE_SIZE}
          strokeColor={strokeColor}
          strokeWidth={10}
          type={'circle'}
        />
      </Center>
    </ActionPopover>
  );
});

CircleContent.displayName = 'ContextWindowCircleContent';

export default CircleContent;
