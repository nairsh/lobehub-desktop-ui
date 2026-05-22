'use client';

import {
  CheckCircleFilled,
  CloseCircleFilled,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { BuiltinRenderProps } from '@lobechat/types';
import { ActionIcon, Flexbox, Text } from '@lobehub/ui';
import { createStaticStyles, cssVar } from 'antd-style';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useChatStore } from '@/store/chat';

import type { ExportFileState } from '../../../types';

const styles = createStaticStyles(({ css }) => ({
  container: css`
    overflow: hidden;
    padding-inline: 8px 0;
  `,
  statusIcon: css`
    font-size: 12px;
  `,
  primaryText: css`
    cursor: pointer;
  `,
}));

interface ExportFileParams {
  path: string;
}

const ExportFile = memo<BuiltinRenderProps<ExportFileParams, ExportFileState>>(
  ({ args, messageId, pluginState }) => {
    const { t } = useTranslation('plugin');
    const isSuccess = pluginState?.success;
    const canPreview = Boolean(isSuccess && pluginState?.previewable && pluginState.fileId);
    const canOpenArtifact = Boolean(isSuccess && pluginState?.artifact);
    const [openArtifact, openFilePreview] = useChatStore((s) => [
      s.openArtifact,
      s.openFilePreview,
    ]);

    const handleDownload = useCallback(async () => {
      if (!pluginState?.downloadUrl || !pluginState?.filename) return;

      try {
        // Fetch the file content to bypass cross-origin download restrictions
        const response = await fetch(pluginState.downloadUrl);
        const blob = await response.blob();

        // Create a blob URL and trigger download
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = pluginState.filename;
        document.body.append(link);
        link.click();
        link.remove();

        // Clean up the blob URL
        URL.revokeObjectURL(blobUrl);
      } catch {
        // Fallback: open in new tab if fetch fails
        window.open(pluginState.downloadUrl, '_blank');
      }
    }, [pluginState?.downloadUrl, pluginState?.filename]);

    const handleOpenArtifact = useCallback(() => {
      if (!pluginState?.artifact) return;

      openArtifact({
        children: pluginState.artifact.content,
        id: messageId,
        identifier: `${messageId}-${pluginState.filename}`,
        language: pluginState.artifact.language,
        title: pluginState.artifact.title,
        type: pluginState.artifact.type,
      });
    }, [messageId, openArtifact, pluginState?.artifact, pluginState?.filename]);

    const handleOpenPreview = useCallback(() => {
      if (!pluginState?.fileId) return;
      openFilePreview({ fileId: pluginState.fileId });
    }, [openFilePreview, pluginState?.fileId]);

    const handlePrimaryAction = useCallback(() => {
      if (canPreview) {
        handleOpenPreview();
        return;
      }

      if (canOpenArtifact) {
        handleOpenArtifact();
        return;
      }

      void handleDownload();
    }, [canOpenArtifact, canPreview, handleDownload, handleOpenArtifact, handleOpenPreview]);

    return (
      <Flexbox className={styles.container} gap={8}>
        <Flexbox horizontal align={'center'} gap={8}>
          {pluginState === undefined ? null : isSuccess ? (
            <CheckCircleFilled
              className={styles.statusIcon}
              style={{ color: cssVar.colorSuccess }}
            />
          ) : (
            <CloseCircleFilled className={styles.statusIcon} style={{ color: cssVar.colorError }} />
          )}
          <Text
            code
            as={'span'}
            className={isSuccess ? styles.primaryText : undefined}
            fontSize={12}
            title={canPreview ? t('builtins.lobe-cloud-sandbox.export.preview') : undefined}
            onClick={isSuccess ? handlePrimaryAction : undefined}
          >
            {isSuccess
              ? t('builtins.lobe-cloud-sandbox.export.exported', {
                  filename: pluginState?.filename || args.path,
                })
              : t('builtins.lobe-cloud-sandbox.export.failed', { path: args.path })}
          </Text>
          {isSuccess && pluginState?.artifact && (
            <ActionIcon
              icon={FileTextOutlined}
              size={'small'}
              title={t('builtins.lobe-cloud-sandbox.export.openArtifact')}
              onClick={handleOpenArtifact}
            />
          )}
          {isSuccess && pluginState?.previewable && pluginState?.fileId && (
            <ActionIcon
              icon={EyeOutlined}
              size={'small'}
              title={t('builtins.lobe-cloud-sandbox.export.preview')}
              onClick={handleOpenPreview}
            />
          )}
          {isSuccess && pluginState?.downloadUrl && (
            <ActionIcon
              icon={DownloadOutlined}
              size={'small'}
              title={t('builtins.lobe-cloud-sandbox.export.download')}
              onClick={handleDownload}
            />
          )}
        </Flexbox>
      </Flexbox>
    );
  },
);

ExportFile.displayName = 'ExportFile';

export default ExportFile;
