'use client';

import { Flexbox } from '@lobehub/ui';
import { type FC, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import DataSync from './DataSync';
import Sidebar from './Sidebar';
import { styles } from './style';

const DesktopPagesLayout: FC = () => {
  const { pathname } = useLocation();
  const isEditorRoute = useMemo(() => /^\/page\/[^/]+/.test(pathname), [pathname]);

  return (
    <>
      {!isEditorRoute && <Sidebar />}
      <Flexbox className={styles.mainContainer} flex={1} height={'100%'}>
        <Outlet />
      </Flexbox>
      <DataSync />
    </>
  );
};

export default DesktopPagesLayout;
