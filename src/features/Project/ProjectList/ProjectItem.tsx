'use client';

import { Block, Icon, Text } from '@lobehub/ui';
import { Dropdown } from 'antd';
import { EditIcon, FolderIcon, TrashIcon } from 'lucide-react';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { projectSelectors, useProjectStore } from '@/store/project';
import type { ProjectItem as ProjectItemType } from '@/types/project';

import { useProjectModal } from '../ProjectModal';

interface ProjectItemProps {
  project: ProjectItemType;
}

const ProjectItem = memo<ProjectItemProps>(({ project }) => {
  const { t } = useTranslation('project');
  const navigate = useNavigate();
  const { open: openModal } = useProjectModal();

  const activeProjectId = useProjectStore(projectSelectors.activeProjectId);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);

  const isActive = activeProjectId === project.id;

  const handleClick = useCallback(() => {
    setActiveProject(project.id);
    navigate(`/project/${project.id}`);
  }, [project.id, navigate, setActiveProject]);

  const handleEdit = useCallback(() => {
    openModal({
      initialValues: { description: project.description, name: project.name },
      projectId: project.id,
    });
  }, [project, openModal]);

  const handleDelete = useCallback(async () => {
    await deleteProject(project.id);
  }, [project.id, deleteProject]);

  return (
    <Dropdown
      trigger={['contextMenu']}
      menu={{
        items: [
          {
            icon: <Icon icon={EditIcon} />,
            key: 'edit',
            label: t('editProject'),
            onClick: handleEdit,
          },
          { type: 'divider' },
          {
            danger: true,
            icon: <Icon icon={TrashIcon} />,
            key: 'delete',
            label: t('deleteProject'),
            onClick: handleDelete,
          },
        ],
      }}
    >
      <Block
        clickable
        horizontal
        active={isActive}
        align={'center'}
        gap={8}
        height={32}
        paddingInline={2}
        variant={'borderless'}
        onClick={handleClick}
      >
        <Icon flex={'none'} icon={FolderIcon} size={'small'} />
        <Text ellipsis style={{ flex: 1 }}>
          {project.name}
        </Text>
      </Block>
    </Dropdown>
  );
});

ProjectItem.displayName = 'ProjectItem';

export default ProjectItem;
