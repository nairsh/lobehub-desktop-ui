'use client';

import { PROJECT_URL } from '@lobechat/const';
import { Flexbox } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { projectSelectors, useProjectStore } from '@/store/project';

import Item from './Project/List/Item';

const styles = createStaticStyles(({ css, cssVar }) => ({
  label: css`
    padding-block: 2px;
    padding-inline: 8px;

    font-size: 11px;
    font-weight: 600;
    color: ${cssVar.colorTextTertiary};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  `,
}));

const PinnedProjects = memo(() => {
  const { t } = useTranslation('home');
  const navigate = useNavigate();
  const pinnedIds = useProjectStore(projectSelectors.pinnedProjectIds);
  const projectList = useProjectStore(projectSelectors.projectList);
  const isLoading = useProjectStore(projectSelectors.isLoading);
  const refreshProjects = useProjectStore((s) => s.refreshProjects);

  // Fetch projects if there are pinned IDs but the list isn't loaded yet
  useEffect(() => {
    if (pinnedIds.length > 0 && projectList.length === 0 && !isLoading) {
      refreshProjects();
    }
  }, [pinnedIds.length, projectList.length, isLoading, refreshProjects]);

  if (!pinnedIds.length) return null;

  const pinned = projectList.filter((item) => pinnedIds.includes(item.id));
  if (pinned.length === 0) return null;

  return (
    <Flexbox gap={1}>
      <div className={styles.label}>{t('project.pinned')}</div>
      {pinned.map((item) => (
        <Link
          aria-label={item.id}
          key={item.id}
          to={PROJECT_URL(item.id)}
          onClick={(e) => {
            e.preventDefault();
            navigate(PROJECT_URL(item.id));
          }}
        >
          <Item id={item.id} name={item.name} />
        </Link>
      ))}
    </Flexbox>
  );
});

export default PinnedProjects;
