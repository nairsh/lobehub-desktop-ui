'use client';

import { EditorProvider } from '@lobehub/editor/react';
import { Flexbox } from '@lobehub/ui';
import { cssVar } from 'antd-style';
import type { FC } from 'react';
import { memo, useEffect } from 'react';

import DiffAllToolbar from '@/features/EditorCanvas/DiffAllToolbar';
import { useRegisterFilesHotkeys } from '@/hooks/useHotkeys';
import { useGlobalStore } from '@/store/global';
import { usePageStore } from '@/store/page';
import { StyleSheet } from '@/utils/styles';

import Copilot from './Copilot';
import EditorCanvas from './EditorCanvas';
import Header from './Header';
import { PageAgentProvider } from './PageAgentProvider';
import { PageEditorProvider } from './PageEditorProvider';
import PageTitle from './PageTitle';
import { usePageEditorStore } from './store';
import TitleSection from './TitleSection';

const styles = StyleSheet.create({
  contentWrapper: {
    display: 'flex',
    overflowY: 'auto',
    position: 'relative',
  },
  editorContainer: {
    minWidth: 0,
    position: 'relative',
  },
  editorContent: {
    marginInline: 'auto',
    maxWidth: 900,
    paddingInline: 'clamp(56px, 8vw, 96px)',
    paddingTop: 52,
    overflowY: 'auto',
    position: 'relative',
    width: 'min(100%, 900px)',
  },
});

interface PageEditorProps {
  emoji?: string;
  knowledgeBaseId?: string;
  onBack?: () => void;
  onDelete?: () => void;
  onDocumentIdChange?: (newId: string) => void;
  onEmojiChange?: (emoji: string | undefined) => void;
  onSave?: () => void;
  onTitleChange?: (title: string) => void;
  pageId?: string;
  title?: string;
}

const PageEditorCanvas = memo(() => {
  const editor = usePageEditorStore((s) => s.editor);
  const documentId = usePageEditorStore((s) => s.documentId);
  const updateSystemStatus = useGlobalStore((s) => s.updateSystemStatus);

  // Register Files scope and save document hotkey
  useRegisterFilesHotkeys();

  useEffect(() => {
    updateSystemStatus({ showLeftPanel: false, showRightPanel: false });
  }, [updateSystemStatus]);

  return (
    <>
      <PageTitle />
      <Flexbox
        horizontal
        height={'100%'}
        style={{ backgroundColor: cssVar.colorBgContainer }}
        width={'100%'}
      >
        <Flexbox flex={1} height={'100%'} style={styles.editorContainer}>
          <Header />
          <Flexbox
            horizontal
            height={'100%'}
            style={{ ...styles.contentWrapper, cursor: 'text' }}
            width={'100%'}
            onClick={() => editor?.focus()}
          >
            <Flexbox flex={1} style={styles.editorContent}>
              <TitleSection />
              <EditorCanvas />
            </Flexbox>
          </Flexbox>
          {documentId && <DiffAllToolbar documentId={documentId} editor={editor!} />}
        </Flexbox>
        <Copilot />
      </Flexbox>
    </>
  );
});

/**
 * Edit a page
 *
 * A reusable component. Should NOT depend on context.
 */
export const PageEditor: FC<PageEditorProps> = ({
  pageId,
  knowledgeBaseId,
  onDocumentIdChange,
  onEmojiChange,
  onSave,
  onTitleChange,
  onBack,
  title,
  emoji,
}) => {
  const deletePage = usePageStore((s) => s.deletePage);

  return (
    <PageAgentProvider>
      <EditorProvider>
        <PageEditorProvider
          emoji={emoji}
          knowledgeBaseId={knowledgeBaseId}
          pageId={pageId}
          title={title}
          onBack={onBack}
          onDelete={() => deletePage(pageId || '')}
          onDocumentIdChange={onDocumentIdChange}
          onEmojiChange={onEmojiChange}
          onSave={onSave}
          onTitleChange={onTitleChange}
        >
          <PageEditorCanvas />
        </PageEditorProvider>
      </EditorProvider>
    </PageAgentProvider>
  );
};
