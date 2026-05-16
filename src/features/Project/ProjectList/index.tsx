'use client';

import { Flexbox } from '@lobehub/ui';
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import EmptyNavItem from '@/features/NavPanel/components/EmptyNavItem';
import { projectSelectors, useProjectStore } from '@/store/project';

import { useProjectModal } from '../ProjectModal';
import ProjectItem from './ProjectItem';

const ProjectList = memo(() => {
  const { t } = useTranslation('project');
  const { open: openModal } = useProjectModal();

  const projectList = useProjectStore(projectSelectors.sortedProjectList);
  const refreshProjects = useProjectStore((s) => s.refreshProjects);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  return (
    <Flexbox gap={2} paddingInline={4}>
      {projectList.map((project) => (
        <ProjectItem key={project.id} project={project} />
      ))}
      <EmptyNavItem title={t('createProject')} onClick={() => openModal()} />
    </Flexbox>
  );
});

ProjectList.displayName = 'ProjectList';

export default ProjectList;
