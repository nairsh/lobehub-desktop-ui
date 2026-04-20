'use client';

import { ActionIcon, Flexbox, Text } from '@lobehub/ui';
import { PanelRightIcon, SettingsIcon } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { LIBRARY_URL } from '@/const/url';
import { knowledgeBaseSelectors, useKnowledgeBaseStore } from '@/store/library';

import { styles } from './style';

interface ProjectHeaderProps {
  id: string;
  onTogglePanel: () => void;
  panelOpen: boolean;
}

const ProjectHeader = memo<ProjectHeaderProps>(({ id, panelOpen, onTogglePanel }) => {
  const { t } = useTranslation('knowledgeBase');
  const navigate = useNavigate();
  const name = useKnowledgeBaseStore(knowledgeBaseSelectors.getKnowledgeBaseNameById(id));

  return (
    <Flexbox
      horizontal
      align={'center'}
      className={styles.header}
      distribution={'space-between'}
      gap={8}
    >
      <Text ellipsis className={styles.headerTitle}>
        {name || t('tab.project', { defaultValue: 'Project' })}
      </Text>
      <Flexbox horizontal gap={4}>
        <ActionIcon
          icon={SettingsIcon}
          size={'small'}
          title={t('tab.Settings', { defaultValue: 'Manage files' })}
          onClick={() => navigate(LIBRARY_URL(id))}
        />
        <ActionIcon
          active={panelOpen}
          icon={PanelRightIcon}
          size={'small'}
          title={panelOpen ? 'Hide panel' : 'Show panel'}
          onClick={onTogglePanel}
        />
      </Flexbox>
    </Flexbox>
  );
});

ProjectHeader.displayName = 'ProjectHeader';

export default ProjectHeader;
