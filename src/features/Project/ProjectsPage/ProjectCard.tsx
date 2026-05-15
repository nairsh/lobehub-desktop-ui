'use client';

import { Flexbox } from '@lobehub/ui';
import { Dropdown } from 'antd';
import { EditIcon, FolderOpenIcon, TrashIcon } from 'lucide-react';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useProjectStore } from '@/store/project';
import type { ProjectItem } from '@/types/project';

import { useProjectModal } from '../ProjectModal';

interface ProjectCardProps {
  onClick: () => void;
  project: ProjectItem;
}

const ProjectCard = memo<ProjectCardProps>(({ project, onClick }) => {
  const { t } = useTranslation('project');
  const { open: openModal } = useProjectModal();
  const deleteProject = useProjectStore((s) => s.deleteProject);

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      openModal({
        initialValues: { description: project.description, name: project.name },
        projectId: project.id,
      });
    },
    [project, openModal],
  );

  const handleDelete = useCallback(async () => {
    await deleteProject(project.id);
  }, [project.id, deleteProject]);

  return (
    <Dropdown
      trigger={['contextMenu']}
      menu={{
        items: [
          {
            icon: <EditIcon size={14} />,
            key: 'edit',
            label: t('editProject'),
            onClick: ({ domEvent }) => handleEdit(domEvent as React.MouseEvent),
          },
          { type: 'divider' },
          {
            danger: true,
            icon: <TrashIcon size={14} />,
            key: 'delete',
            label: t('deleteProject'),
            onClick: handleDelete,
          },
        ],
      }}
    >
      <Flexbox
        gap={12}
        padding={16}
        style={{
          border: '1px solid var(--colorBorderSecondary, rgba(0,0,0,0.08))',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
        onClick={onClick}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--colorPrimary)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor =
            'var(--colorBorderSecondary, rgba(0,0,0,0.08))';
        }}
      >
        <FolderOpenIcon opacity={0.7} size={24} />
        <Flexbox gap={4}>
          <span style={{ fontWeight: 500 }}>{project.name}</span>
          {project.description && (
            <span style={{ fontSize: 12, opacity: 0.55 }}>{project.description}</span>
          )}
        </Flexbox>
      </Flexbox>
    </Dropdown>
  );
});

ProjectCard.displayName = 'ProjectCard';

export default ProjectCard;
