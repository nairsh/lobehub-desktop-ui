'use client';

import { memo } from 'react';
import { useParams } from 'react-router-dom';

import NotFound from '@/components/404';
import NProgress from '@/components/NProgress';
import ProjectWorkspace from '@/features/ProjectWorkspace';
import { useKnowledgeBaseItem } from '@/routes/(main)/resource/features/hooks/useKnowledgeItem';

const ProjectPage = memo(() => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useKnowledgeBaseItem(id || '');

  if (!id) return <NotFound />;
  if (!isLoading && !data) return <NotFound />;

  return (
    <>
      <NProgress />
      <ProjectWorkspace knowledgeBaseId={id} />
    </>
  );
});

ProjectPage.displayName = 'ProjectDetailPage';

export default ProjectPage;
