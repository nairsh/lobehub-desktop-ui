'use client';

import { Checkbox, Flexbox, Form, Icon, InputNumber, Skeleton, Text } from '@lobehub/ui';
import { Switch } from '@lobehub/ui/base-ui';
import { createStyles } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { Gavel, Loader2Icon } from 'lucide-react';
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

  const selectedKeys = new Set(council.councilModels.map(modelKey));

  const toggleModel = useCallback(
    async (model: ModelCouncilModelConfig, checked: boolean) => {
      const nextModels = checked
        ? [...council.councilModels, model].slice(0, 6)
        : council.councilModels.filter((item) => modelKey(item) !== modelKey(model));

      await save({ ...council, councilModels: nextModels });
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
                    nativeButton
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
                    {flatModels.map((model) => {
                      const selected = selectedKeys.has(`${model.provider}/${model.id}`);
                      const disabled = !selected && council.councilModels.length >= 6;
                      return (
                        <Flexbox
                          horizontal
                          align={'center'}
                          className={styles.modelRow}
                          gap={12}
                          justify={'space-between'}
                          key={`${model.provider}/${model.id}`}
                        >
                          <Checkbox
                            checked={selected}
                            disabled={disabled}
                            onChange={(checked) =>
                              toggleModel(
                                {
                                  label: model.displayName,
                                  model: model.id,
                                  provider: model.provider,
                                },
                                checked.target.checked,
                              )
                            }
                          >
                            <Flexbox gap={2}>
                              <Text>{model.displayName}</Text>
                              <Text className={styles.muted} type={'secondary'}>
                                {model.providerName}
                              </Text>
                            </Flexbox>
                          </Checkbox>
                          {selected && model.reasoning && (
                            <Switch
                              nativeButton
                              checked={
                                council.councilModels.find(
                                  (item) => modelKey(item) === `${model.provider}/${model.id}`,
                                )?.reasoning
                              }
                              onChange={(reasoning) =>
                                updateModelReasoning(
                                  { model: model.id, provider: model.provider },
                                  reasoning,
                                )
                              }
                            />
                          )}
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
                  <InputNumber
                    max={6}
                    min={2}
                    value={council.maxModels}
                    onChange={(maxModels) =>
                      save({ ...council, maxModels: Number(maxModels || 3) })
                    }
                  />
                ),
                desc: t('modelCouncil.settings.maxModels.desc'),
                label: t('modelCouncil.settings.maxModels.title'),
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
