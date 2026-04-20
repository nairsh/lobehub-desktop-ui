'use client';

import { Flexbox, Text } from '@lobehub/ui';
import { memo, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useResourceManagerStore } from '@/routes/(main)/resource/features/store';
import { knowledgeBaseSelectors, useKnowledgeBaseStore } from '@/store/library';

import ProjectHeader from './ProjectHeader';
import { styles } from './style';
import WorkspacePanel from './WorkspacePanel';

interface ProjectWorkspaceProps {
  knowledgeBaseId: string;
}

/**
 * Project workspace - split view combining a chat surface with a
 * collapsible project panel (files + custom instructions).
 *
 * This is an MVP: the chat surface is a placeholder shell; the panel
 * reuses knowledge-base state so files managed here are the same files
 * the full ResourceManager sees.
 */
const ProjectWorkspace = memo<ProjectWorkspaceProps>(({ knowledgeBaseId }) => {
  const { t } = useTranslation('knowledgeBase');
  const [panelOpen, setPanelOpen] = useState(true);

  const setLibraryId = useResourceManagerStore((s) => s.setLibraryId);
  const name = useKnowledgeBaseStore(
    knowledgeBaseSelectors.getKnowledgeBaseNameById(knowledgeBaseId),
  );

  // Keep the resource-manager store in sync with the project route so that
  // navigating to "manage files" or the library view shows the right KB.
  useLayoutEffect(() => {
    setLibraryId(knowledgeBaseId);
    return () => setLibraryId(undefined);
  }, [knowledgeBaseId, setLibraryId]);

  return (
    <Flexbox horizontal className={styles.container} height={'100%'} width={'100%'}>
      <Flexbox className={styles.chatPane} flex={1}>
        <ProjectHeader
          id={knowledgeBaseId}
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen((v) => !v)}
        />
        <Flexbox className={styles.emptyChat}>
          <Text className={styles.emptyChatTitle}>
            {name || t('tab.project', { defaultValue: 'Project' })}
          </Text>
          <Text type={'secondary'}>
            {t('workspace.welcome', {
              defaultValue:
                'Chat here with the knowledge and files in this project. Use the panel on the right to manage files and set custom instructions.',
            })}
          </Text>
        </Flexbox>
        <Flexbox className={styles.fakeInput}>
          {t('workspace.inputPlaceholder', { defaultValue: 'Message this project…' })}
        </Flexbox>
      </Flexbox>
      {panelOpen && <WorkspacePanel knowledgeBaseId={knowledgeBaseId} />}
    </Flexbox>
  );
});

ProjectWorkspace.displayName = 'ProjectWorkspace';

export default ProjectWorkspace;
