'use client';

import { validateVideoFileSize } from '@lobechat/utils/client';
import { Flexbox } from '@lobehub/ui';
import { Upload } from 'antd';
import { createStaticStyles, css, cssVar, cx } from 'antd-style';
import {
  Blocks,
  FileUp,
  FolderOpenIcon,
  FolderUp,
  Gavel,
  Globe,
  LibraryBig,
  PlusIcon,
} from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { message } from '@/components/AntdStaticMethods';
import { AttachKnowledgeModal } from '@/features/LibraryModal';
import { useProjectModal } from '@/features/Project';
import { createSkillStoreModal } from '@/features/SkillStore';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors, chatConfigByIdSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { topicSelectors } from '@/store/chat/selectors';
import { useFileStore } from '@/store/file';
import { projectSelectors, useProjectStore } from '@/store/project';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';
import type { ModelCouncilSettings } from '@/types/modelCouncil';

import { useAgentId } from '../../hooks/useAgentId';
import { useUpdateAgentConfig } from '../../hooks/useUpdateAgentConfig';
import { useChatInputStore } from '../../store';
import Action from '../components/Action';
import { type ActionDropdownMenuItems } from '../components/ActionDropdown';

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

const PlusActions = memo(() => {
  const { t } = useTranslation('chat');
  const { t: tSetting } = useTranslation('setting');
  const [open, setOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const upload = useFileStore((s) => s.uploadChatFiles);
  const agentId = useAgentId();
  const { updateAgentChatConfig } = useUpdateAgentConfig();
  const { open: openProjectModal } = useProjectModal();

  const { enableKnowledgeBase } = useServerConfigStore(featureFlagsSelectors);

  const councilMode = useChatInputStore((s) => s.councilMode);
  const setCouncilMode = useChatInputStore((s) => s.setCouncilMode);
  const councilSettings = useUserStore(
    (s) =>
      (settingsSelectors.currentSettings(s) as any).modelCouncil as
        | ModelCouncilSettings
        | undefined,
  );
  const councilReady =
    !!councilSettings?.enabled &&
    (councilSettings?.councilModels?.length || 0) >= 2 &&
    !!councilSettings?.judgeModel;
  const showCouncil = councilMode && councilReady;

  const [searchMode, rawSearchMode, enabledKnowledgeBases] = useAgentStore((s) => [
    chatConfigByIdSelectors.getSearchModeById(agentId)(s),
    chatConfigByIdSelectors.getChatConfigById(agentId)(s)?.searchMode,
    agentByIdSelectors
      .getAgentKnowledgeBasesById(agentId)(s)
      .filter((kb) => kb.enabled),
  ]);

  const activeTopicId = useChatStore((s) => s.activeTopicId);
  const activeTopicProjectId = useChatStore((s) => topicSelectors.currentActiveTopic(s)?.projectId);
  const [projectList, addTopicToProject, removeTopicFromProject, setPendingProjectForAgent] =
    useProjectStore((s) => [
      projectSelectors.projectList(s),
      s.addTopicToProject,
      s.removeTopicFromProject,
      s.setPendingProjectForAgent,
    ]);
  const currentProjectId = useProjectStore(projectSelectors.projectIdByTopicId(activeTopicId));
  const effectiveProjectId = activeTopicProjectId ?? currentProjectId;
  const currentProject = useProjectStore(
    effectiveProjectId ? projectSelectors.projectById(effectiveProjectId) : () => null,
  );
  const pendingProjectId = useProjectStore(projectSelectors.pendingProjectIdByAgentId(agentId));
  const pendingProject = useProjectStore(
    pendingProjectId ? projectSelectors.projectById(pendingProjectId) : () => null,
  );

  // When a new topic is created for this agent, apply the pending project association.
  useEffect(() => {
    if (activeTopicId && pendingProjectId && !effectiveProjectId) {
      void addTopicToProject(pendingProjectId, activeTopicId);
      setPendingProjectForAgent(agentId, null);
    }
  }, [
    activeTopicId,
    addTopicToProject,
    agentId,
    effectiveProjectId,
    pendingProjectId,
    setPendingProjectForAgent,
  ]);

  const showSearchIndicator = rawSearchMode === 'auto';
  const showLibraryIndicator = enableKnowledgeBase && enabledKnowledgeBases.length > 0;
  const showProjectIndicator = !!effectiveProjectId || !!pendingProjectId;
  const activeProjectDisplay = currentProject ?? pendingProject;

  const projectChildren: ActionDropdownMenuItems = [
    ...projectList.map((p) => ({
      icon:
        effectiveProjectId === p.id || pendingProjectId === p.id ? (
          <FolderOpenIcon size={16} style={{ color: cssVar.colorInfo }} />
        ) : (
          FolderOpenIcon
        ),
      key: `project-${p.id}`,
      label: p.name,
      onClick: async () => {
        if (!activeTopicId) {
          setPendingProjectForAgent(agentId, pendingProjectId === p.id ? null : p.id);
          return;
        }
        if (effectiveProjectId === p.id) {
          await removeTopicFromProject(p.id, activeTopicId);
        } else {
          if (effectiveProjectId) await removeTopicFromProject(effectiveProjectId, activeTopicId);
          await addTopicToProject(p.id, activeTopicId);
        }
      },
    })),
    ...(projectList.length > 0 ? [{ type: 'divider' as const }] : []),
    {
      icon: PlusIcon,
      key: 'project-new',
      label: t('project.startNew'),
      onClick: () => {
        openProjectModal({
          onSuccess: (newProjectId) => {
            if (!activeTopicId) return;
            void (async () => {
              if (effectiveProjectId)
                await removeTopicFromProject(effectiveProjectId, activeTopicId);
              await addTopicToProject(newProjectId, activeTopicId);
            })();
          },
        });
      },
    },
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
      children: projectChildren,
      icon: showProjectIndicator ? (
        <FolderOpenIcon size={16} style={{ color: cssVar.colorInfo }} />
      ) : (
        FolderOpenIcon
      ),
      key: 'project',
      label: t('project.addTo'),
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
      icon: Blocks,
      key: 'tools',
      label: tSetting('tools.title'),
      onClick: () => {
        createSkillStoreModal();
      },
    },
    {
      disabled: !councilReady,
      icon: showCouncil ? <Gavel size={16} style={{ color: cssVar.colorInfo }} /> : Gavel,
      key: 'model-council',
      label: t('modelCouncil.title'),
      onClick: () => {
        if (councilReady) setCouncilMode(!councilMode);
      },
    },
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
        {showCouncil && (
          <Action
            color={cssVar.colorInfo}
            icon={Gavel}
            showTooltip={false}
            title={t('modelCouncil.title')}
            onClick={() => setCouncilMode(false)}
          />
        )}
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
        {showLibraryIndicator && (
          <Action
            color={cssVar.colorInfo}
            icon={LibraryBig}
            showTooltip={false}
            title={t('knowledgeBase.title')}
            onClick={() => setLibraryOpen(true)}
          />
        )}
        {showProjectIndicator && (
          <Action
            color={cssVar.colorInfo}
            icon={FolderOpenIcon}
            showTooltip={false}
            title={activeProjectDisplay?.name}
            onClick={() => {
              if (activeTopicId && effectiveProjectId) {
                void removeTopicFromProject(effectiveProjectId, activeTopicId);
              } else if (pendingProjectId) {
                setPendingProjectForAgent(agentId, null);
              }
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
