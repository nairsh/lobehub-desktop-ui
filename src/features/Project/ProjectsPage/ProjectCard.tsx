'use client';

import { Flexbox } from '@lobehub/ui';
import { Dropdown, Modal } from 'antd';
import { EditIcon, EllipsisVerticalIcon, FolderOpenIcon, TrashIcon } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
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
  const { t: tCommon } = useTranslation('common');
  const { open: openModal } = useProjectModal();
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsMenuOpen(false);
      openModal({
        initialValues: { description: project.description, name: project.name },
        projectId: project.id,
      });
    },
    [project, openModal],
  );

  const handleDelete = useCallback(async () => {
    Modal.confirm({
      title: t('deleteProject'),
      content: t('deleteConfirm'),
      okText: tCommon('delete'),
      okType: 'danger',
      cancelText: tCommon('cancel'),
      onOk: async () => {
        await deleteProject(project.id);
      },
    });
  }, [project.id, deleteProject, t, tCommon]);

  return (
    <Flexbox
      gap={12}
      padding={16}
      style={{
        border: '1px solid var(--colorBorderSecondary, rgba(0,0,0,0.08))',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'border-color 0.2s',
        position: 'relative',
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
      <Flexbox horizontal align="flex-start" gap={8} justify="space-between">
        <Flexbox gap={4} style={{ flex: 1 }}>
          <span style={{ fontWeight: 500 }}>{project.name}</span>
          {project.description && (
            <span style={{ fontSize: 12, opacity: 0.55 }}>{project.description}</span>
          )}
        </Flexbox>
        <Dropdown
          open={isMenuOpen}
          placement="bottomRight"
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
          onOpenChange={setIsMenuOpen}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--colorBgElevated)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            <EllipsisVerticalIcon size={16} />
          </div>
        </Dropdown>
      </Flexbox>
      <FolderOpenIcon opacity={0.7} size={24} />
    </Flexbox>
  );
});

ProjectCard.displayName = 'ProjectCard';

export default ProjectCard;
