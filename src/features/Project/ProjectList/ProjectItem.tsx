'use client';

import { Block, Icon, Text } from '@lobehub/ui';
import { Dropdown } from 'antd';
import { createStaticStyles, cssVar } from 'antd-style';
import { BookmarkIcon, EditIcon, FolderIcon, TrashIcon } from 'lucide-react';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { projectSelectors, useProjectStore } from '@/store/project';
import type { ProjectItem as ProjectItemType } from '@/types/project';

import { useProjectModal } from '../ProjectModal';

const styles = createStaticStyles(({ css }) => ({
  pinIcon: css`
    color: ${cssVar.colorPrimary};
    opacity: 0.8;
  `,
}));

interface ProjectItemProps {
  project: ProjectItemType;
}

const ProjectItem = memo<ProjectItemProps>(({ project }) => {
  const { t } = useTranslation('project');
  const navigate = useNavigate();
  const { open: openModal } = useProjectModal();

  const activeProjectId = useProjectStore(projectSelectors.activeProjectId);
  const isPinned = useProjectStore(projectSelectors.isPinned(project.id));
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const togglePin = useProjectStore((s) => s.togglePinProject);

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
            icon: <Icon icon={BookmarkIcon} />,
            key: 'pin',
            label: isPinned
              ? t('unpinProject', { defaultValue: 'Unpin project' })
              : t('pinProject', { defaultValue: 'Pin project' }),
            onClick: () => togglePin(project.id),
          },
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
        align={'center'}
        gap={8}
        height={32}
        paddingInline={2}
        style={isActive ? { background: cssVar.colorFillSecondary } : undefined}
        variant={'borderless'}
        onClick={handleClick}
      >
        <Icon icon={FolderIcon} size={'small'} style={{ flex: 'none' }} />
        <Text ellipsis style={{ flex: 1 }}>
          {project.name}
        </Text>
        {isPinned && (
          <Icon className={styles.pinIcon} icon={BookmarkIcon} size={12} style={{ flex: 'none' }} />
        )}
      </Block>
    </Dropdown>
  );
});

ProjectItem.displayName = 'ProjectItem';

export default ProjectItem;
