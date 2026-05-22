import { ActionIcon, Avatar, Button, Center, Flexbox, Icon, Text } from '@lobehub/ui';
import { App, Progress } from 'antd';
import { cssVar } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { InboxIcon, RefreshCwIcon, UploadIcon } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Balancer from 'react-wrap-balancer';

import SkeletonLoading from '@/components/Loading/SkeletonLoading';
import { useChatStore } from '@/store/chat';
import { chatSelectors } from '@/store/chat/selectors';
import { useFileStore } from '@/store/file';
import { fileChatSelectors } from '@/store/file/selectors';
import { fileManagerSelectors } from '@/store/file/slices/fileManager/selectors';

import { syncFilesToComputeWorkspace } from '../computeSync';
import { getActiveUploadCount, mergePortalFiles } from '../utils';
import FileItem from './Item';

const portalFileQuery = {
  limit: 50,
  showFilesInKnowledgeBase: true,
  sortType: 'desc',
  sorter: 'createdAt',
};

const FileList = () => {
  const { t } = useTranslation('portal');
  const { message } = App.useApp();
  const inputReference = useRef<HTMLInputElement>(null);
  const topicId = useChatStore((s) => s.activeTopicId);
  const files = useChatStore(chatSelectors.currentUserFiles, isEqual);
  const isCurrentChatLoaded = useChatStore(chatSelectors.isCurrentChatLoaded);
  const [
    refreshFileList,
    uploadChatFiles,
    useFetchKnowledgeItems,
    chatUploadFileList,
    dockUploadFileList,
    uploadProgress,
    isDockUploadingFiles,
    isChatUploadingFiles,
  ] = useFileStore((s) => [
    s.refreshFileList,
    s.uploadChatFiles,
    s.useFetchKnowledgeItems,
    fileChatSelectors.chatUploadFileList(s),
    fileManagerSelectors.dockFileList(s),
    fileManagerSelectors.overviewUploadingProgress(s),
    fileManagerSelectors.isUploadingFiles(s),
    fileChatSelectors.isUploadingFiles(s),
  ]);
  const { data: knowledgeFiles = [], isLoading } = useFetchKnowledgeItems(portalFileQuery);
  const mergedFiles = useMemo(
    () => mergePortalFiles(knowledgeFiles, files),
    [files, knowledgeFiles],
  );
  const activeUploadCount =
    getActiveUploadCount(dockUploadFileList) + getActiveUploadCount(chatUploadFileList);

  const handleUpload = async (fileList: globalThis.FileList | null) => {
    const nextFiles = Array.from(fileList || []);
    if (nextFiles.length === 0) return;

    try {
      await Promise.all([
        uploadChatFiles(nextFiles),
        syncFilesToComputeWorkspace(topicId, nextFiles)
          .then((result) => {
            if (result.failed > 0) {
              message.warning(t('files.computeSyncPartial', { count: result.failed }));
            }
            if (result.skipped > 0) {
              message.info(t('files.computeSyncSkipped', { count: result.skipped }));
            }
          })
          .catch(() => {
            message.warning(t('files.computeSyncUnavailable'));
          }),
      ]);
      await refreshFileList();
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('files.uploadFailed'));
    } finally {
      if (inputReference.current) inputReference.current.value = '';
    }
  };

  return (
    <Flexbox gap={12}>
      <Flexbox horizontal align={'center'} gap={8} paddingInline={12}>
        <input
          hidden
          multiple
          ref={inputReference}
          type="file"
          onChange={(event) => {
            void handleUpload(event.target.files);
          }}
        />
        <Button
          block
          icon={UploadIcon}
          loading={isDockUploadingFiles || isChatUploadingFiles}
          size={'small'}
          onClick={() => inputReference.current?.click()}
        >
          {t('files.upload')}
        </Button>
        <ActionIcon
          icon={RefreshCwIcon}
          size={'small'}
          title={t('files.refresh')}
          onClick={() => {
            void refreshFileList();
          }}
        />
      </Flexbox>
      {activeUploadCount > 0 && (
        <Flexbox gap={4} paddingInline={12}>
          <Progress percent={Math.round(uploadProgress)} showInfo={false} size="small" />
          <Text type={'secondary'}>{t('files.uploading', { count: activeUploadCount })}</Text>
        </Flexbox>
      )}
      {!isCurrentChatLoaded || isLoading ? (
        <Flexbox gap={12} paddingInline={12}>
          <SkeletonLoading />
        </Flexbox>
      ) : mergedFiles.length === 0 ? (
        <Center
          gap={8}
          paddingBlock={24}
          style={{ border: `1px dashed ${cssVar.colorSplit}`, borderRadius: 8, marginInline: 12 }}
        >
          <Avatar
            avatar={<Icon icon={InboxIcon} size={'large'} />}
            background={cssVar.colorFillTertiary}
            shape={'square'}
            size={48}
          />
          <Balancer>
            <Text type={'secondary'}>{t('emptyKnowledgeList')}</Text>
          </Balancer>
        </Center>
      ) : (
        <Flexbox gap={8} paddingInline={12}>
          {mergedFiles.map((m) => (
            <FileItem {...m} key={m.id} />
          ))}
        </Flexbox>
      )}
    </Flexbox>
  );
};

export default FileList;
