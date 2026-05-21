'use client';

import { SESSION_CHAT_URL } from '@lobechat/const';
import { ActionIcon, Block, DropdownMenu, Flexbox, Icon, Text } from '@lobehub/ui';
import { Divider } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  BookmarkIcon,
  EditIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  TrashIcon,
} from 'lucide-react';
import { memo, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { type ActionKeys, ChatInputProvider, DesktopChatInput } from '@/features/ChatInput';
import { useProjectModal } from '@/features/Project/ProjectModal';
import { useResourceManagerStore } from '@/routes/(main)/resource/features/store';
import { topicService } from '@/services/topic';
import { useAgentStore } from '@/store/agent';
import { builtinAgentSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { fileChatSelectors, useFileStore } from '@/store/file';
import { projectSelectors, useProjectStore } from '@/store/project';
import {
  setActiveProjectKnowledgeBaseId,
  setActiveProjectSystemPrompt,
} from '@/store/project/projectContext';
import { type ChatTopic } from '@/types/topic';

import { styles } from './style';
import WorkspacePanel from './WorkspacePanel';

dayjs.extend(relativeTime);

interface ProjectWorkspaceProps {
  knowledgeBaseId: string;
  projectId: string;
}

const leftActions: ActionKeys[] = ['plusActions'];
const rightActions: ActionKeys[] = ['model'];

const ProjectWorkspace = memo<ProjectWorkspaceProps>(({ knowledgeBaseId, projectId }) => {
  const { t } = useTranslation('project');
  const navigate = useNavigate();
  const { open: openProjectModal } = useProjectModal();

  const setLibraryId = useResourceManagerStore((s) => s.setLibraryId);
  const project = useProjectStore(projectSelectors.projectById(projectId));
  const isPinned = useProjectStore(projectSelectors.isPinned(projectId));
  const refreshProjects = useProjectStore((s) => s.refreshProjects);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const togglePin = useProjectStore((s) => s.togglePinProject);
  const addTopicToProject = useProjectStore((s) => s.addTopicToProject);
  const storedTopicIds = useProjectStore(projectSelectors.projectTopicIds(projectId));
  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const switchTopic = useChatStore((s) => s.switchTopic);
  const clearChatUploadFileList = useFileStore((s) => s.clearChatUploadFileList);
  const clearChatContextSelections = useFileStore((s) => s.clearChatContextSelections);
  const currentInstructions = project?.settings?.defaultSystemPrompt ?? '';

  const [topics, setTopics] = useState<ChatTopic[]>([]);

  // Load topic details whenever the stored topic ID list changes
  useEffect(() => {
    if (storedTopicIds.length === 0 || !inboxAgentId) {
      setTopics([]);
      return;
    }
    topicService
      .getTopics({ agentId: inboxAgentId, isInbox: true, pageSize: 100 })
      .then(({ items }) => {
        const filtered = items.filter((t) => storedTopicIds.includes(t.id));
        // Preserve the order stored in storedTopicIds (newest first)
        filtered.sort((a, b) => storedTopicIds.indexOf(a.id) - storedTopicIds.indexOf(b.id));
        setTopics(filtered);
      })
      .catch(() => {});
  }, [storedTopicIds, inboxAgentId]);

  useEffect(() => {
    if (!project) refreshProjects();
  }, [project, refreshProjects]);

  useLayoutEffect(() => {
    setLibraryId(knowledgeBaseId);
    return () => setLibraryId(undefined);
  }, [knowledgeBaseId, setLibraryId]);

  useLayoutEffect(() => {
    setActiveProjectKnowledgeBaseId(knowledgeBaseId);
    setActiveProjectSystemPrompt(currentInstructions || undefined);
    return () => {
      setActiveProjectKnowledgeBaseId(undefined);
      setActiveProjectSystemPrompt(undefined);
    };
  }, [knowledgeBaseId, currentInstructions]);

  const handleSend = useCallback(
    async ({ getEditorData }: { getEditorData?: () => unknown }) => {
      const { inputMessage, mainInputEditor } = useChatStore.getState();
      const editorData = getEditorData?.() ?? mainInputEditor?.getJSONState();
      const fileList = fileChatSelectors.chatUploadFileList(useFileStore.getState());
      const contextList = fileChatSelectors.chatContextSelections(useFileStore.getState());

      if (!inputMessage && fileList.length === 0 && contextList.length === 0) return;
      if (!inboxAgentId) return;

      // Capture existing operation IDs so we can detect the new one created by this send
      const existingOpIds = new Set(Object.keys(useChatStore.getState().operations));

      try {
        sendMessage({
          context: { agentId: inboxAgentId },
          contexts: contextList,
          editorData,
          files: fileList,
          message: inputMessage,
          projectSystemPrompt: currentInstructions || undefined,
        });
        navigate(SESSION_CHAT_URL(inboxAgentId, false));
      } finally {
        clearChatUploadFileList();
        clearChatContextSelections();
        mainInputEditor?.clearContent();
      }

      // Subscribe to chat store to capture the topicId once the server creates the topic.
      // The subscription outlives the component because we call useChatStore.subscribe directly.
      const unsubscribe = useChatStore.subscribe(
        (state) => state.operations,
        (ops) => {
          const newEntry = Object.entries(ops).find(
            ([id, op]) =>
              !existingOpIds.has(id) && op.type === 'sendMessage' && op.metadata?.createdTopicId,
          );
          if (newEntry) {
            const topicId = newEntry[1].metadata.createdTopicId as string;
            unsubscribe();
            useProjectStore.getState().addTopicToProject(projectId, topicId);
          }
        },
      );
    },
    [
      currentInstructions,
      inboxAgentId,
      projectId,
      sendMessage,
      navigate,
      clearChatUploadFileList,
      clearChatContextSelections,
      addTopicToProject,
    ],
  );

  const handleOpenTopic = useCallback(
    (topicId: string) => {
      if (!inboxAgentId) return;
      navigate(SESSION_CHAT_URL(inboxAgentId, false));
      // switchTopic is async but we fire-and-forget
      useChatStore.getState().switchTopic(topicId);
    },
    [inboxAgentId, navigate, switchTopic],
  );

  const handleRename = useCallback(() => {
    openProjectModal({
      initialValues: { description: project?.description, name: project?.name },
      projectId,
    });
  }, [openProjectModal, project, projectId]);

  const handleDelete = useCallback(async () => {
    await deleteProject(projectId);
    navigate('/project');
  }, [deleteProject, projectId, navigate]);

  const menuItems = [
    {
      icon: <Icon icon={EditIcon} />,
      key: 'rename',
      label: t('editProject'),
      onClick: handleRename,
    },
    {
      icon: <Icon icon={BookmarkIcon} />,
      key: 'pin',
      label: isPinned
        ? t('unpinProject', { defaultValue: 'Unpin project' })
        : t('pinProject', { defaultValue: 'Pin project' }),
      onClick: () => togglePin(projectId),
    },
    { type: 'divider' as const },
    {
      danger: true,
      icon: <Icon icon={TrashIcon} />,
      key: 'delete',
      label: t('deleteProject'),
      onClick: handleDelete,
    },
  ];

  return (
    <Flexbox className={styles.container} height={'100%'} width={'100%'}>
      {/* ── Scrollable content column ── */}
      <Flexbox className={styles.chatPane} flex={1}>
        {/* Back link */}
        <Flexbox className={styles.backRow}>
          <Link className={styles.backLink} to="/project">
            ← {t('allProjects', { defaultValue: 'All projects' })}
          </Link>
        </Flexbox>

        {/* Title row */}
        <Flexbox horizontal align={'center'} className={styles.titleRow}>
          <Text className={styles.projectTitle} style={{ flex: 1 }}>
            {project?.name ?? '—'}
          </Text>
          <Flexbox horizontal align={'center'} gap={6}>
            <DropdownMenu items={menuItems} nativeButton={false}>
              <ActionIcon
                icon={MoreHorizontalIcon}
                size={'middle'}
                title={t('options', { defaultValue: 'Options' })}
              />
            </DropdownMenu>
            <ActionIcon
              active={isPinned}
              icon={BookmarkIcon}
              size={'middle'}
              title={
                isPinned
                  ? t('unpinProject', { defaultValue: 'Unpin project' })
                  : t('pinProject', { defaultValue: 'Pin project' })
              }
              onClick={() => togglePin(projectId)}
            />
          </Flexbox>
        </Flexbox>

        {/* Description */}
        {project?.description && (
          <Flexbox className={styles.descriptionRow}>
            <Text className={styles.projectDescription}>{project.description}</Text>
          </Flexbox>
        )}

        {/* Chat input + inline panel */}
        <Flexbox horizontal align={'flex-start'} className={styles.inputRow}>
          {/* Left column: chat input + conversations */}
          <Flexbox flex={1}>
            <Flexbox className={styles.inputSection}>
              <ChatInputProvider
                agentId={inboxAgentId}
                allowExpand={false}
                leftActions={leftActions}
                rightActions={rightActions}
                slashPlacement="bottom"
                chatInputEditorRef={(instance) => {
                  if (!instance) return;
                  useChatStore.setState({ mainInputEditor: instance });
                }}
                sendButtonProps={{
                  disabled: !inboxAgentId,
                  generating: false,
                  onStop: () => {},
                  shape: 'round',
                }}
                onSend={handleSend}
                onMarkdownContentChange={(content) => {
                  useChatStore.setState({ inputMessage: content });
                }}
              >
                <DesktopChatInput
                  actionSize={{ blockSize: 32, size: 18 }}
                  borderRadius={12}
                  dropdownPlacement="bottomLeft"
                  inputContainerProps={{ minHeight: 56, resize: false }}
                  showRuntimeConfig={false}
                />
              </ChatInputProvider>
            </Flexbox>

            {/* Chats divider + conversations */}
            <Flexbox className={styles.conversationsSection}>
              <Divider
                orientation={'left'}
                orientationMargin={0}
                style={{ marginBlock: '16px 8px' }}
              >
                <Text style={{ fontSize: 12 }} type={'secondary'}>
                  {t('chats', { defaultValue: 'Chats' })}
                </Text>
              </Divider>
              {topics.length === 0 ? (
                <Flexbox className={styles.conversationsEmpty}>
                  <Text style={{ fontSize: 13 }} type={'secondary'}>
                    {t('noConversations', {
                      defaultValue: 'No conversations yet. Start a chat above to begin.',
                    })}
                  </Text>
                </Flexbox>
              ) : (
                <Flexbox gap={2}>
                  {topics.map((topic) => (
                    <Block
                      clickable
                      horizontal
                      align={'center'}
                      gap={8}
                      height={36}
                      key={topic.id}
                      paddingInline={10}
                      variant={'borderless'}
                      onClick={() => handleOpenTopic(topic.id)}
                    >
                      <Icon flex={'none'} icon={MessageSquareIcon} opacity={0.5} size={'small'} />
                      <Text ellipsis style={{ flex: 1, fontSize: 13 }}>
                        {topic.title ||
                          t('untitledConversation', { defaultValue: 'New conversation' })}
                      </Text>
                      {topic.updatedAt && (
                        <Text flex={'none'} style={{ fontSize: 11 }} type={'secondary'}>
                          {dayjs().diff(dayjs(topic.updatedAt), 'd') < 7
                            ? dayjs(topic.updatedAt).fromNow()
                            : dayjs(topic.updatedAt).format('MMM D')}
                        </Text>
                      )}
                    </Block>
                  ))}
                </Flexbox>
              )}
            </Flexbox>
          </Flexbox>

          {/* Right: inline panel */}
          <WorkspacePanel
            knowledgeBaseId={knowledgeBaseId}
            project={project}
            projectId={projectId}
          />
        </Flexbox>
      </Flexbox>
    </Flexbox>
  );
});

ProjectWorkspace.displayName = 'ProjectWorkspace';

export default ProjectWorkspace;
