'use client';

import { Button, Flexbox, Form, Icon, Skeleton, Text } from '@lobehub/ui';
import { Select, Switch } from '@lobehub/ui/base-ui';
import { createStyles } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { Gavel, Loader2Icon, Plus, Trash2 } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FORM_STYLE } from '@/const/layoutTokens';
import ModelSelect from '@/features/ModelSelect';
import { useEnabledChatModels } from '@/hooks/useEnabledChatModels';
import SettingHeader from '@/routes/(main)/settings/features/SettingHeader';
import { useAiInfraStore } from '@/store/aiInfra';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';
import type { ModelCouncilModelConfig, ModelCouncilSettings } from '@/types/modelCouncil';
import { findReasoningConfig, formatReasoningLabel } from '@/utils/modelReasoning';

const DEFAULT_COUNCIL: ModelCouncilSettings = {
  councilModels: [],
  enabled: false,
  maxModels: 3,
  perModelTimeoutMs: 90_000,
  judgeTimeoutMs: 120_000,
  showIntermediates: 'collapsed',
  webSearch: 'judge',
};

const DEFAULT_PERSONALITY_IDS = [
  'analyst',
  'skeptic',
  'creative',
  'pragmatic',
  'researcher',
  'risk',
];

const useStyles = createStyles(({ css, token }) => ({
  modelRow: css`
    padding-block: 8px;
    padding-inline: 12px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 10px;

    background: ${token.colorBgContainer};
  `,
  muted: css`
    color: ${token.colorTextTertiary};
  `,
  nameCol: css`
    flex-shrink: 0;
    max-width: 180px;
  `,
  personaSelect: css`
    flex: 1;
    min-width: 0;
  `,
}));

const modelKey = (item: Pick<ModelCouncilModelConfig, 'provider' | 'model'>) =>
  `${item.provider}/${item.model}`;

