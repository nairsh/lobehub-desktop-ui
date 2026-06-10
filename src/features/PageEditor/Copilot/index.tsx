'use client';

import { memo } from 'react';

import RightPanel from '@/features/RightPanel';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

import Conversation from './Conversation';
import FloatingCard from './FloatingCard';
import Launcher from './Launcher';

/**
 * Page AI assistant. Collapses to a floating avatar launcher; expands into either
 * a floating island (default) or a docked, resizable side panel.
 */
const Copilot = memo(() => {
  const [showRightPanel, panelMode, width, updateSystemStatus] = useGlobalStore((s) => [
    systemStatusSelectors.showRightPanel(s),
    systemStatusSelectors.pageAiPanelMode(s),
    systemStatusSelectors.pageAgentPanelWidth(s),
    s.updateSystemStatus,
  ]);

  if (!showRightPanel) return <Launcher />;

  if (panelMode === 'docked') {
    return (
      <RightPanel
        defaultWidth={width}
        onSizeChange={(size) => {
          if (size?.width) {
            const w = typeof size.width === 'string' ? Number.parseInt(size.width) : size.width;
            if (!!w) updateSystemStatus({ pageAgentPanelWidth: w });
          }
        }}
      >
        <Conversation />
      </RightPanel>
    );
  }

  return (
    <FloatingCard>
      <Conversation />
    </FloatingCard>
  );
});

export default Copilot;
