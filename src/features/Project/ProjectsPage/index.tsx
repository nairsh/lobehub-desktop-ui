'use client';

import { Button, Flexbox } from '@lobehub/ui';
import { FolderOpenIcon, PlusIcon } from 'lucide-react';
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { projectSelectors, useProjectStore } from '@/store/project';

import { useProjectModal } from '../ProjectModal';
import ProjectCard from './ProjectCard';

const ProjectsPage = memo(() => {
  const { t } = useTranslation('project');
  const { open: openModal } = useProjectModal();
  const navigate = useNavigate();

  const projectList = useProjectStore(projectSelectors.projectList);
  const isLoading = useProjectStore(projectSelectors.isLoading);
  const refreshProjects = useProjectStore((s) => s.refreshProjects);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const handleProjectClick = (id: string) => {
    setActiveProject(id);
    navigate(`/project/${id}`);
  };

  return (
    <Flexbox gap={32} padding={32} style={{ maxWidth: 900, width: '100%', margin: '0 auto' }}>
      <Flexbox horizontal align="center" justify="space-between">
        <Flexbox horizontal align="center" gap={10}>
          <FolderOpenIcon size={22} />
          <span style={{ fontSize: 20, fontWeight: 600 }}>{t('title')}</span>
        </Flexbox>
        <Button icon={<PlusIcon size={16} />} type="primary" onClick={() => openModal()}>
          {t('createProject')}
        </Button>
      </Flexbox>

      {isLoading ? (
        <Flexbox align="center" justify="center" style={{ padding: '60px 0' }}>
          <span style={{ opacity: 0.5 }}>Loading…</span>
        </Flexbox>
      ) : projectList.length === 0 ? (
        <Flexbox align="center" gap={16} justify="center" style={{ padding: '60px 0' }}>
          <FolderOpenIcon opacity={0.3} size={48} />
          <span style={{ opacity: 0.5 }}>{t('emptyState')}</span>
          <Button type="primary" onClick={() => openModal()}>
            {t('createProject')}
          </Button>
        </Flexbox>
      ) : (
        <Flexbox
          gap={12}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
        >
          {projectList.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => handleProjectClick(project.id)}
            />
          ))}
        </Flexbox>
      )}
    </Flexbox>
  );
});

ProjectsPage.displayName = 'ProjectsPage';

export default ProjectsPage;
