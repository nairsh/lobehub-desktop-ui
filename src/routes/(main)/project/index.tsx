'use client';

import { memo } from 'react';
import { Navigate } from 'react-router-dom';

const ProjectIndex = memo(() => <Navigate replace to={'/resource'} />);

ProjectIndex.displayName = 'ProjectIndex';

export default ProjectIndex;
