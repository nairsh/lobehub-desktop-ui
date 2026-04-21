import { Button, Flexbox, Icon, Popover, Skeleton, Text, toast, Tooltip } from '@lobehub/ui';
import { Form, Input } from 'antd';
import { createStaticStyles } from 'antd-style';
import { ServerIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { openTerminalService } from '@/services/electron/openTerminal';

const styles = createStaticStyles(({ css, cssVar }) => ({
  button: css`
    cursor: pointer;

    display: flex;
    gap: 6px;
    align-items: center;

    height: 28px;
    padding-inline: 8px;
    border-radius: 6px;

    font-size: 12px;
    color: ${cssVar.colorTextSecondary};

    transition: all 0.2s;

    &:hover {
      color: ${cssVar.colorText};
      background: ${cssVar.colorFillSecondary};
    }
  `,
  content: css`
    width: 320px;
    padding: 8px;
  `,
  description: css`
    margin-block-end: 8px;
  `,
  footer: css`
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-block-start: 12px;
  `,
}));

interface FormValues {
  apiKey?: string;
  baseUrl: string;
}

const OpenTerminalConfigButton = memo(() => {
  const { t } = useTranslation('chat');
  const [form] = Form.useForm<FormValues>();
  const [config, setConfig] = useState<FormValues>({ apiKey: '', baseUrl: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const nextConfig = await openTerminalService.getConfig();
      const values = {
        apiKey: nextConfig.apiKey || '',
        baseUrl: nextConfig.baseUrl || '',
      };
      setConfig(values);
      form.setFieldsValue(values);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const hostLabel = useMemo(() => {
    if (!config.baseUrl) return t('runtimeEnv.cloudConfig.notConfigured');

    try {
      return new URL(config.baseUrl).host;
    } catch {
      return config.baseUrl;
    }
  }, [config.baseUrl, t]);

  const handleClear = useCallback(async () => {
    try {
      setIsSaving(true);
      await openTerminalService.clearConfig();
      const nextConfig = { apiKey: '', baseUrl: '' };
      setConfig(nextConfig);
      form.setFieldsValue(nextConfig);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSaving(false);
    }
  }, [form]);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      const values = await form.validateFields();
      const nextConfig = await openTerminalService.setConfig(values);
      const normalized = {
        apiKey: nextConfig.apiKey || '',
        baseUrl: nextConfig.baseUrl || '',
      };

      setConfig(normalized);
      form.setFieldsValue(normalized);
      setIsOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsSaving(false);
    }
  }, [form]);

  const content = isLoading ? (
    <div className={styles.content}>
      <Skeleton active paragraph={{ rows: 3 }} title={false} />
    </div>
  ) : (
    <div className={styles.content}>
      <Text className={styles.description} fontSize={12} type={'secondary'}>
        {t('runtimeEnv.cloudConfig.description')}
      </Text>
      <Form<FormValues> form={form} layout="vertical">
        <Form.Item
          label={t('runtimeEnv.cloudConfig.urlLabel')}
          name="baseUrl"
          rules={[{ required: true, message: t('runtimeEnv.cloudConfig.urlRequired') }]}
        >
          <Input placeholder="https://open-terminal.example.com" />
        </Form.Item>
        <Form.Item label={t('runtimeEnv.cloudConfig.apiKeyLabel')} name="apiKey">
          <Input.Password placeholder={t('runtimeEnv.cloudConfig.apiKeyPlaceholder')} />
        </Form.Item>
      </Form>
      <div className={styles.footer}>
        <Button disabled={isSaving} onClick={handleClear}>
          {t('runtimeEnv.cloudConfig.clear')}
        </Button>
        <Button loading={isSaving} type={'primary'} onClick={handleSave}>
          {t('runtimeEnv.cloudConfig.save')}
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      open={isOpen}
      placement="bottomLeft"
      styles={{ content: { padding: 0 } }}
      trigger="click"
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) void loadConfig();
      }}
    >
      <Tooltip title={config.baseUrl || t('runtimeEnv.cloudConfig.notConfigured')}>
        <Flexbox horizontal align={'center'} className={styles.button} gap={6}>
          <Icon icon={ServerIcon} size={14} />
          <span>{hostLabel}</span>
        </Flexbox>
      </Tooltip>
    </Popover>
  );
});

OpenTerminalConfigButton.displayName = 'OpenTerminalConfigButton';

export default OpenTerminalConfigButton;
