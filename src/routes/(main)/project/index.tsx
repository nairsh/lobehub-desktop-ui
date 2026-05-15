'use client';

import { memo } from 'react';

import { ProjectsPage } from '@/features/Project';

const ProjectIndex = memo(() => <ProjectsPage />);

ProjectIndex.displayName = 'ProjectIndex';

export default ProjectIndex;
