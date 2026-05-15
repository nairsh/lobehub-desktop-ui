'use client';

import { memo } from 'react';
import { Navigate } from 'react-router-dom';

import { projectSelectors, useProjectStore } from '@/store/project';

const ProjectIndex = memo(() => {
  const firstProject = useProjectStore((s) => projectSelectors.projectList(s)[0]);

  if (firstProject) {
    return <Navigate replace to={`/project/${firstProject.id}`} />;
  }

  return <Navigate replace to={'/resource'} />;
});

ProjectIndex.displayName = 'ProjectIndex';

export default ProjectIndex;
