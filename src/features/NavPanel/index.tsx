'use client';

import { type PropsWithChildren, type ReactNode } from 'react';
import { memo, useLayoutEffect, useSyncExternalStore } from 'react';

import HomeSidebarContent from '@/routes/(main)/home/_layout/SidebarContent';

import { NavPanelDraggable } from './components/NavPanelDraggable';

// Stable fallback used when no portal has registered content yet, such as initial mount or
// after an agent-free session unmounts route-specific sidebar content. Using HomeSidebarContent
// directly avoids a portal cleanup/register loop.
const HOME_FALLBACK: { key: string; node: ReactNode } = {
  key: 'home',
  node: <HomeSidebarContent />,
};

export const NAV_PANEL_RIGHT_DRAWER_ID = 'nav-panel-drawer';

type NavPanelSnapshot = {
  key: string;
  node: ReactNode;
} | null;

let currentSnapshot: NavPanelSnapshot = null;
const listeners = new Set<() => void>();

const subscribeNavPanel = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getNavPanelSnapshot = () => currentSnapshot;
const setNavPanelSnapshot = (snapshot: NavPanelSnapshot) => {
  currentSnapshot = snapshot;
  listeners.forEach((listener) => listener());
};

const NavPanel = memo(() => {
  const panelContent = useSyncExternalStore(
    subscribeNavPanel,
    getNavPanelSnapshot,
    getNavPanelSnapshot,
  );

  const activeContent = panelContent || HOME_FALLBACK;

  return (
    <>
      <NavPanelDraggable activeContent={activeContent} />
      <div
        id={NAV_PANEL_RIGHT_DRAWER_ID}
        style={{
          height: '100%',
          position: 'relative',
          width: 0,
          zIndex: 10,
        }}
      />
    </>
  );
});

export default NavPanel;

interface NavPanelPortalProps extends PropsWithChildren {
  /**
   * Unique key to trigger transition animation when content changes
   * @example <NavPanelPortal navKey="chat">...</NavPanelPortal>
   */
  navKey?: string;
}

export const NavPanelPortal = memo<NavPanelPortalProps>(({ children, navKey = 'default' }) => {
  useLayoutEffect(() => {
    if (!children) return;

    setNavPanelSnapshot({
      key: navKey,
      node: children,
    });
    // Intentionally keep previous content until new one mounts.
  }, [children, navKey]);

  // Reset snapshot when this portal leaves the tree so NavPanel falls back to home sidebar.
  useLayoutEffect(() => {
    return () => setNavPanelSnapshot(null);
  }, []);

  return null;
});