const Page = memo(() => {
  const { t } = useTranslation('setting');
  const { styles } = useStyles();
  const enabledModels = useEnabledChatModels();
  const enabledAiModels = useAiInfraStore((s) => s.enabledAiModels, isEqual);
  const [loading, setLoading] = useState(false);
  const [pendingModel, setPendingModel] = useState<ModelCouncilModelConfig | undefined>();
  const [settings, setSettings, isUserStateInit] = useUserStore(
    (s) => [
      ((settingsSelectors.currentSettings(s) as any).modelCouncil ||
        DEFAULT_COUNCIL) as ModelCouncilSettings,
      s.setSettings,
      s.isUserStateInit,
    ],
    isEqual,
  );

  const council = useMemo(() => ({ ...DEFAULT_COUNCIL, ...settings }), [settings]);

  const flatModels = useMemo(
    () =>
      enabledModels.flatMap((provider) =>
        provider.children.map((model) => {
          const enabledModel = enabledAiModels?.find(
            (item) => item.id === model.id && item.providerId === provider.id,
          );

          return {
            displayName: (model as any).displayName || model.id,
            id: model.id,
            provider: provider.id,
            providerName: provider.name,
            reasoning: Boolean((model as any).abilities?.reasoning),
            reasoningConfig: findReasoningConfig(
              (model as any).settings?.extendParams || enabledModel?.settings?.extendParams,
            ),
          };
        }),
      ),
    [enabledAiModels, enabledModels],
  );

  const save = useCallback(
    async (next: ModelCouncilSettings) => {
      setLoading(true);
      try {
        await setSettings({ modelCouncil: next } as any);
      } finally {
        setLoading(false);
      }
    },
    [setSettings],
  );

  const selectedKeys = useMemo(() => new Set(council.councilModels.map(modelKey)), [council]);

  const personalityOptions = useMemo(
    () => [
      { label: t('modelCouncil.personality.analyst'), value: 'analyst' },
      { label: t('modelCouncil.personality.skeptic'), value: 'skeptic' },
      { label: t('modelCouncil.personality.creative'), value: 'creative' },
      { label: t('modelCouncil.personality.pragmatic'), value: 'pragmatic' },
      { label: t('modelCouncil.personality.researcher'), value: 'researcher' },
      { label: t('modelCouncil.personality.risk'), value: 'risk' },
    ],
    [t],
  );

  const getDefaultPersonalityId = useCallback(
    (index: number) => DEFAULT_PERSONALITY_IDS[index % DEFAULT_PERSONALITY_IDS.length],
    [],
  );

  const addModel = useCallback(async () => {
    if (
      !pendingModel ||
      selectedKeys.has(modelKey(pendingModel)) ||
      council.councilModels.length >= 6
    )
      return;

    await save({
      ...council,
      councilModels: [
        ...council.councilModels,
        {
          ...pendingModel,
          personalityId:
            pendingModel.personalityId || getDefaultPersonalityId(council.councilModels.length),
        },
      ],
    });
    setPendingModel(undefined);
  }, [council, getDefaultPersonalityId, pendingModel, save, selectedKeys]);

  const removeModel = useCallback(
    async (model: ModelCouncilModelConfig) => {
      await save({
        ...council,
        councilModels: council.councilModels.filter((item) => modelKey(item) !== modelKey(model)),
      });
    },
    [council, save],
  );

  const updateModelReasoning = useCallback(
    async (target: ModelCouncilModelConfig, reasoning: boolean) => {
      const fullModel = flatModels.find(
        (model) => model.provider === target.provider && model.id === target.model,
      );
      const reasoningConfig = fullModel?.reasoningConfig;

      await save({
        ...council,
        councilModels: council.councilModels.map((item) =>
          modelKey(item) === modelKey(target)
            ? {
                ...item,
                reasoning,
                reasoningLevel: reasoning
                  ? item.reasoningLevel || reasoningConfig?.defaultValue
                  : undefined,
                reasoningParam: reasoning ? reasoningConfig?.extendParam : undefined,
              }
            : item,
        ),
      });
    },
    [council, flatModels, save],
  );

  const updateModelReasoningLevel = useCallback(
    async (target: ModelCouncilModelConfig, reasoningLevel: string) => {
      const fullModel = flatModels.find(
        (model) => model.provider === target.provider && model.id === target.model,
      );
      const reasoningConfig = fullModel?.reasoningConfig;

      await save({
        ...council,
        councilModels: council.councilModels.map((item) =>
          modelKey(item) === modelKey(target)
            ? {
                ...item,
                reasoning: true,
                reasoningLevel,
                reasoningParam: reasoningConfig?.extendParam,
              }
            : item,
        ),
      });
    },
    [council, flatModels, save],
  );

  const updateModelPersonality = useCallback(
    async (target: ModelCouncilModelConfig, personalityId: string) => {
      await save({
        ...council,
        councilModels: council.councilModels.map((item) =>
          modelKey(item) === modelKey(target) ? { ...item, personalityId } : item,
        ),
      });
    },
    [council, save],
  );

  if (!isUserStateInit) return <Skeleton active paragraph={{ rows: 5 }} title={false} />;

  return (
    <>
      <SettingHeader title={t('tab.modelCouncil')} />
      <Form
        collapsible={false}
        itemsType={'group'}
        variant={'filled'}
        items={[
          {
            extra: loading && <Icon spin icon={Loader2Icon} size={16} style={{ opacity: 0.5 }} />,
            children: [
              {
                children: (
                  <Switch
                    checked={council.enabled}
                    onChange={(enabled) => save({ ...council, enabled })}
                  />
                ),
                desc: t('modelCouncil.settings.enabled.desc'),
                label: t('modelCouncil.settings.enabled.title'),
                minWidth: undefined,
              },
              {
                children: (
                  <Flexbox gap={8}>
                    <Flexbox horizontal align={'center'} gap={8}>
                      <ModelSelect
                        initialWidth
                        excludeValues={[...selectedKeys]}
                        placeholder={t('modelCouncil.settings.models.placeholder')}
                        value={pendingModel}
                        onChange={(model) => {
                          const found = flatModels.find(
                            (item) => item.provider === model.provider && item.id === model.model,
                          );
                          setPendingModel({
                            label: found?.displayName || model.model,
                            model: model.model,
                            provider: model.provider,
                            reasoning: found?.reasoning || false,
                            reasoningLevel: found?.reasoningConfig?.defaultValue,
                            reasoningParam: found?.reasoningConfig?.extendParam,
                          });
                        }}
                      />
                      <Button
                        icon={<Icon icon={Plus} />}
                        disabled={
                          !pendingModel ||
                          selectedKeys.has(modelKey(pendingModel)) ||
                          council.councilModels.length >= 6
                        }
                        onClick={() => void addModel()}
                      >
                        {t('modelCouncil.settings.models.add')}
                      </Button>
                    </Flexbox>
                    {council.councilModels.map((selectedModel, index) => {
                      const fullModel = flatModels.find(
                        (model) =>
                          model.provider === selectedModel.provider &&
                          model.id === selectedModel.model,
                      );
                      const personalityId =
                        selectedModel.personalityId || getDefaultPersonalityId(index);
                      const reasoningConfig = fullModel?.reasoningConfig;
                      const reasoningLevel =
                        selectedModel.reasoningLevel || reasoningConfig?.defaultValue;

                      return (
                        <Flexbox className={styles.modelRow} gap={8} key={modelKey(selectedModel)}>
                          <Flexbox horizontal align={'center'} gap={10}>
                            <Flexbox className={styles.nameCol} gap={0}>
                              <Text ellipsis fontSize={13} weight={500}>
                                {selectedModel.label ||
                                  fullModel?.displayName ||
                                  selectedModel.model}
                              </Text>
                              <Text ellipsis className={styles.muted} fontSize={12}>
                                {fullModel?.providerName || selectedModel.provider}
                              </Text>
                            </Flexbox>
                            <Select
                              className={styles.personaSelect}
                              options={personalityOptions}
                              value={personalityId}
                              onChange={(value) => updateModelPersonality(selectedModel, value)}
                            />
                          </Flexbox>
                          <Flexbox horizontal align={'center'} gap={8} justify={'flex-end'}>
                            {fullModel?.reasoning && (
                              <>
                                <Text className={styles.muted} fontSize={12}>
                                  {t('modelCouncil.settings.models.reasoning')}
                                </Text>
                                <Switch
                                  checked={selectedModel.reasoning}
                                  onChange={(reasoning) =>
                                    updateModelReasoning(selectedModel, reasoning)
                                  }
                                />
                                {selectedModel.reasoning && reasoningConfig && (
                                  <Select
                                    size={'small'}
                                    value={reasoningLevel}
                                    options={reasoningConfig.levels.map((level) => ({
                                      label: formatReasoningLabel(level),
                                      value: level,
                                    }))}
                                    onChange={(level) =>
                                      updateModelReasoningLevel(selectedModel, level)
                                    }
                                  />
                                )}
                              </>
                            )}
                            <Button
                              icon={<Icon icon={Trash2} />}
                              size={'small'}
                              title={t('modelCouncil.settings.models.remove')}
                              onClick={() => void removeModel(selectedModel)}
                            />
                          </Flexbox>
                        </Flexbox>
                      );
                    })}
                  </Flexbox>
                ),
                desc: t('modelCouncil.settings.models.desc', {
                  count: council.councilModels.length,
                  max: 6,
                }),
                label: t('modelCouncil.settings.models.title'),
              },
              {
                children: (
                  <ModelSelect
                    initialWidth
                    value={council.judgeModel}
                    onChange={(judgeModel) => save({ ...council, judgeModel })}
                  />
                ),
                desc: t('modelCouncil.settings.judge.desc'),
                label: t('modelCouncil.settings.judge.title'),
              },
              {
                children: (
                  <Select
                    value={council.webSearch || 'judge'}
                    options={[
                      { label: t('modelCouncil.settings.webSearch.judge'), value: 'judge' },
                      { label: t('modelCouncil.settings.webSearch.all'), value: 'all' },
                      { label: t('modelCouncil.settings.webSearch.off'), value: 'off' },
                    ]}
                    onChange={(webSearch) => save({ ...council, webSearch })}
                  />
                ),
                desc: t('modelCouncil.settings.webSearch.desc'),
                label: t('modelCouncil.settings.webSearch.title'),
              },
            ],
            title: (
              <Flexbox horizontal align={'center'} gap={8}>
                <Icon icon={Gavel} size={18} />
                {t('modelCouncil.settings.title')}
              </Flexbox>
            ),
          },
        ]}
        {...FORM_STYLE}
      />
    </>
  );
});

export default Page;
