'use client';

import { memo } from 'react';

import { NavPanelPortal } from '@/features/NavPanel';
import SideBarLayout from '@/features/NavPanel/SideBarLayout';
import LibraryHierarchy from '@/features/ResourceManager/components/LibraryHierarchy';
import LibraryHeader from '@/routes/(main)/resource/library/_layout/Header';

const Sidebar = memo(() => {
  return (
    <NavPanelPortal navKey="project">
      <SideBarLayout body={<LibraryHierarchy />} header={<LibraryHeader />} />
    </NavPanelPortal>
  );
});

Sidebar.displayName = 'ProjectSidebar';

export default Sidebar;
