import { isDesktop } from '@lobechat/const';
import { type RuntimeEnvMode } from '@lobechat/types';
import { Github } from '@lobehub/icons';
import { ActionIcon, Flexbox, Icon, Popover, Skeleton, Tooltip } from '@lobehub/ui';
import { createStaticStyles, cx } from 'antd-style';
import {
  Check,
  ChevronDownIcon,
  CloudIcon,
  FolderIcon,
  GitBranchIcon,
  LaptopIcon,
  MonitorOffIcon,
  SquircleDashed,
  TerminalIcon,
} from 'lucide-react';
import { memo, type ReactNode, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors, chatConfigByIdSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { topicSelectors } from '@/store/chat/selectors';

import { useAgentId } from '../hooks/useAgentId';
import { useUpdateAgentConfig } from '../hooks/useUpdateAgentConfig';
import ApprovalMode from './ApprovalMode';
import { getRecentDirs } from './recentDirs';
import WorkingDirectory from './WorkingDirectory';

const MODE_ICONS: Record<RuntimeEnvMode, typeof LaptopIcon> = {
  cloud: CloudIcon,
  local: LaptopIcon,
  none: MonitorOffIcon,
};

const styles = createStaticStyles(({ css, cssVar }) => ({
  bar: css`
    padding-block: 0;
    padding-inline: 4px;
  `,
  button: css`
    cursor: pointer;

    display: flex;
    gap: 6px;
    align-items: center;

    height: 28px;
    padding-inline: 8px;
    border-radius: 6px;

    font-size: 12px;
    color: ${cssVar.colorTextSecondary};

    transition: all 0.2s;

    &:hover {
      color: ${cssVar.colorText};
      background: ${cssVar.colorFillSecondary};
    }
  `,
  modeOption: css`
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: space-between;

    width: 100%;
    padding-block: 6px;
    padding-inline: 8px;
    border-radius: ${cssVar.borderRadius};

    font-size: 13px;
    color: ${cssVar.colorText};

    transition: background-color 0.2s;

    &:hover {
      background: ${cssVar.colorFillTertiary};
    }
  `,
  modeOptionActive: css`
    font-weight: 500;
  `,
  sectionHeader: css`
    padding-block: 4px 2px;
    padding-inline: 8px;

    font-size: 11px;
    font-weight: 500;
    color: ${cssVar.colorTextTertiary};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  `,
}));

const RuntimeConfig = memo(() => {
  const { t } = useTranslation('chat');
  const { t: tPlugin } = useTranslation('plugin');
  const agentId = useAgentId();
  const { updateAgentChatConfig } = useUpdateAgentConfig();
  const [dirPopoverOpen, setDirPopoverOpen] = useState(false);
  const [modePopoverOpen, setModePopoverOpen] = useState(false);

  const [isLoading, runtimeMode] = useAgentStore((s) => [
    agentByIdSelectors.isAgentConfigLoadingById(agentId)(s),
    chatConfigByIdSelectors.getRuntimeModeById(agentId)(s),
  ]);

  const topicWorkingDirectory = useChatStore(topicSelectors.currentTopicWorkingDirectory);
  const openTerminalWorkspace = useChatStore((s) => s.openTerminalWorkspace);
  const agentWorkingDirectory = useAgentStore((s) =>
    agentId ? agentByIdSelectors.getAgentWorkingDirectoryById(agentId)(s) : undefined,
  );
  const effectiveWorkingDirectory = topicWorkingDirectory || agentWorkingDirectory;

  const dirIconNode = useMemo((): ReactNode => {
    if (!effectiveWorkingDirectory) return <Icon icon={SquircleDashed} size={14} />;
    const dirs = getRecentDirs();
    const match = dirs.find((d) => d.path === effectiveWorkingDirectory);
    if (match?.repoType === 'github') return <Github size={14} />;
    if (match?.repoType === 'git') return <Icon icon={GitBranchIcon} size={14} />;
    return <Icon icon={FolderIcon} size={14} />;
  }, [effectiveWorkingDirectory]);

  const switchMode = useCallback(
    async (mode: RuntimeEnvMode) => {
      if (mode === runtimeMode) return;

      const platform = isDesktop ? 'desktop' : 'web';

      await updateAgentChatConfig({
        runtimeEnv: { runtimeMode: { [platform]: mode } },
      });
    },
    [runtimeMode, updateAgentChatConfig],
  );

  // Skeleton placeholder to prevent layout jump during loading
  if (!agentId || isLoading) {
    return (
      <Flexbox horizontal align={'center'} className={styles.bar} gap={4}>
        <Skeleton.Button active size="small" style={{ height: 22, minWidth: 64, width: 64 }} />
        <Skeleton.Button active size="small" style={{ height: 22, minWidth: 100, width: 100 }} />
      </Flexbox>
    );
  }

  const ModeIcon = MODE_ICONS[runtimeMode];
  const modeLabel = t(`runtimeEnv.mode.${runtimeMode}`);

  const displayName = effectiveWorkingDirectory
    ? effectiveWorkingDirectory.split('/').findLast(Boolean) || effectiveWorkingDirectory
    : tPlugin('localSystem.workingDirectory.notSet');

  const modes: { label: string; mode: RuntimeEnvMode }[] = [
    // Local mode is desktop-only
    ...(isDesktop
      ? [
          {
            label: t('runtimeEnv.mode.local'),
            mode: 'local' as RuntimeEnvMode,
          },
        ]
      : []),
    {
      label: t('runtimeEnv.mode.cloud'),
      mode: 'cloud',
    },
    {
      label: t('runtimeEnv.mode.none'),
      mode: 'none',
    },
  ];

  const modeContent = (
    <Flexbox gap={2} style={{ minWidth: 160, paddingBlock: 4 }}>
      <div className={styles.sectionHeader}>{t('runtimeEnv.selectMode')}</div>
      {modes.map(({ mode, label }) => (
        <div
          className={cx(styles.modeOption, runtimeMode === mode && styles.modeOptionActive)}
          key={mode}
          onClick={() => switchMode(mode)}
        >
          <span>{label}</span>
          {runtimeMode === mode && <Icon icon={Check} size={13} />}
        </div>
      ))}
    </Flexbox>
  );

  const modeButton = (
    <div className={styles.button}>
      <Icon icon={ModeIcon} size={14} />
      <span>{modeLabel}</span>
      <Icon icon={ChevronDownIcon} size={12} />
    </div>
  );

  const dirButton = (
    <div className={styles.button}>
      {dirIconNode}
      <span>{displayName}</span>
      <Icon icon={ChevronDownIcon} size={12} />
    </div>
  );

  const rightContent = () => {
    if (runtimeMode === 'local') {
      return (
        <Popover
          content={<WorkingDirectory agentId={agentId} onClose={() => setDirPopoverOpen(false)} />}
          open={dirPopoverOpen}
          placement="bottomLeft"
          styles={{ content: { padding: 4 } }}
          trigger="click"
          onOpenChange={setDirPopoverOpen}
        >
          <div>
            {dirPopoverOpen ? (
              dirButton
            ) : (
              <Tooltip
                title={effectiveWorkingDirectory || tPlugin('localSystem.workingDirectory.notSet')}
              >
                {dirButton}
              </Tooltip>
            )}
          </div>
        </Popover>
      );
    }

    return null;
  };

  return (
    <Flexbox horizontal align={'center'} className={styles.bar} justify={'space-between'}>
      {/* Left: Runtime env + working directory */}
      <Flexbox horizontal align={'center'} gap={4}>
        <Popover
          content={modeContent}
          open={modePopoverOpen}
          placement="top"
          styles={{ content: { padding: 4 } }}
          trigger="click"
          onOpenChange={setModePopoverOpen}
        >
          <div>
            {modePopoverOpen ? (
              modeButton
            ) : (
              <Tooltip title={t('runtimeEnv.selectMode')}>{modeButton}</Tooltip>
            )}
          </div>
        </Popover>
        {rightContent()}
        {runtimeMode === 'cloud' && (
          <Tooltip title={t('runtimeEnv.openTerminalWorkspace')}>
            <ActionIcon
              icon={TerminalIcon}
              size={'small'}
              title={t('runtimeEnv.openTerminalWorkspace')}
              onClick={openTerminalWorkspace}
            />
          </Tooltip>
        )}
      </Flexbox>

      {/* Right: Permission control */}
      <ApprovalMode />
    </Flexbox>
  );
});

RuntimeConfig.displayName = 'RuntimeConfig';

export default RuntimeConfig;
