'use client';

import { Flexbox, Icon, Text } from '@lobehub/ui';
import { FolderOpenIcon } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const ProjectSidebarHeader = memo(() => {
  const { t } = useTranslation('project');

  return (
    <Flexbox horizontal align={'center'} gap={8} paddingBlock={8} paddingInline={12}>
      <Icon icon={FolderOpenIcon} size={'small'} />
      <Text style={{ fontWeight: 600 }}>{t('title')}</Text>
    </Flexbox>
  );
});

ProjectSidebarHeader.displayName = 'ProjectSidebarHeader';

export default ProjectSidebarHeader;
