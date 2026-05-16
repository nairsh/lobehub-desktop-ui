'use client';

import { Block, Button, Flexbox, Icon, Text } from '@lobehub/ui';
import { Input } from 'antd';
import { FileTextIcon, PlusIcon } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { LIBRARY_URL } from '@/const/url';
import { projectSelectors, useProjectStore } from '@/store/project';

import { styles } from './style';

interface WorkspacePanelProps {
  knowledgeBaseId: string;
  projectId: string;
}

/**
 * Right-hand workspace panel for a project:
 * - Files shortcut (opens the full file manager)
 * - Custom instructions (project-scoped and persisted in project settings)
 * - Add files shortcut
 */
const WorkspacePanel = memo<WorkspacePanelProps>(({ knowledgeBaseId, projectId }) => {
  const { t } = useTranslation('knowledgeBase');
  const navigate = useNavigate();
  const [instructions, setInstructions] = useState('');
  const project = useProjectStore(projectSelectors.projectById(projectId));
  const updateProject = useProjectStore((s) => s.updateProject);

  const openLibrary = () => navigate(LIBRARY_URL(knowledgeBaseId));
  const persistedInstructions = project?.settings?.defaultSystemPrompt || '';

  useEffect(() => {
    setInstructions(persistedInstructions);
  }, [persistedInstructions]);

  const saveInstructions = async () => {
    if (!project || instructions === persistedInstructions) return;

    await updateProject(projectId, {
      settings: {
        ...project.settings,
        defaultSystemPrompt: instructions,
      },
    });
  };

  return (
    <Flexbox className={styles.panel} height={'100%'}>
      <Flexbox className={styles.panelHeader}>
        {t('tab.project', { defaultValue: 'Project' })}
      </Flexbox>
      <Flexbox className={styles.panelBody} gap={20}>
        <Flexbox>
          <Text className={styles.sectionLabel}>{t('tab.Files', { defaultValue: 'Files' })}</Text>
          <Block gap={8} padding={12} variant={'outlined'}>
            <Flexbox horizontal align={'center'} gap={8}>
              <Icon icon={FileTextIcon} />
              <Text type={'secondary'}>
                {t('panel.filesHint', {
                  defaultValue: 'Manage files and knowledge linked to this project.',
                })}
              </Text>
            </Flexbox>
            <Flexbox horizontal gap={8}>
              <Button block icon={PlusIcon} type={'primary'} onClick={openLibrary}>
                {t('panel.addFiles', { defaultValue: 'Add files' })}
              </Button>
              <Button block onClick={openLibrary}>
                {t('panel.viewAll', { defaultValue: 'View all' })}
              </Button>
            </Flexbox>
          </Block>
        </Flexbox>

        <Flexbox>
          <Text className={styles.sectionLabel}>
            {t('panel.customInstructions', { defaultValue: 'Custom instructions' })}
          </Text>
          <Input.TextArea
            autoSize={{ maxRows: 12, minRows: 6 }}
            value={instructions}
            placeholder={t('panel.customInstructionsPlaceholder', {
              defaultValue:
                'Give this project context, tone, or rules. Applies to every chat in the project.',
            })}
            onChange={(e) => setInstructions(e.target.value)}
            onBlur={saveInstructions}
          />
        </Flexbox>
      </Flexbox>
    </Flexbox>
  );
});

WorkspacePanel.displayName = 'WorkspacePanel';

export default WorkspacePanel;
