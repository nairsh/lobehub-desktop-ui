'use client';

import { Flexbox } from '@lobehub/ui';
import { type FC } from 'react';
import { Outlet } from 'react-router-dom';

import RegisterHotkeys from '@/routes/(main)/resource/library/features/RegisterHotkeys';

import { styles } from './style';

const ProjectLayout: FC = () => {
  return (
    <>
      <Flexbox className={styles.mainContainer} flex={1} height={'100%'}>
        <Outlet />
      </Flexbox>
      <RegisterHotkeys />
    </>
  );
};

export default ProjectLayout;
