'use client';

import { validateVideoFileSize } from '@lobechat/utils/client';
import { Flexbox } from '@lobehub/ui';
import { Upload } from 'antd';
import { createStaticStyles, css, cssVar, cx } from 'antd-style';
import { Blocks, Brain, FileUp, FolderUp, Globe, Layers, LibraryBig, PlusIcon } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { message } from '@/components/AntdStaticMethods';
import { AttachKnowledgeModal } from '@/features/LibraryModal';
import { createSkillStoreModal } from '@/features/SkillStore';
import { useModelSupportToolUse } from '@/hooks/useModelSupportToolUse';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors, chatConfigByIdSelectors } from '@/store/agent/selectors';
import { useFileStore } from '@/store/file';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

import { useAgentId } from '../../hooks/useAgentId';
import { useUpdateAgentConfig } from '../../hooks/useUpdateAgentConfig';
import Action from '../components/Action';
import { type ActionDropdownMenuItems } from '../components/ActionDropdown';
import { useMemoryEnabled } from '../Memory/useMemoryEnabled';

type AgentMode =
  | 'agent-builder'
  | 'bot-builder'
  | 'cloud-sandbox'
  | 'group-builder'
  | 'self-iteration';

const prefixCls = 'ant';

const styles = createStaticStyles(({ css }) => ({
  compactDropdownMenu: css`
    padding-block: 4px !important;
    padding-inline: 0 !important;

    .${prefixCls}-dropdown-menu, [role='menu'] {
      padding-block: 4px;
    }

    [role='menuitem'] {
      width: auto !important;
      min-height: 36px;
      margin-inline: 4px;
      padding-block: 6px;
      padding-inline: 14px;

      font-size: 12px;
      color: ${cssVar.colorText} !important;
    }

    [role='menuitem'] svg {
      width: 13px !important;
      height: 13px !important;
      color: ${cssVar.colorText} !important;
    }

    [role='menuitem'] .${prefixCls}-upload {
      color: ${cssVar.colorText};
    }
  `,
}));

// Makes the entire label area clickable (for Antd Upload inside a menu item)
const hotArea = css`
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: transparent;
  }
`;

const MODES: AgentMode[] = [
  'cloud-sandbox',
  'agent-builder',
  'group-builder',
  'bot-builder',
  'self-iteration',
];

