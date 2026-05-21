'use client';

import {
  ActionIcon,
  Block,
  Button,
  createModal,
  Flexbox,
  Icon,
  Text,
  useModalContext,
} from '@lobehub/ui';
import type { UploadFile } from 'antd';
import { Input, message, Upload } from 'antd';
import { FileIcon as FileIconLucide, PaperclipIcon, PlusIcon, UploadIcon } from 'lucide-react';
import { memo, Suspense, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useFileStore } from '@/store/file';
import { useProjectStore } from '@/store/project';
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
  const { data: kbFiles } = useFetchKnowledgeItems({
    knowledgeBaseId,
    showFilesInKnowledgeBase: true,
  });

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
                      horizontal
                      align={'center'}
                      gap={8}
                      height={32}
                      key={file.id}
                      paddingInline={6}
                      variant={'borderless'}
                    >
                      <Icon flex={'none'} icon={FileIconLucide} opacity={0.5} size={'small'} />
                      <Text ellipsis style={{ flex: 1, fontSize: 12 }}>
                        {file.name}
                      </Text>
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
