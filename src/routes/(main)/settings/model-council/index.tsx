'use client';

import { Button, Flexbox, Form, Icon, Skeleton, Text } from '@lobehub/ui';
import { Switch } from '@lobehub/ui/base-ui';
import { createStyles } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { Gavel, Loader2Icon, Plus, Trash2 } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FORM_STYLE } from '@/const/layoutTokens';
import ModelSelect from '@/features/ModelSelect';
import { useEnabledChatModels } from '@/hooks/useEnabledChatModels';
import SettingHeader from '@/routes/(main)/settings/features/SettingHeader';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';
import type { ModelCouncilModelConfig, ModelCouncilSettings } from '@/types/modelCouncil';

const DEFAULT_COUNCIL: ModelCouncilSettings = {
  councilModels: [],
  enabled: false,
  maxModels: 3,
  perModelTimeoutMs: 90_000,
  judgeTimeoutMs: 120_000,
  showIntermediates: 'collapsed',
};

const useStyles = createStyles(({ css, token }) => ({
  modelRow: css`
    padding-block: 10px;
    padding-inline: 12px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 8px;

    background: ${token.colorBgContainer};
  `,
  muted: css`
    color: ${token.colorTextTertiary};
  `,
}));

const modelKey = (item: Pick<ModelCouncilModelConfig, 'provider' | 'model'>) =>
  `${item.provider}/${item.model}`;

const Page = memo(() => {
  const { t } = useTranslation('setting');
  const { styles } = useStyles();
  const enabledModels = useEnabledChatModels();
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
        provider.children.map((model) => ({
          displayName: (model as any).displayName || model.id,
          id: model.id,
          provider: provider.id,
          providerName: provider.name,
          reasoning: Boolean((model as any).abilities?.reasoning),
        })),
      ),
    [enabledModels],
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

  const addModel = useCallback(async () => {
    if (
      !pendingModel ||
      selectedKeys.has(modelKey(pendingModel)) ||
      council.councilModels.length >= 6
    )
      return;

    await save({ ...council, councilModels: [...council.councilModels, pendingModel] });
    setPendingModel(undefined);
  }, [council, pendingModel, save, selectedKeys]);

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
      await save({
        ...council,
        councilModels: council.councilModels.map((item) =>
          modelKey(item) === modelKey(target) ? { ...item, reasoning } : item,
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
                    {council.councilModels.map((selectedModel) => {
                      const fullModel = flatModels.find(
                        (model) =>
                          model.provider === selectedModel.provider &&
                          model.id === selectedModel.model,
                      );

                      return (
                        <Flexbox
                          horizontal
                          align={'center'}
                          className={styles.modelRow}
                          gap={12}
                          justify={'space-between'}
                          key={modelKey(selectedModel)}
                        >
                          <Flexbox gap={2}>
                            <Text>
                              {selectedModel.label || fullModel?.displayName || selectedModel.model}
                            </Text>
                            <Text className={styles.muted} type={'secondary'}>
                              {fullModel?.providerName || selectedModel.provider}
                            </Text>
                          </Flexbox>
                          <Flexbox horizontal align={'center'} gap={8}>
                            {fullModel?.reasoning && (
                              <Switch
                                checked={selectedModel.reasoning}
                                onChange={(reasoning) =>
                                  updateModelReasoning(selectedModel, reasoning)
                                }
                              />
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
