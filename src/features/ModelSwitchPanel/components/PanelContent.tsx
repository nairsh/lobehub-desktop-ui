import { Flexbox } from '@lobehub/ui';
import { type ComponentType, type FC } from 'react';
import { Rnd } from 'react-rnd';

import { useEnabledChatModels } from '@/hooks/useEnabledChatModels';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/slices/settings/selectors/general';
import type { LobeAgentChatConfig } from '@/types/agent';
import type { EnabledProviderWithModels } from '@/types/aiProvider';

import {
  DEFAULT_WIDTH,
  ENABLE_RESIZING,
  FOOTER_HEIGHT,
  MAX_PANEL_HEIGHT,
  MAX_WIDTH,
  MIN_WIDTH,
  TOOLBAR_HEIGHT,
} from '../const';
import { useModelReasoning } from '../hooks/useModelReasoning';
import { usePanelSize } from '../hooks/usePanelSize';
import { usePanelState } from '../hooks/usePanelState';
import { List } from './List';
import type { PricingMode } from './ModelDetailPanel';
import ReasoningFooter from './ReasoningFooter';
import { Toolbar } from './Toolbar';

interface PanelContentProps {
  chatConfig?: Partial<LobeAgentChatConfig>;
  enabledList?: EnabledProviderWithModels[];
  model?: string;
  ModelItemComponent?: ComponentType<any>;
  onChatConfigChange?: (config: Partial<LobeAgentChatConfig>) => void;
  onModelChange?: (params: { model: string; provider: string }) => Promise<void>;
  onOpenChange?: (open: boolean) => void;
  pricingMode?: PricingMode;
  provider?: string;
  showReasoningLabel?: boolean;
}

export const PanelContent: FC<PanelContentProps> = ({
  ModelItemComponent,
  chatConfig,
  enabledList: enabledListProp,
  model: modelProp,
  onChatConfigChange,
  onModelChange: onModelChangeProp,
  onOpenChange,
  pricingMode,
  provider: providerProp,
  showReasoningLabel = false,
}) => {
  const chatEnabledList = useEnabledChatModels();
  const enabledList = enabledListProp ?? chatEnabledList;
  const isDevMode = useUserStore((s) => userGeneralSettingsSelectors.config(s).isDevMode);
  const { groupMode, handleGroupModeChange } = usePanelState();
  const { panelHeight, panelWidth, handlePanelWidthChange } = usePanelSize(enabledList.length);

  // Determine if the reasoning footer will be shown to reserve space in the list
  const reasoning = useModelReasoning(modelProp ?? '', providerProp ?? '', chatConfig);
  const showReasoningFooter = !!onChatConfigChange && !!reasoning;
  const reservedFooterHeight = showReasoningFooter ? FOOTER_HEIGHT : 0;

  const content = (
    <>
      {isDevMode && (
        <Toolbar
          groupMode={groupMode}
          showGroupModeSwitch={isDevMode}
          onGroupModeChange={handleGroupModeChange}
        />
      )}
      <List
        ModelItemComponent={ModelItemComponent}
        chatConfig={chatConfig}
        enabledList={enabledList}
        footerHeight={reservedFooterHeight}
        groupMode={isDevMode ? groupMode : 'byModel'}
        model={modelProp}
        pricingMode={pricingMode}
        provider={providerProp}
        showReasoningLabel={showReasoningLabel}
        toolbarHeight={isDevMode ? TOOLBAR_HEIGHT : 0}
        onModelChange={onModelChangeProp}
        onOpenChange={onOpenChange}
      />
      {showReasoningFooter && (
        <ReasoningFooter
          chatConfig={chatConfig}
          model={modelProp}
          provider={providerProp}
          onChatConfigChange={onChatConfigChange}
        />
      )}
    </>
  );

  if (isDevMode) {
    return (
      <Rnd
        disableDragging
        enableResizing={ENABLE_RESIZING}
        maxWidth={MAX_WIDTH}
        minWidth={MIN_WIDTH}
        position={{ x: 0, y: 0 }}
        size={{ height: panelHeight, width: panelWidth }}
        style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}
        onResizeStop={(_e, _direction, ref) => {
          handlePanelWidthChange(ref.offsetWidth);
        }}
      >
        {content}
      </Rnd>
    );
  }

  return (
    <Flexbox
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: MAX_PANEL_HEIGHT,
        position: 'relative',
        width: DEFAULT_WIDTH,
      }}
    >
      {content}
    </Flexbox>
  );
};
