import { ActionIcon, Flexbox, Skeleton, Text } from '@lobehub/ui';
import { App, Input } from 'antd';
import { ArrowLeft, DownloadIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/selectors';
import { useFileStore } from '@/store/file';
import { oneLineEllipsis } from '@/styles';
import { downloadFile } from '@/utils/client/downloadFile';

const Title = () => {
  const { t } = useTranslation('portal');
  const { message, modal } = App.useApp();
  const [closeFilePreview, previewFileId] = useChatStore((s) => [
    s.closeFilePreview,
    chatPortalSelectors.previewFileId(s),
  ]);
  const [removeFileItem, renameFileItem] = useFileStore((s) => [
    s.removeFileItem,
    s.renameFileItem,
  ]);

  const useFetchFileItem = useFileStore((s) => s.useFetchKnowledgeItem);

  const { data, isLoading } = useFetchFileItem(previewFileId);
  const isManagedFile = data?.sourceType === 'file';

  const handleRename = () => {
    if (!data) return;

    let nextName = data.name;

    modal.confirm({
      centered: true,
      content: (
        <Input
          autoFocus
          defaultValue={data.name}
          onChange={(event) => {
            nextName = event.target.value;
          }}
        />
      ),
      okText: t('files.rename'),
      onOk: async () => {
        const trimmedName = nextName.trim();
        if (!trimmedName || trimmedName === data.name) return;

        await renameFileItem(data.id, trimmedName);
        message.success(t('files.renameSuccess'));
      },
      title: t('files.renameTitle'),
    });
  };

  const handleDelete = () => {
    if (!data) return;

    modal.confirm({
      centered: true,
      okButtonProps: { danger: true },
      okText: t('files.delete'),
      onOk: async () => {
        await removeFileItem(data.id);
        closeFilePreview();
        message.success(t('files.deleteSuccess'));
      },
      title: t('files.confirmDelete'),
    });
  };

  return (
    <Flexbox horizontal align={'center'} gap={4}>
      <ActionIcon icon={ArrowLeft} size={'small'} onClick={() => closeFilePreview()} />

      {isLoading ? (
        <Skeleton.Button active style={{ height: 28 }} />
      ) : (
        <Text className={oneLineEllipsis} style={{ fontSize: 16 }} type={'secondary'}>
          {data?.name}
        </Text>
      )}
      {isManagedFile && data?.url && (
        <Flexbox horizontal gap={4} style={{ marginLeft: 'auto' }}>
          <ActionIcon
            icon={DownloadIcon}
            size={'small'}
            title={t('files.download')}
            onClick={() => {
              void downloadFile(data.url, data.name);
            }}
          />
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
        </Flexbox>
      )}
    </Flexbox>
  );
};

export default Title;
