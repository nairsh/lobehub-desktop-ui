'use client';

import { validateVideoFileSize } from '@lobechat/utils/client';
import { Flexbox } from '@lobehub/ui';
import { Upload } from 'antd';
import { createStaticStyles, css, cssVar, cx } from 'antd-style';
import {
  Blocks,
  Brain,
  FileUp,
  FolderUp,
  Globe,
  LibraryBig,
  PlusIcon,
  TypeIcon,
} from 'lucide-react';
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
import { useUserStore } from '@/store/user';
import { labPreferSelectors } from '@/store/user/selectors';

import { useAgentId } from '../../hooks/useAgentId';
import { useUpdateAgentConfig } from '../../hooks/useUpdateAgentConfig';
import { useChatInputStore } from '../../store';
import Action from '../components/Action';
import { type ActionDropdownMenuItems } from '../components/ActionDropdown';
import { useMemoryEnabled } from '../Memory/useMemoryEnabled';

const prefixCls = 'ant';

const styles = createStaticStyles(({ css }) => ({
  compactDropdownMenu: css`
    padding-block: 2px !important;
    padding-inline: 0 !important;

    .${prefixCls}-dropdown-menu, [role='menu'] {
      padding-block: 2px;
    }

    .${prefixCls}-dropdown-menu-item-divider, [role='separator'] {
      margin-block: 2px;
    }

    [role='menuitem'] {
      width: auto !important;
      min-height: 30px;
      margin-inline: 4px;
      padding-block: 2px;
      padding-inline: 6px;
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

const PlusActions = memo(() => {
  const { t } = useTranslation('chat');
  const { t: tSetting } = useTranslation('setting');
  const { t: tEditor } = useTranslation('editor');
  const [open, setOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const upload = useFileStore((s) => s.uploadChatFiles);
  const agentId = useAgentId();
  const { updateAgentChatConfig } = useUpdateAgentConfig();

  const { enableKnowledgeBase } = useServerConfigStore(featureFlagsSelectors);

  const [showTypoBar, setShowTypoBar] = useChatInputStore((s) => [s.showTypoBar, s.setShowTypoBar]);
  const enableRichRender = useUserStore(labPreferSelectors.enableInputMarkdown);

  const [searchMode, rawSearchMode, model, provider, enabledKnowledgeBases] = useAgentStore((s) => [
    chatConfigByIdSelectors.getSearchModeById(agentId)(s),
    chatConfigByIdSelectors.getChatConfigById(agentId)(s)?.searchMode,
    agentByIdSelectors.getAgentModelById(agentId)(s),
    agentByIdSelectors.getAgentModelProviderById(agentId)(s),
    agentByIdSelectors
      .getAgentKnowledgeBasesById(agentId)(s)
      .filter((kb) => kb.enabled),
  ]);
  const isMemoryEnabled = useMemoryEnabled(agentId);
  const supportToolUse = useModelSupportToolUse(model, provider);

  // Only show indicators when explicitly toggled on by user
  const showSearchIndicator = rawSearchMode === 'auto';
  const showMemoryIndicator = isMemoryEnabled;
  const showTypoIndicator = enableRichRender && !!showTypoBar;
  const showLibraryIndicator = enableKnowledgeBase && enabledKnowledgeBases.length > 0;

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
    { key: 'divider-1', type: 'divider' },
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
          { key: 'divider-library', type: 'divider' as const },
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
    ...(enableRichRender
      ? [
          { key: 'divider-2', type: 'divider' as const },
          {
            icon: showTypoBar ? (
              <TypeIcon size={16} style={{ color: cssVar.colorInfo }} />
            ) : (
              TypeIcon
            ),
            key: 'typo',
            label: tEditor(showTypoBar ? 'actions.typobar.off' : 'actions.typobar.on'),
            onClick: () => setShowTypoBar(!showTypoBar),
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
            minWidth: 220,
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
        {showTypoIndicator && (
          <Action
            color={cssVar.colorInfo}
            icon={TypeIcon}
            showTooltip={false}
            title={tEditor('actions.typobar.off')}
            onClick={() => setShowTypoBar(false)}
          />
        )}
      </Flexbox>
      {enableKnowledgeBase && <AttachKnowledgeModal open={libraryOpen} setOpen={setLibraryOpen} />}
    </>
  );
});

PlusActions.displayName = 'PlusActions';

export default PlusActions;
