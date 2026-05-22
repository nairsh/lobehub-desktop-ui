import { ActionIcon, Flexbox, Text } from '@lobehub/ui';
import { App, Input } from 'antd';
import { createStaticStyles } from 'antd-style';
import { DownloadIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { type MouseEvent } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import FileIcon from '@/components/FileIcon';
import { useChatStore } from '@/store/chat';
import { useFileStore } from '@/store/file';
import { downloadFile } from '@/utils/client/downloadFile';
import { formatSize } from '@/utils/format';

import { type PortalFileItem } from '../utils';

const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    cursor: pointer;

    overflow: hidden;

    max-width: 420px;
    padding-block: 8px;
    padding-inline: 12px;
    border-radius: 8px;

    background: ${cssVar.colorFillTertiary};

    &:hover {
      background: ${cssVar.colorFillSecondary};
    }
  `,
  meta: css`
    min-width: 0;
  `,
  name: css`
    font-size: 13px;
  `,
}));

const FileItem = memo<PortalFileItem>(({ name, fileType, size, id, isChatAttachment, url }) => {
  const { t } = useTranslation('portal');
  const { message, modal } = App.useApp();
  const openFilePreview = useChatStore((s) => s.openFilePreview);
  const [removeFileItem, renameFileItem] = useFileStore((s) => [
    s.removeFileItem,
    s.renameFileItem,
  ]);

  const handleDownload = async (e: MouseEvent) => {
    e.stopPropagation();
    if (!url) return;

    await downloadFile(url, name);
  };

  const handleRename = (e: MouseEvent) => {
    e.stopPropagation();
    let nextName = name;

    modal.confirm({
      centered: true,
      content: (
        <Input
          autoFocus
          defaultValue={name}
          onChange={(event) => {
            nextName = event.target.value;
          }}
        />
      ),
      okText: t('files.rename'),
      onOk: async () => {
        const trimmedName = nextName.trim();
        if (!trimmedName || trimmedName === name) return;

        await renameFileItem(id, trimmedName);
        message.success(t('files.renameSuccess'));
      },
      title: t('files.renameTitle'),
    });
  };

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();

    modal.confirm({
      centered: true,
      okButtonProps: { danger: true },
      okText: t('files.delete'),
      onOk: async () => {
        await removeFileItem(id);
        message.success(t('files.deleteSuccess'));
      },
      title: t('files.confirmDelete'),
    });
  };

  return (
    <Flexbox
      horizontal
      align={'center'}
      className={styles.container}
      gap={8}
      onClick={() => {
        openFilePreview({ fileId: id });
      }}
    >
      <FileIcon fileName={name} fileType={fileType} />
      <Flexbox className={styles.meta} flex={1}>
        <Text className={styles.name} ellipsis={{ tooltip: true }}>
          {name}
        </Text>
        <Text type={'secondary'}>
          {formatSize(size)}
          {isChatAttachment ? ` · ${t('files.chatAttachment')}` : ''}
        </Text>
      </Flexbox>
      {url && (
        <ActionIcon
          icon={DownloadIcon}
          size={'small'}
          title={t('files.download')}
          onClick={handleDownload}
        />
      )}
      {!isChatAttachment && (
        <>
          <ActionIcon
            icon={PencilIcon}
            size={'small'}
            title={t('files.rename')}
            onClick={handleRename}
          />
          <ActionIcon
            icon={Trash2Icon}
            size={'small'}
            title={t('files.delete')}
            onClick={handleDelete}
          />
        </>
      )}
    </Flexbox>
  );
});

export default FileItem;
