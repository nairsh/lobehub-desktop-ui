'use client';

import { memo, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import NotFound from '@/components/404';
import NProgress from '@/components/NProgress';
import ProjectWorkspace from '@/features/ProjectWorkspace';
import { projectSelectors, useProjectStore } from '@/store/project';

const ProjectPage = memo(() => {
  const { id } = useParams<{ id: string }>();

  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const project = useProjectStore(id ? projectSelectors.projectById(id) : () => null);
  const refreshProjects = useProjectStore((s) => s.refreshProjects);

  // Sync active project with URL param
  useEffect(() => {
    if (id) setActiveProject(id);
    return () => setActiveProject(null);
  }, [id, setActiveProject]);

  // Hydrate project list if store is empty
  useEffect(() => {
    if (!project && id) {
      refreshProjects();
    }
  }, [project, id, refreshProjects]);

  if (!id) return <NotFound />;
  if (!project) return <NProgress />;

  return (
    <>
      <NProgress />
      <ProjectWorkspace knowledgeBaseId={project.defaultKnowledgeBaseId ?? project.id} />
    </>
  );
});

ProjectPage.displayName = 'ProjectDetailPage';

export default ProjectPage;
