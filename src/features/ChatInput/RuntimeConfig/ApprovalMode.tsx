import { type DropdownItem, type MenuProps } from '@lobehub/ui';
import { Button, DropdownMenu, Icon, Tooltip } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { Check, ChevronDown } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserStore } from '@/store/user';
import { toolInterventionSelectors } from '@/store/user/selectors';
import { type ApprovalMode } from '@/store/user/slices/settings/selectors';

const styles = createStaticStyles(({ css, cssVar }) => ({
  modeButton: css`
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextSecondary};
  `,
}));

const ModeSelector = memo(() => {
  const { t } = useTranslation('chat');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const approvalMode = useUserStore(toolInterventionSelectors.approvalMode);
  const updateHumanIntervention = useUserStore((s) => s.updateHumanIntervention);

  const modeLabels = useMemo(
    () => ({
      'allow-list': t('tool.intervention.mode.allowList'),
      'auto-run': t('tool.intervention.mode.autoRun'),
      'manual': t('tool.intervention.mode.manual'),
    }),
    [t],
  );

  const handleModeChange = useCallback(
    async (mode: ApprovalMode) => {
      await updateHumanIntervention({ approvalMode: mode });
    },
    [updateHumanIntervention],
  );

  const menuItems = useMemo<DropdownItem[]>(
    () => [
      {
        children: [
          {
            extra: approvalMode === 'auto-run' ? <Icon icon={Check} size={13} /> : undefined,
            key: 'auto-run',
            label: modeLabels['auto-run'],
            onClick: () => handleModeChange('auto-run'),
          },
          {
            extra: approvalMode === 'allow-list' ? <Icon icon={Check} size={13} /> : undefined,
            key: 'allow-list',
            label: modeLabels['allow-list'],
            onClick: () => handleModeChange('allow-list'),
          },
          {
            extra: approvalMode === 'manual' ? <Icon icon={Check} size={13} /> : undefined,
            key: 'manual',
            label: modeLabels.manual,
            onClick: () => handleModeChange('manual'),
          },
        ],
        key: 'approval-group',
        label: t('tool.intervention.approvalMode'),
        type: 'group',
      },
    ],
    [approvalMode, modeLabels, handleModeChange, t],
  );

  const button = (
    <Button
      className={styles.modeButton}
      color={'default'}
      icon={ChevronDown}
      iconPlacement="end"
      size="small"
      variant={'text'}
    >
      {modeLabels[approvalMode]}
    </Button>
  );

  return (
    <DropdownMenu
      items={menuItems as MenuProps['items']}
      open={dropdownOpen}
      placement="bottomLeft"
      onOpenChange={setDropdownOpen}
    >
      <div>
        {dropdownOpen ? (
          button
        ) : (
          <Tooltip title={t('tool.intervention.approvalMode')}>{button}</Tooltip>
        )}
      </div>
    </DropdownMenu>
  );
});

export default ModeSelector;
