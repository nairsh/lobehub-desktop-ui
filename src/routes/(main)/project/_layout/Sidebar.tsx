'use client';

import { memo } from 'react';

import { NavPanelPortal } from '@/features/NavPanel';
import SideBarLayout from '@/features/NavPanel/SideBarLayout';
import { ProjectList, ProjectSidebarHeader } from '@/features/Project';

const Sidebar = memo(() => {
  return (
    <NavPanelPortal navKey="project">
      <SideBarLayout body={<ProjectList />} header={<ProjectSidebarHeader />} />
    </NavPanelPortal>
  );
});

Sidebar.displayName = 'ProjectSidebar';

export default Sidebar;