const PlusActions = memo(() => {
  const { t } = useTranslation('chat');
  const { t: tSetting } = useTranslation('setting');
  const [open, setOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const upload = useFileStore((s) => s.uploadChatFiles);
  const agentId = useAgentId();
  const { updateAgentChatConfig } = useUpdateAgentConfig();

  const { enableKnowledgeBase } = useServerConfigStore(featureFlagsSelectors);

  const [searchMode, rawSearchMode, model, provider, enabledKnowledgeBases, activeMode] =
    useAgentStore((s) => [
      chatConfigByIdSelectors.getSearchModeById(agentId)(s),
      chatConfigByIdSelectors.getChatConfigById(agentId)(s)?.searchMode,
      agentByIdSelectors.getAgentModelById(agentId)(s),
      agentByIdSelectors.getAgentModelProviderById(agentId)(s),
      agentByIdSelectors
        .getAgentKnowledgeBasesById(agentId)(s)
        .filter((kb) => kb.enabled),
      chatConfigByIdSelectors.getActiveModeById(agentId)(s),
    ]);
  const isMemoryEnabled = useMemoryEnabled(agentId);
  const supportToolUse = useModelSupportToolUse(model, provider);

  const showSearchIndicator = rawSearchMode === 'auto';
  const showMemoryIndicator = isMemoryEnabled;
  const showLibraryIndicator = enableKnowledgeBase && enabledKnowledgeBases.length > 0;
  const showModeIndicator = !!activeMode;

  const setActiveMode = async (mode: AgentMode | undefined) => {
    await updateAgentChatConfig({ activeMode: mode });
  };

  const modeChildren: ActionDropdownMenuItems = [
    // "No mode" option to clear active mode
    {
      icon:
        activeMode === undefined ? (
          <Layers size={16} style={{ color: cssVar.colorInfo }} />
        ) : (
          Layers
        ),
      key: 'mode-none',
      label: t('mode.none'),
      onClick: async () => {
        await setActiveMode(undefined);
      },
    },
    { type: 'divider' },
    ...MODES.map((mode) => ({
      icon: activeMode === mode ? <Layers size={16} style={{ color: cssVar.colorInfo }} /> : Layers,
      key: `mode-${mode}`,
      label: t(`mode.${mode}` as any),
      onClick: async () => {
        await setActiveMode(mode);
      },
    })),
  ];

  const items: ActionDropdownMenuItems = [
    {
      closeOnClick: false,
      icon: FileUp,
      key: 'upload-file',
      label: (
        <Upload
          multiple
          showUploadList={false}
          beforeUpload={async (file) => {
            const validation = validateVideoFileSize(file);
            if (!validation.isValid) {
              message.error(
                t('upload.validation.videoSizeExceeded', { actualSize: validation.actualSize }),
              );
              return false;
            }
            setOpen(false);
            await upload([file]);
            return false;
          }}
        >
          <div className={cx(hotArea)}>{t('upload.action.fileUpload')}</div>
        </Upload>
      ),
    },
    {
      closeOnClick: false,
      icon: FolderUp,
      key: 'upload-folder',
      label: (
        <Upload
          directory
          multiple
          showUploadList={false}
          beforeUpload={async (file) => {
            const validation = validateVideoFileSize(file);
            if (!validation.isValid) {
              message.error(
                t('upload.validation.videoSizeExceeded', { actualSize: validation.actualSize }),
              );
              return false;
            }
            setOpen(false);
            await upload([file]);
            return false;
          }}
        >
          <div className={cx(hotArea)}>{t('upload.action.folderUpload')}</div>
        </Upload>
      ),
    },
    {
      icon: showSearchIndicator ? <Globe size={16} style={{ color: cssVar.colorInfo }} /> : Globe,
      key: 'search',
      label: t('search.title'),
      onClick: async () => {
        await updateAgentChatConfig({ searchMode: searchMode === 'off' ? 'auto' : 'off' });
      },
    },
    {
      icon: isMemoryEnabled ? <Brain size={16} style={{ color: cssVar.colorInfo }} /> : Brain,
      key: 'memory',
      label: t('memory.title'),
      onClick: async () => {
        await updateAgentChatConfig({ memory: { enabled: !isMemoryEnabled } });
      },
    },
    {
      // Modes submenu — hover opens a side flyout with available modes
      children: modeChildren,
      icon: showModeIndicator ? <Layers size={16} style={{ color: cssVar.colorInfo }} /> : Layers,
      key: 'modes',
      label: t('mode.title'),
    },
    {
      disabled: !supportToolUse,
      icon: Blocks,
      key: 'tools',
      label: tSetting('tools.title'),
      onClick: () => {
        createSkillStoreModal();
      },
    },
    ...(enableKnowledgeBase
      ? [
          {
            icon: LibraryBig,
            key: 'library',
            label: t('knowledgeBase.title'),
            onClick: () => {
              setOpen(false);
              setLibraryOpen(true);
            },
          },
        ]
      : []),
  ];

  return (
    <>
      <Flexbox horizontal align={'center'} gap={2}>
        <Action
          icon={PlusIcon}
          open={open}
          showTooltip={false}
          title={t('input.more')}
          dropdown={{
            menu: { className: styles.compactDropdownMenu, items },
            minWidth: 180,
            placement: 'topLeft',
          }}
          onOpenChange={setOpen}
        />
        {showSearchIndicator && (
          <Action
            color={cssVar.colorInfo}
            icon={Globe}
            showTooltip={false}
            title={t('search.title')}
            onClick={async () => {
              await updateAgentChatConfig({ searchMode: 'off' });
            }}
          />
        )}
        {showMemoryIndicator && (
          <Action
            color={cssVar.colorInfo}
            icon={Brain}
            showTooltip={false}
            title={t('memory.title')}
            onClick={async () => {
              await updateAgentChatConfig({ memory: { enabled: false } });
            }}
          />
        )}
        {showLibraryIndicator && (
          <Action
            color={cssVar.colorInfo}
            icon={LibraryBig}
            showTooltip={false}
            title={t('knowledgeBase.title')}
            onClick={() => setLibraryOpen(true)}
          />
        )}
        {showModeIndicator && (
          <Action
            color={cssVar.colorInfo}
            icon={Layers}
            showTooltip={false}
            title={t(`mode.${activeMode}` as any)}
            onClick={async () => {
              await setActiveMode(undefined);
            }}
          />
        )}
      </Flexbox>
      {enableKnowledgeBase && <AttachKnowledgeModal open={libraryOpen} setOpen={setLibraryOpen} />}
    </>
  );
});

PlusActions.displayName = 'PlusActions';

export default PlusActions;
