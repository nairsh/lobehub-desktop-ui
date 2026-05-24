'use client';

import { PROJECT_URL } from '@lobechat/const';
import { Flexbox } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import EmptyNavItem from '@/features/NavPanel/components/EmptyNavItem';
import SkeletonList from '@/features/NavPanel/components/SkeletonList';
import { projectSelectors, useProjectStore } from '@/store/project';

import { useProjectMenuItems } from '../../../hooks';
import Item from './Item';

const styles = createStaticStyles(({ css, cssVar }) => ({
  sectionLabel: css`
    padding-block: 2px;
    padding-inline: 8px;

    font-size: 11px;
    font-weight: 600;
    color: ${cssVar.colorTextTertiary};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  `,
}));

const ProjectList = memo(() => {
  const { t } = useTranslation('home');
  const navigate = useNavigate();
  const { createProject } = useProjectMenuItems();
  const projectList = useProjectStore(projectSelectors.projectList);
  const isLoading = useProjectStore(projectSelectors.isLoading);
  const refreshProjects = useProjectStore((s) => s.refreshProjects);
  const pinnedIds = useProjectStore(projectSelectors.pinnedProjectIds);

  useEffect(() => {
    if (projectList.length === 0 && !isLoading) {
      refreshProjects();
    }
  }, [projectList.length, isLoading, refreshProjects]);

  if (isLoading && projectList.length === 0) return <SkeletonList />;

  const isEmpty = projectList.length === 0;

  if (isEmpty) {
    return <EmptyNavItem title={t('project.create')} onClick={createProject} />;
  }

  const pinned = projectList.filter((item) => pinnedIds.includes(item.id));
  const unpinned = projectList.filter((item) => !pinnedIds.includes(item.id));

  const renderItem = (item: { id: string; name: string }) => (
    <Link
      aria-label={item.id}
      key={item.id}
      to={PROJECT_URL(item.id)}
      onClick={(e) => {
        e.preventDefault();
        navigate(PROJECT_URL(item.id));
      }}
    >
      <Item {...item} key={item.id} />
    </Link>
  );

  return (
    <Flexbox gap={1}>
      {pinned.length > 0 && (
        <>
          <div className={styles.sectionLabel}>{t('project.pinned')}</div>
          {pinned.map(renderItem)}
        </>
      )}
      {unpinned.map(renderItem)}
    </Flexbox>
  );
});

export default ProjectList;
