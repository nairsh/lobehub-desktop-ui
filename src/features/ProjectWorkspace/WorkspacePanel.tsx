'use client';

import {
  ActionIcon,
  Block,
  Button,
  createModal,
  DropdownMenu,
  Flexbox,
  Icon,
  Text,
  useModalContext,
} from '@lobehub/ui';
import type { UploadFile } from 'antd';
import { Input, message, Upload } from 'antd';
import {
  EditIcon,
  FileIcon as FileIconLucide,
  MoreHorizontalIcon,
  PaperclipIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
} from 'lucide-react';
import { memo, Suspense, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import FileViewer from '@/features/FileViewer';
import { fileService } from '@/services/file';
import { useFileStore } from '@/store/file';
import { useProjectStore } from '@/store/project';
import type { FileListItem } from '@/types/files';
import type { ProjectItem } from '@/types/project';

import { styles } from './style';

// ── Instructions modal ─────────────────────────────────────────────────────

const InstructionsModalContent = memo<{ initialValue: string; onSave: (v: string) => void }>(
  ({ initialValue, onSave }) => {
    const { t } = useTranslation('project');
    const { close } = useModalContext();
    const [value, setValue] = useState(initialValue);

    return (
      <Flexbox gap={16} paddingInline={8} style={{ paddingBottom: 8 }}>
        <Input.TextArea
          autoFocus
          autoSize={{ maxRows: 14, minRows: 6 }}
          value={value}
          placeholder={t('instructionsPlaceholder', {
            defaultValue:
              'Give this project context, tone, or rules. Applies to every chat in the project.',
          })}
          onChange={(e) => setValue(e.target.value)}
        />
        <Flexbox direction={'horizontal-reverse'} gap={8}>
          <Button
            type={'primary'}
            onClick={() => {
              onSave(value);
              close();
            }}
          >
            {t('save', { defaultValue: 'Save', ns: 'common' })}
          </Button>
          <Button onClick={close}>{t('cancel', { defaultValue: 'Cancel', ns: 'common' })}</Button>
        </Flexbox>
      </Flexbox>
    );
  },
);
InstructionsModalContent.displayName = 'InstructionsModalContent';

// ── Files modal ────────────────────────────────────────────────────────────

const FilesModalContent = memo<{ knowledgeBaseId: string }>(({ knowledgeBaseId }) => {
  const { t } = useTranslation('project');
  const { close } = useModalContext();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const pushDockFileList = useFileStore((s) => s.pushDockFileList);

  const handleUpload = async () => {
    setLoading(true);
    try {
      const files = fileList.map((f) => f.originFileObj as File).filter(Boolean);
      await pushDockFileList(files, knowledgeBaseId);
      close();
    } catch (e: any) {
      const msg: string = e?.shape?.message || e?.data?.message || e?.message || String(e);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flexbox gap={16} paddingInline={8} style={{ paddingBottom: 8 }}>
      <Upload.Dragger
        multiple
        showUploadList
        accept="*/*"
        beforeUpload={() => false}
        fileList={fileList}
        onChange={({ fileList: next }) => setFileList(next)}
      >
        <Flexbox align={'center'} gap={8} style={{ padding: '16px 0' }}>
          <UploadIcon opacity={0.4} size={28} />
          <Text style={{ fontSize: 14 }}>
            {t('dropFilesHere', { defaultValue: 'Drop files here or click to browse' })}
          </Text>
          <Text style={{ fontSize: 12 }} type={'secondary'}>
            {t('filesHint', { defaultValue: 'PDF, images, documents, code files and more' })}
          </Text>
        </Flexbox>
      </Upload.Dragger>
      <Flexbox direction={'horizontal-reverse'} gap={8}>
        <Button
          disabled={fileList.length === 0}
          loading={loading}
          type={'primary'}
          onClick={handleUpload}
        >
          {t('upload', { defaultValue: 'Upload', ns: 'common' })}
        </Button>
        <Button disabled={loading} onClick={close}>
          {t('cancel', { defaultValue: 'Cancel', ns: 'common' })}
        </Button>
      </Flexbox>
    </Flexbox>
  );
});
FilesModalContent.displayName = 'FilesModalContent';

// ── File preview modal ─────────────────────────────────────────────────────

const FilePreviewModalContent = memo<{
  fileId: string;
  initialFile?: FileListItem;
}>(({ fileId, initialFile }) => {
  const useFetchKnowledgeItem = useFileStore((s) => s.useFetchKnowledgeItem);
  const { data } = useFetchKnowledgeItem(fileId);
  const file = data || initialFile;

  if (!file) return null;

  return (
    <Flexbox height={'100%'} width={'100%'}>
      <Flexbox flex={1} height={'100%'} style={{ overflow: 'auto' }}>
        <FileViewer {...file} />
      </Flexbox>
    </Flexbox>
  );
});
FilePreviewModalContent.displayName = 'FilePreviewModalContent';

const getFileResourceId = (file: FileListItem) => file.fileId ?? file.id;

// ── WorkspacePanel ─────────────────────────────────────────────────────────

interface WorkspacePanelProps {
  knowledgeBaseId: string;
  project: ProjectItem | null;
  projectId: string;
}

const WorkspacePanel = memo<WorkspacePanelProps>(({ knowledgeBaseId, project, projectId }) => {
  const { t } = useTranslation('project');
  const updateProject = useProjectStore((s) => s.updateProject);
  const currentInstructions = project?.settings?.defaultSystemPrompt ?? '';

  const useFetchKnowledgeItems = useFileStore((s) => s.useFetchKnowledgeItems);
  const { data: kbFiles, mutate: reloadFiles } = useFetchKnowledgeItems({
    knowledgeBaseId,
    showFilesInKnowledgeBase: true,
  });

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<any>(null);

  const openInstructions = useCallback(() => {
    createModal({
      children: (
        <Suspense fallback={<div style={{ minHeight: 120 }} />}>
          <InstructionsModalContent
            initialValue={currentInstructions}
            onSave={async (value) => {
              await updateProject(projectId, {
                settings: { ...project?.settings, defaultSystemPrompt: value },
              });
            }}
          />
        </Suspense>
      ),
      footer: null,
      title: t('instructions', { defaultValue: 'Instructions' }),
      width: 480,
    });
  }, [currentInstructions, projectId, project?.settings, t, updateProject]);

  const openFiles = useCallback(() => {
    createModal({
      children: (
        <Suspense fallback={<div style={{ minHeight: 120 }} />}>
          <FilesModalContent knowledgeBaseId={knowledgeBaseId} />
        </Suspense>
      ),
      footer: null,
      title: t('files', { defaultValue: 'Files' }),
      width: 480,
    });
  }, [knowledgeBaseId, t]);

  const openFilePreview = useCallback((file: FileListItem) => {
    const fileId = getFileResourceId(file);

    createModal({
      allowFullscreen: true,
      centered: true,
      children: (
        <Suspense fallback={<div style={{ minHeight: 120 }} />}>
          <FilePreviewModalContent fileId={fileId} initialFile={{ ...file, id: fileId }} />
        </Suspense>
      ),
      destroyOnHidden: true,
      footer: null,
      height: '80vh',
      styles: {
        body: {
          height: '80vh',
          overflow: 'auto',
          padding: 0,
        },
      },
      title: file.name,
      width: 'min(90vw, 1024px)',
    });
  }, []);

  const startRename = useCallback((file: FileListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(file.id);
    setRenameValue(file.name);
    setTimeout(() => renameInputRef.current?.focus(), 0);
  }, []);

  const commitRename = useCallback(
    async (id: string) => {
      const name = renameValue.trim();
      if (name) {
        try {
          await fileService.updateFile(id, { name });
          await reloadFiles();
        } catch (e: any) {
          const msg: string = e?.shape?.message || e?.data?.message || e?.message || String(e);
          message.error(msg);
        }
      }
      setRenamingId(null);
    },
    [renameValue, reloadFiles],
  );

  const deleteFile = useCallback(
    async (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        await fileService.removeFile(id);
        await reloadFiles();
      } catch (e: any) {
        const msg: string = e?.shape?.message || e?.data?.message || e?.message || String(e);
        message.error(msg);
      }
    },
    [reloadFiles],
  );

  return (
    <Flexbox className={styles.panel} height={'100%'}>
      <Flexbox className={styles.panelBody}>
        {/* ── Instructions card ── */}
        <Flexbox className={styles.panelCard}>
          <Flexbox horizontal align={'center'} className={styles.panelCardHeader}>
            <Text className={styles.panelCardLabel}>
              {t('instructions', { defaultValue: 'Instructions' })}
            </Text>
            <ActionIcon
              icon={PaperclipIcon}
              size={'small'}
              title={t('editInstructions', { defaultValue: 'Edit instructions' })}
              onClick={openInstructions}
            />
          </Flexbox>
          <Flexbox
            className={styles.panelCardBody}
            style={{ cursor: 'pointer' }}
            onClick={openInstructions}
          >
            {currentInstructions ? (
              <Text style={{ fontSize: 13, lineHeight: 1.6 }}>{currentInstructions}</Text>
            ) : (
              <Text style={{ fontSize: 13, lineHeight: 1.6 }} type={'secondary'}>
                {t('instructionsPlaceholder', {
                  defaultValue: 'Give this project context, tone, or rules.',
                })}
              </Text>
            )}
          </Flexbox>
        </Flexbox>

        {/* ── Files card ── */}
        <Flexbox className={styles.panelCard}>
          <Flexbox horizontal align={'center'} className={styles.panelCardHeader}>
            <Text className={styles.panelCardLabel}>{t('files', { defaultValue: 'Files' })}</Text>
            <ActionIcon
              icon={PlusIcon}
              size={'small'}
              title={t('addFiles', { defaultValue: 'Add files' })}
              onClick={openFiles}
            />
          </Flexbox>
          <Flexbox className={styles.panelCardBody} gap={6}>
            {kbFiles && kbFiles.length > 0 ? (
              <>
                <Flexbox gap={2}>
                  {kbFiles.map((file) => (
                    <Block
                      clickable
                      horizontal
                      align={'center'}
                      gap={8}
                      height={32}
                      key={file.id}
                      paddingInline={6}
                      variant={'borderless'}
                      onClick={() => renamingId !== file.id && openFilePreview(file)}
                    >
                      <Icon
                        icon={FileIconLucide}
                        opacity={0.5}
                        size={'small'}
                        style={{ flex: 'none' }}
                      />
                      {renamingId === file.id ? (
                        <Input
                          ref={renameInputRef}
                          size={'small'}
                          style={{ flex: 1, fontSize: 12 }}
                          value={renameValue}
                          onBlur={() => commitRename(getFileResourceId(file))}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename(getFileResourceId(file));
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                        />
                      ) : (
                        <Text ellipsis style={{ flex: 1, fontSize: 12 }}>
                          {file.name}
                        </Text>
                      )}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu
                          items={[
                            {
                              icon: <EditIcon size={14} />,
                              key: 'rename',
                              label: t('rename', { defaultValue: 'Rename', ns: 'common' }),
                              onClick: ({ domEvent }: { domEvent: React.MouseEvent }) =>
                                startRename(file, domEvent),
                            },
                            {
                              danger: true,
                              icon: <TrashIcon size={14} />,
                              key: 'delete',
                              label: t('delete', { defaultValue: 'Delete', ns: 'common' }),
                              onClick: ({ domEvent }: { domEvent: React.MouseEvent }) =>
                                deleteFile(getFileResourceId(file), domEvent),
                            },
                          ]}
                        >
                          <ActionIcon icon={MoreHorizontalIcon} size={'small'} />
                        </DropdownMenu>
                      </div>
                    </Block>
                  ))}
                </Flexbox>
                <Button block size={'small'} onClick={openFiles}>
                  {t('addFiles', { defaultValue: 'Add files' })}
                </Button>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 13 }} type={'secondary'}>
                  {t('noFilesYet', { defaultValue: 'No files added yet.' })}
                </Text>
                <Button block size={'small'} onClick={openFiles}>
                  {t('addFiles', { defaultValue: 'Add files' })}
                </Button>
              </>
            )}
          </Flexbox>
        </Flexbox>
      </Flexbox>
    </Flexbox>
  );
});

WorkspacePanel.displayName = 'WorkspacePanel';

export default WorkspacePanel;
