import { Flexbox, Icon, Segmented } from '@lobehub/ui';
import { ProviderIcon } from '@lobehub/ui/icons';
import { Brain } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { styles } from '../styles';
import { type GroupMode } from '../types';

interface ToolbarProps {
  groupMode?: GroupMode;
  onGroupModeChange?: (mode: GroupMode) => void;
  showGroupModeSwitch?: boolean;
}

export const Toolbar = memo<ToolbarProps>(
  ({ groupMode, onGroupModeChange, showGroupModeSwitch }) => {
    const { t } = useTranslation('components');

    return (
      <Flexbox
        horizontal
        align="center"
        className={styles.toolbar}
        gap={8}
        paddingBlock={8}
        paddingInline={8}
      >
        {showGroupModeSwitch && (
          <Segmented
            size="small"
            value={groupMode}
            options={[
              {
                icon: <Icon icon={Brain} />,
                title: t('ModelSwitchPanel.byModel'),
                value: 'byModel',
              },
              {
                icon: <Icon icon={ProviderIcon} />,
                title: t('ModelSwitchPanel.byProvider'),
                value: 'byProvider',
              },
            ]}
            onChange={(value) => onGroupModeChange?.(value as GroupMode)}
          />
        )}
      </Flexbox>
    );
  },
);

Toolbar.displayName = 'Toolbar';
