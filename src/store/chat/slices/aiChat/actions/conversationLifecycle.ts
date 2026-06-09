// Disable the auto sort key eslint rule to make the code more logic and readable
import { createCallAgentManifest } from '@lobechat/builtin-tool-agent-management';
import { ENABLE_BUSINESS_FEATURES } from '@lobechat/business-const';
import { LOADING_FLAT } from '@lobechat/const';
import { formatSelectedSkillsContext, formatSelectedToolsContext } from '@lobechat/context-engine';
import { chainCompressContext } from '@lobechat/prompts';
import {
  type ChatImageItem,
  type ChatThreadType,
  type ChatVideoItem,
  type ConversationContext,
  type SendMessageParams,
  type SendMessageServerResponse,
} from '@lobechat/types';
import { nanoid } from '@lobechat/utils';
import { TRPCClientError } from '@trpc/client';
import { t } from 'i18next';

import { markUserValidAction } from '@/business/client/markUserValidAction';
import { agentRuntimeClient } from '@/services/agentRuntime/client';
import { aiChatService } from '@/services/aiChat';
import { chatService } from '@/services/chat';
import { resolveSelectedSkillsWithContent } from '@/services/chat/mecha/skillPreload';
import { resolveSelectedToolsWithContent } from '@/services/chat/mecha/toolPreload';
import { messageService } from '@/services/message';
import { modelCouncilService } from '@/services/modelCouncil';
import {
  isOpenTerminalApiMissing,
  openTerminalWorkspaceService,
} from '@/services/openTerminalWorkspace';
import { getAgentStoreState } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { agentGroupByIdSelectors, getChatGroupStoreState } from '@/store/agentGroup';
import { type ChatStore } from '@/store/chat/store';
import {
  createPendingCompressedGroup,
  getCompressionCandidateMessageIds,
  hasRunningCompressionOperation,
} from '@/store/chat/utils/compression';
import { getFileStoreState } from '@/store/file/store';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import {
  setActiveProjectKnowledgeBaseId,
  setActiveProjectSystemPrompt,
} from '@/store/project/projectContext';
import { type StoreSetter } from '@/store/types';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';
import { useUserMemoryStore } from '@/store/userMemory';
import type { ModelCouncilSettings } from '@/types/modelCouncil';

import { dbMessageSelectors, displayMessageSelectors, topicSelectors } from '../../../selectors';
import { messageMapKey } from '../../../utils/messageMapKey';
import {
  type CommandSendOverrides,
  hasNonActionContent,
  injectReferTopicNode,
  parseMentionedAgentsFromEditorData,
  parseSelectedSkillsFromEditorData,
  parseSelectedToolsFromEditorData,
  processCommands,
} from './commandBus';
/**
 * Extended params for sendMessage with context
 */
export interface SendMessageWithContextParams extends SendMessageParams {
  /**
   * Conversation context (required for cross-store usage)
   * Contains sessionId, topicId, and threadId
   */
  context: ConversationContext;
  /**
   * Optional system prompt from the active project.
   * Appended to the agent's system role for the duration of this LLM call.
   */
  /**
   * Fired once the conversation is persisted server-side and the topic is known,
   * BEFORE the AI response streams. Lets callers switch into the chat view
   * immediately instead of waiting for the full response to finish.
   */
  onConversationStart?: (info: { topicId?: string }) => void;
  overrideCouncil?: ModelCouncilSettings;
  projectKnowledgeBaseId?: string;
  projectSystemPrompt?: string;
  skipTopicSwitch?: boolean;
  useModelCouncil?: boolean;
}

/**
 * Result returned from sendMessage
 */
export interface SendMessageResult {
  /** The created assistant message ID */
  assistantMessageId: string;
  /** The created thread ID (if a new thread was created) */
  createdThreadId?: string;
  /** The topic ID used for this message, including a newly created topic. */
  topicId?: string;
  /** The created user message ID */
  userMessageId: string;
}

/**
 * Actions managing the complete lifecycle of conversations including sending,
 * regenerating, and resending messages
 */

type Setter = StoreSetter<ChatStore>;
export const conversationLifecycle = (set: Setter, get: () => ChatStore, _api?: unknown) =>
  new ConversationLifecycleActionImpl(set, get, _api);

const isAbortError = (error: unknown, abortController?: AbortController) =>
  !!abortController?.signal.aborted ||
  (error instanceof Error &&
    (error.name === 'AbortError' ||
      error.message.includes('aborted') ||
      error.message.includes('cancelled')));

const createAbortError = () =>
  Object.assign(new Error('Compression cancelled'), { name: 'AbortError' });

const getCurrentModelCouncilSettings = () =>
  (settingsSelectors.currentSettings(useUserStore.getState()) as any).modelCouncil as
    | ModelCouncilSettings
    | undefined;

// Guards against attaching two SSE connections to the same council operation
// (e.g. the send flow and the on-mount resume effect racing each other).
const activeModelCouncilStreams = new Set<string>();

const isTerminalStatus = (status?: string) =>
  status === 'completed' || status === 'failed' || status === 'timeout' || status === 'canceled';

const collectModelCouncilSteps = (item: { children?: any[]; id?: string; metadata?: any }) => {
  const entries: [string, any[]][] = [];
  const steps = item.metadata?.modelCouncil?.steps;

  if (item.id && Array.isArray(steps) && steps.length > 0) entries.push([item.id, steps]);

  if (Array.isArray(item.children)) {
    for (const child of item.children) entries.push(...collectModelCouncilSteps(child));
  }

  return entries;
};

const collectModelCouncilMessageIds = (item: { children?: any[]; id?: string; metadata?: any }) => {
  const ids: string[] = [];
  const role = item.metadata?.modelCouncil?.role;

  if (item.id && (role === 'judge' || role === 'member')) ids.push(item.id);

  if (Array.isArray(item.children)) {
    for (const child of item.children) ids.push(...collectModelCouncilMessageIds(child));
  }

  return ids;
};

const getModelCouncilStepKey = (step: any) => {
  if (step?.stepType === 'grounding') {
    const g = step.grounding;
    const queries = g?.searchQueries || g?.queries || g?.query || '';
    const queryStr = Array.isArray(queries) ? queries.join(',') : String(queries);
    return `grounding:${queryStr}`;
  }

  return;
};

// Synthetic "web search enabled" placeholder the server used to emit even when no
// real search ran — drop it so we never show a fake "Searching: <prompt>" step.
const isSyntheticModelCouncilStep = (step: any) =>
  step?.stepType === 'grounding' &&
  (step.grounding?.synthetic === true || step.grounding?.source === 'model_builtin_search');

// `toolsCalling` arrives as a cumulative array that grows per chunk. Keep a single
// tools_calling step and replace it in place instead of appending one per chunk
// (the source of the bogus "Using tool ×27").
const mergeModelCouncilStep = (currentSteps: any[], step: any) => {
  if (isSyntheticModelCouncilStep(step)) return currentSteps;

  if (step.stepType === 'tools_calling') {
    const index = currentSteps.findIndex((item) => item.stepType === 'tools_calling');
    if (index >= 0) {
      const next = [...currentSteps];
      next[index] = { ...step, at: currentSteps[index].at ?? step.at };
      return next;
    }
    return [...currentSteps, step];
  }

  const stepKey = getModelCouncilStepKey(step);
  if (stepKey && currentSteps.some((item) => getModelCouncilStepKey(item) === stepKey)) {
    return currentSteps;
  }
  return [...currentSteps, step];
};

export class ConversationLifecycleActionImpl {
  readonly #get: () => ChatStore;

  constructor(set: Setter, get: () => ChatStore, _api?: unknown) {
    void _api;
    void set;
    this.#get = get;
  }

  /**
   * Attach an SSE connection for a Model Council operation and mirror its
   * events into the message map. Used by the send flow, the on-mount resume
   * (after a reload while a council is still running server-side), and member
   * retry.
   */
  internal_attachModelCouncilStream = (params: {
    context: any;
    /** attach even if a connection for this operation is already registered */
    force?: boolean;
    isCouncilNewTopic?: boolean;
    messageGroupId?: string;
    /** client operation id used to scope dispatches (send flow only) */
    scopeOperationId?: string;
    seededMessages: any[];
    serverOperationId: string;
    topicId?: string | null;
  }) => {
    const {
      context,
      force,
      isCouncilNewTopic,
      messageGroupId,
      scopeOperationId,
      seededMessages,
      serverOperationId,
      topicId,
    } = params;

    if (!force && activeModelCouncilStreams.has(serverOperationId)) return;
    activeModelCouncilStreams.add(serverOperationId);

    const scope = scopeOperationId ? { operationId: scopeOperationId } : undefined;

    const contentByMessageId = new Map<string, string>();
    const reasoningByMessageId = new Map<string, string>();
    const statusByMessageId = new Map<string, string>();
    const stepsByMessageId = new Map<string, any[]>();
    const modelCouncilMessageIds = seededMessages.flatMap((item) =>
      collectModelCouncilMessageIds(item),
    );
    for (const item of seededMessages) {
      for (const [messageId, steps] of collectModelCouncilSteps(item)) {
        stepsByMessageId.set(messageId, steps);
      }
    }

    agentRuntimeClient.createStreamConnection(serverOperationId, {
      includeHistory: true,
      onDisconnect: async () => {
        activeModelCouncilStreams.delete(serverOperationId);
        if (topicId) this.#get().internal_updateTopicLoading(topicId, false);
        await this.#get().refreshMessages(context);

        // Auto-generate title for newly created Model Council topics.
        // Must run after refreshMessages so the DB messages are available.
        if (isCouncilNewTopic && topicId) {
          messageService
            .getMessages(context)
            .then((msgs) => this.#get().summaryTopicTitle(topicId, msgs))
            .catch(console.error);
        }
      },
      onError: (error) => {
        activeModelCouncilStreams.delete(serverOperationId);
        if (topicId) this.#get().internal_updateTopicLoading(topicId, false);

        const message =
          error instanceof Error ? error.message : t('error.unknownError', 'Stream error');

        for (const messageId of modelCouncilMessageIds) {
          if (isTerminalStatus(statusByMessageId.get(messageId))) continue;

          statusByMessageId.set(messageId, 'failed');
          this.#get().internal_dispatchMessage(
            {
              id: messageId,
              type: 'updateMessage',
              value: {
                error: {
                  message,
                  type: 'ModelCouncilStreamError' as any,
                },
                metadata: {
                  modelCouncil: {
                    status: 'failed',
                    steps: stepsByMessageId.get(messageId),
                  },
                } as any,
              },
            },
            scope,
          );
        }

        if (messageGroupId) {
          this.#get().internal_dispatchMessage(
            {
              id: messageGroupId,
              type: 'updateMessageGroupMetadata',
              value: { status: 'failed' },
            },
            scope,
          );
        }
      },
      onEvent: (event: any) => {
        const eventData = event.data || {};
        switch (event.type) {
          case 'model_council_member_chunk':
          case 'model_council_judge_chunk': {
            const messageId = eventData.messageId;
            if (!messageId) return;

            const reasoningDelta =
              eventData.reasoning ||
              eventData.thinking ||
              (eventData.chunkType === 'reasoning' ? eventData.text : undefined);
            const textDelta = eventData.chunkType === 'reasoning' ? undefined : eventData.text;

            const value: Record<string, any> = {
              metadata: { modelCouncil: { status: 'running' } },
            };

            if (textDelta) {
              const nextContent = `${contentByMessageId.get(messageId) || ''}${textDelta}`;
              contentByMessageId.set(messageId, nextContent);
              value.content = nextContent;
            }

            if (reasoningDelta) {
              const nextReasoning = `${reasoningByMessageId.get(messageId) || ''}${reasoningDelta}`;
              reasoningByMessageId.set(messageId, nextReasoning);
              value.reasoning = { content: nextReasoning };
            }

            this.#get().internal_dispatchMessage(
              { id: messageId, type: 'updateMessage', value },
              scope,
            );
            return;
          }
          case 'model_council_member_step':
          case 'model_council_judge_step': {
            const messageId = eventData.messageId;
            if (!messageId) return;

            const step = {
              at: Date.now(),
              grounding: eventData.grounding,
              stepType: eventData.stepType,
              toolsCalling: eventData.toolsCalling,
            };
            const currentSteps = stepsByMessageId.get(messageId) || [];
            const nextSteps = mergeModelCouncilStep(currentSteps, step);
            stepsByMessageId.set(messageId, nextSteps);

            this.#get().internal_dispatchMessage(
              {
                id: messageId,
                type: 'updateMessage',
                value: {
                  metadata: {
                    modelCouncil: {
                      status: statusByMessageId.get(messageId) || 'running',
                      steps: nextSteps,
                    },
                  } as any,
                },
              },
              scope,
            );
            return;
          }
          case 'model_council_member_end':
          case 'model_council_judge_end': {
            const messageId = eventData.messageId;
            if (!messageId) return;
            const content = eventData.content || contentByMessageId.get(messageId) || '';
            const reasoning = eventData.reasoning || reasoningByMessageId.get(messageId);
            const steps = stepsByMessageId.get(messageId);
            contentByMessageId.set(messageId, content);
            statusByMessageId.set(messageId, 'completed');
            this.#get().internal_dispatchMessage(
              {
                id: messageId,
                type: 'updateMessage',
                value: {
                  content,
                  reasoning: reasoning ? { content: reasoning } : undefined,
                  metadata: {
                    modelCouncil: {
                      status: 'completed',
                      steps,
                      usage: eventData.usage,
                    },
                  } as any,
                },
              },
              scope,
            );
            return;
          }
          case 'model_council_member_error': {
            const messageId = eventData.messageId;
            if (!messageId) return;
            statusByMessageId.set(messageId, eventData.status || 'failed');
            this.#get().internal_dispatchMessage(
              {
                id: messageId,
                type: 'updateMessage',
                value: {
                  error: {
                    message: eventData.message,
                    type: 'ModelCouncilMemberError' as any,
                  },
                  metadata: { modelCouncil: { status: eventData.status || 'failed' } } as any,
                },
              },
              scope,
            );
            return;
          }
          case 'model_council_judge_start': {
            const messageId = eventData.messageId;
            if (!messageId) return;
            this.#get().internal_dispatchMessage(
              {
                id: messageId,
                type: 'updateMessage',
                value: { metadata: { modelCouncil: { status: 'running' } } as any },
              },
              scope,
            );
            if (eventData.groupId) {
              this.#get().internal_dispatchMessage(
                {
                  id: eventData.groupId,
                  type: 'updateMessageGroupMetadata',
                  value: { status: 'judging' },
                },
                scope,
              );
            }
            return;
          }
          case 'model_council_end': {
            if (!eventData.groupId) return;
            this.#get().internal_dispatchMessage(
              {
                id: eventData.groupId,
                type: 'updateMessageGroupMetadata',
                value: {
                  members: eventData.members,
                  status: eventData.status || 'completed',
                },
              },
              scope,
            );
            return;
          }
        }
      },
    });
  };

  /**
   * Re-attach to a council operation that is still running server-side after
   * an app reload. Safe to call repeatedly — duplicate attaches are ignored.
   */
  resumeModelCouncilStream = (params: { groupMessage: any; operationId: string }) => {
    const context = this.#get().internal_getConversationContext();
    this.internal_attachModelCouncilStream({
      context,
      messageGroupId: params.groupMessage?.id,
      seededMessages: [params.groupMessage],
      serverOperationId: params.operationId,
      topicId: params.groupMessage?.topicId ?? context.topicId,
    });
  };

  retryCouncilMember = async (params: { groupMessage: any; memberMessageId: string }) => {
    const result = await modelCouncilService.retryMember(params.memberMessageId);
    const context = this.#get().internal_getConversationContext();
    this.internal_attachModelCouncilStream({
      context,
      force: true,
      messageGroupId: result.messageGroupId,
      seededMessages: [params.groupMessage],
      serverOperationId: result.operationId,
      topicId: params.groupMessage?.topicId ?? context.topicId,
    });
    if (params.groupMessage?.topicId)
      this.#get().internal_updateTopicLoading(params.groupMessage.topicId, true);
  };

  sendMessage = async ({
    message,
    editorData: inputEditorData,
    files,
    onlyAddUserMessage,
    context,
    messages: inputMessages,
    parentId: inputParentId,
    pageSelections,
    projectKnowledgeBaseId,
    projectSystemPrompt,
    skipTopicSwitch,
    overrideCouncil,
    useModelCouncil,
    onConversationStart,
  }: SendMessageWithContextParams): Promise<SendMessageResult | undefined> => {
    let editorData = inputEditorData;
    const { internal_execAgentRuntime, mainInputEditor } = this.#get();
    const selectedSkills = parseSelectedSkillsFromEditorData(editorData);
    const selectedTools = parseSelectedToolsFromEditorData(editorData);
    const mentionedAgents = parseMentionedAgentsFromEditorData(editorData);

    // Use context from params (required)
    const { agentId } = context;
    // If creating new thread (isNew + scope='thread'), threadId will be created by server
    const isCreatingNewThread = context.isNew && context.scope === 'thread';
    // Build newThread params for server from new context format
    // Only create newThread if we have both sourceMessageId and threadType
    const newThread =
      isCreatingNewThread && context.sourceMessageId && context.threadType
        ? {
            sourceMessageId: context.sourceMessageId,
            type: context.threadType as ChatThreadType,
          }
        : undefined;

    if (!agentId) return;

    // ── Command Bus: extract and process built-in commands from editorData ──
    const commandOverrides: CommandSendOverrides = processCommands({
      message,
      editorData,
      files,
      onlyAddUserMessage,
      context,
      messages: inputMessages,
      parentId: inputParentId,
      pageSelections,
    });

    // /compact — directly compress context without sending any message
    if (commandOverrides.triggerCompression) {
      const compressContext = { ...context };
      if (
        compressContext.topicId &&
        !hasRunningCompressionOperation(Object.values(this.#get().operations), compressContext)
      ) {
        await this.executeCompression(compressContext, '');
      }
      return;
    }

    // /newTopic — force a fresh topic regardless of current context
    let forceNewTopicFromExisting = false;
    if (commandOverrides.forceNewTopic) {
      const hasFile = files && files.length > 0;
      // If no message content besides the action tag and no files, just navigate to a new topic without sending
      if (!hasNonActionContent(editorData) && !hasFile) {
        await this.#get().switchTopic(null);
        return;
      }

      if (context.topicId) {
        const originalTopic = topicSelectors.getTopicById(context.topicId)(this.#get());
        const topicTitle = originalTopic?.title || '';
        // Inject referTopic into content for LLM context
        const referTag = `<refer_topic name="${topicTitle}" id="${context.topicId}" />`;
        message = `${referTag}\n${message}`;
        // Inject refer-topic node into editorData for rich text display
        editorData = injectReferTopicNode(editorData, context.topicId, topicTitle);
        forceNewTopicFromExisting = true;
      }
      context = { ...context, topicId: undefined };
    }

    // When creating new thread, override threadId to undefined (server will create it)
    // Check if current agentId is the supervisor agent of the group
    let isGroupSupervisor = false;
    if (context.groupId) {
      const group = agentGroupByIdSelectors.groupById(context.groupId)(getChatGroupStoreState());
      isGroupSupervisor = group?.supervisorAgentId === agentId;
    }
    // In non-group context, @agent mentions make the current agent act as supervisor
    const hasMentionedAgents = !context.groupId && mentionedAgents.length > 0;

    const operationContext = {
      ...context,
      ...(isCreatingNewThread && { threadId: undefined }),
      // Only set isSupervisor for actual group supervisors — NOT for @agent mentions.
      // isSupervisor triggers group-specific UI rendering (SupervisorMessage with group avatars).
      ...(isGroupSupervisor && { isSupervisor: true }),
    };

    const fileIdList = files?.map((f) => f.id);

    // Enrich selected skills/tools with preloaded content, injected directly
    // via SelectedSkillInjector/SelectedToolInjector — no fake tool-call preload messages
    const enrichedSelectedSkills = await resolveSelectedSkillsWithContent({
      message,
      selectedSkills,
    });
    const enrichedSelectedTools = resolveSelectedToolsWithContent({
      message,
      selectedTools,
    });

    const hasFile = !!fileIdList && fileIdList.length > 0;

    // if message is empty or no files, then stop
    if (!message && !hasFile) return;

    // ━━━ Message Queue: enqueue if agent is currently running ━━━
    // Check if there's a running execAgentRuntime operation in the current context.
    // If so, enqueue the message instead of starting a new operation.
    const currentContextKey = messageMapKey(operationContext);
    const contextOpIds = this.#get().operationsByContext[currentContextKey] || [];
    const runningAgentOp = contextOpIds
      .map((id) => this.#get().operations[id])
      .find((op) => op && op.type === 'execAgentRuntime' && op.status === 'running');

    if (runningAgentOp) {
      this.#get().enqueueMessage(
        currentContextKey,
        {
          id: nanoid(),
          content: message,
          editorData: editorData ?? undefined,
          files: fileIdList,
          interruptMode: 'soft',
          createdAt: Date.now(),
        },
        runningAgentOp.id,
      );
      return;
    }

    if (onlyAddUserMessage) {
      await this.#get().addUserMessage({ message, fileList: fileIdList });

      return;
    }

    // Use provided messages or query from store
    // For /newTopic from existing topic, start with empty message list (fresh topic)
    const contextKey = messageMapKey(context);
    const messages = forceNewTopicFromExisting
      ? []
      : (inputMessages ?? displayMessageSelectors.getDisplayMessagesByKey(contextKey)(this.#get()));
    const lastMessage = messages.at(-1);

    useUserMemoryStore.getState().setActiveMemoryContext({
      agent: agentSelectors.getAgentMetaById(agentId)(getAgentStoreState()),
      topic: topicSelectors.currentActiveTopic(this.#get()),
      latestUserMessage: lastMessage?.content,
      sendingMessage: message,
    });

    // Use provided parentId or calculate from messages
    let parentId: string | undefined = forceNewTopicFromExisting ? undefined : inputParentId;
    if (!parentId && lastMessage) {
      parentId = displayMessageSelectors.findLastMessageId(lastMessage.id)(this.#get());
    }

    // Create operation for send message first, so we can use operationId for optimistic updates
    const tempId = 'tmp_' + nanoid();
    const tempAssistantId = 'tmp_' + nanoid();
    const { operationId, abortController } = this.#get().startOperation({
      type: 'sendMessage',
      context: { ...operationContext, messageId: tempId },
      label: 'Send Message',
      metadata: {
        // Mark this as thread operation if threadId exists
        inThread: !!operationContext.threadId,
      },
    });

    // Construct local media preview for server-mode temporary messages (S3 URL takes priority)
    const filesInStore = getFileStoreState().chatUploadFileList;
    const tempImages: ChatImageItem[] = filesInStore
      .filter((f) => f.file?.type?.startsWith('image'))
      .map((f) => ({
        id: f.id,
        url: f.fileUrl || f.base64Url || f.previewUrl || '',
        alt: f.file?.name || f.id,
      }));
    const tempVideos: ChatVideoItem[] = filesInStore
      .filter((f) => f.file?.type?.startsWith('video'))
      .map((f) => ({
        id: f.id,
        url: f.fileUrl || f.base64Url || f.previewUrl || '',
        alt: f.file?.name || f.id,
      }));

    // use optimistic update to avoid the slow waiting (now with operationId for correct context)
    this.#get().optimisticCreateTmpMessage(
      {
        content: message,
        editorData: editorData ?? undefined,
        // if message has attached with files, then add files to message and the agent
        files: fileIdList,
        role: 'user',
        agentId: operationContext.agentId,
        // if there is topicId, then add topicId to message
        topicId: operationContext.topicId ?? undefined,
        threadId: operationContext.threadId ?? undefined,
        imageList: tempImages.length > 0 ? tempImages : undefined,
        videoList: tempVideos.length > 0 ? tempVideos : undefined,
        // Pass pageSelections metadata for immediate display
        metadata: pageSelections?.length ? { pageSelections } : undefined,
      },
      { operationId, tempMessageId: tempId },
    );
    this.#get().optimisticCreateTmpMessage(
      {
        content: LOADING_FLAT,
        role: 'assistant',
        agentId: operationContext.agentId,
        // if there is topicId, then add topicId to message
        topicId: operationContext.topicId ?? undefined,
        threadId: operationContext.threadId ?? undefined,
        // Pass isSupervisor metadata for group orchestration (consistent with server)
        metadata: operationContext.isSupervisor ? { isSupervisor: true } : undefined,
      },
      { operationId, tempMessageId: tempAssistantId },
    );

    // Associate temp messages with operation
    this.#get().associateMessageWithOperation(tempId, operationId);
    this.#get().associateMessageWithOperation(tempAssistantId, operationId);

    // Store editor state in operation metadata for cancel restoration
    const jsonState = inputEditorData ?? mainInputEditor?.getJSONState();
    this.#get().updateOperationMetadata(operationId, {
      inputEditorTempState: jsonState,
      inputSendErrorMsg: undefined,
    });

    // ── Gateway mode: skip sendMessageInServer, let execAgentTask handle everything ──
    if (this.#get().isGatewayModeEnabled()) {
      this.#get().completeOperation(operationId);

      try {
        const result = await this.#get().executeGatewayAgent({
          context: operationContext,
          fileIds: fileIdList,
          message,
        });

        return {
          assistantMessageId: result.assistantMessageId,
          userMessageId: result.userMessageId,
        };
      } catch (e) {
        console.error('[Gateway] Failed to start server-side agent:', e);
        this.#get().failOperation(operationId, {
          message: e instanceof Error ? e.message : 'Unknown error',
          type: 'GatewayError',
        });
        return;
      }
    }

    if (useModelCouncil) {
      let data: any;
      try {
        const topicId = operationContext.topicId;
        const isCouncilNewTopic = !topicId;
        const councilOverride = overrideCouncil || getCurrentModelCouncilSettings();

        data = await modelCouncilService.start(
          {
            agentId: operationContext.agentId,
            editorData,
            files: fileIdList,
            groupId: operationContext.groupId ?? undefined,
            newTopic: !topicId
              ? {
                  topicMessageIds: forceNewTopicFromExisting ? [] : messages.map((m) => m.id),
                  title: message.slice(0, 20) || t('defaultTitle', { ns: 'topic' }),
                }
              : undefined,
            overrideCouncil: councilOverride,
            pageSelections,
            parentId,
            prompt: message,
            threadId: operationContext.threadId ?? undefined,
            topicId: topicId ?? undefined,
          },
          abortController,
        );

        const requestedCouncilCount = councilOverride?.councilModels?.length || 0;
        const acceptedCouncilCount = data.settingsSnapshot?.councilModels?.length || 0;

        if (requestedCouncilCount > 0 && acceptedCouncilCount !== requestedCouncilCount) {
          console.warn('[ModelCouncil] Backend accepted fewer council models than requested', {
            accepted: data.settingsSnapshot?.councilModels,
            acceptedCouncilCount,
            requested: councilOverride?.councilModels,
            requestedCouncilCount,
          });
        }

        const finalContext = {
          ...operationContext,
          topicId: data.topicId ?? operationContext.topicId,
          threadId: operationContext.threadId,
        };

        // Council may have created the topic server-side, so the operation's
        // context still carries the pre-council topicId (undefined for a new
        // chat). Align it with finalContext so the live stream dispatches below
        // — all keyed by { operationId } — resolve to the same message-map
        // bucket the council messages are displayed in; otherwise every
        // streamed reasoning/text update no-ops and only appears after the
        // final refreshMessages on disconnect.
        this.#get().updateOperationContext(operationId, {
          threadId: finalContext.threadId,
          topicId: finalContext.topicId,
        });

        if (data?.topics) {
          const pageSize = systemStatusSelectors.topicPageSize(useGlobalStore.getState());
          this.#get().internal_updateTopics(operationContext.agentId, {
            groupId: operationContext.groupId,
            items: data.topics.items,
            pageSize,
            total: data.topics.total,
          });
          this.#get().updateOperationMetadata(operationId, { createdTopicId: data.topicId });
        } else if (operationContext.topicId) {
          this.#get().internal_dispatchTopic({
            type: 'updateTopic',
            id: operationContext.topicId,
            value: { updatedAt: Date.now() },
          });
        }

        const seededMessages = data.messages || [];

        this.#get().replaceMessages(seededMessages, {
          context: finalContext,
          action: 'sendMessage/modelCouncilResponse',
        });

        if (data.isCreateNewTopic && data.topicId && !skipTopicSwitch) {
          await this.#get().switchTopic(data.topicId, {
            clearNewKey: true,
            skipRefreshMessage: true,
          });
        }

        this.#get().completeOperation(operationId);
        if (data.topicId) this.#get().internal_updateTopicLoading(data.topicId, true);

        this.internal_attachModelCouncilStream({
          context: finalContext,
          force: true,
          isCouncilNewTopic,
          messageGroupId: data.messageGroupId,
          scopeOperationId: operationId,
          seededMessages,
          serverOperationId: data.operationId,
          topicId: data.topicId,
        });

        if (ENABLE_BUSINESS_FEATURES) markUserValidAction();

        onConversationStart?.({ topicId: data.topicId });

        return {
          assistantMessageId: data.judgeMessageId,
          topicId: data.topicId,
          userMessageId: data.userMessageId,
        };
      } catch (e) {
        console.error(e);
        this.#get().failOperation(operationId, {
          type: e instanceof Error ? e.name : 'model_council_error',
          message: e instanceof Error ? e.message : 'Unknown error',
        });
      } finally {
        if (!data) {
          this.#get().internal_dispatchMessage(
            { type: 'deleteMessages', ids: [tempId, tempAssistantId] },
            { operationId },
          );
        }
      }

      return;
    }

    // ── Client mode: send via server API then run agent locally ──
    let data: SendMessageServerResponse | undefined;
    try {
      const agentConfig = agentSelectors.getAgentConfigById(agentId)(getAgentStoreState());
      // For agent-free sessions (ssn_ prefix) the agentMap may not be populated yet.
      // Empty strings are stripped by cleanObject so the server falls through to session_configs.
      const model = agentConfig?.model ?? '';
      const provider = agentConfig?.provider ?? '';

      const topicId = operationContext.topicId;

      // Persist selected skill/tool context into user message content so it survives across turns.
      // Deduplicate: skip skills/tools already @mentioned in earlier messages (via editorData).
      const previouslyMentionedSkills = new Set<string>();
      const previouslyMentionedTools = new Set<string>();

      for (const m of messages) {
        if (m.role !== 'user') continue;
        for (const s of parseSelectedSkillsFromEditorData(m.editorData ?? undefined)) {
          previouslyMentionedSkills.add(s.identifier);
        }
        for (const t of parseSelectedToolsFromEditorData(m.editorData ?? undefined)) {
          previouslyMentionedTools.add(t.identifier);
        }
      }
      const dedupedSkills = enrichedSelectedSkills.filter(
        (s) => !previouslyMentionedSkills.has(s.identifier),
      );
      const dedupedTools = enrichedSelectedTools.filter(
        (t) => !previouslyMentionedTools.has(t.identifier),
      );

      const skillContext = formatSelectedSkillsContext(dedupedSkills);
      const toolContext = formatSelectedToolsContext(dedupedTools);
      const contextSuffix = [skillContext, toolContext].filter(Boolean).join('\n');
      const persistedContent = contextSuffix ? `${message}\n\n${contextSuffix}` : message;

      data = await aiChatService.sendMessageInServer(
        {
          newUserMessage: {
            content: persistedContent,
            editorData,
            files: fileIdList,
            pageSelections,
            parentId,
          },
          preloadMessages: undefined,
          // if there is topicId, then add topicId to message
          topicId: topicId ?? undefined,
          threadId: operationContext.threadId ?? undefined,
          // Support creating new thread along with message
          newThread: newThread
            ? {
                sourceMessageId: newThread.sourceMessageId,
                type: newThread.type,
              }
            : undefined,
          newTopic: !topicId
            ? {
                topicMessageIds: forceNewTopicFromExisting ? [] : messages.map((m) => m.id),
                title: message.slice(0, 20) || t('defaultTitle', { ns: 'topic' }),
              }
            : undefined,
          agentId: operationContext.agentId,
          // Pass groupId for group chat scenarios
          groupId: operationContext.groupId ?? undefined,
          newAssistantMessage: {
            // Pass isSupervisor metadata for group orchestration
            metadata: operationContext.isSupervisor ? { isSupervisor: true } : undefined,
            model,
            provider: provider!,
          },
        },
        abortController,
      );
      // Use created topicId/threadId if available, otherwise use original from context
      let finalTopicId = operationContext.topicId;
      const finalThreadId = data.createdThreadId ?? operationContext.threadId;

      // refresh the total data
      if (data?.topics) {
        const pageSize = systemStatusSelectors.topicPageSize(useGlobalStore.getState());
        this.#get().internal_updateTopics(operationContext.agentId, {
          groupId: operationContext.groupId,
          items: data.topics.items,
          pageSize,
          total: data.topics.total,
        });
        finalTopicId = data.topicId;

        // Record the created topicId in metadata (not context)
        this.#get().updateOperationMetadata(operationId, { createdTopicId: data.topicId });
      } else if (operationContext.topicId) {
        // Optimistically update topic's updatedAt so sidebar re-groups immediately
        this.#get().internal_dispatchTopic({
          type: 'updateTopic',
          id: operationContext.topicId,
          value: { updatedAt: Date.now() },
        });
      }

      // Record created threadId in operation metadata
      if (data.createdThreadId) {
        this.#get().updateOperationMetadata(operationId, { createdThreadId: data.createdThreadId });

        // Update portalThreadId to switch from "new thread" mode to "existing thread" mode
        // This ensures the Portal Thread UI displays correctly with the real thread ID
        this.#get().openThreadInPortal(data.createdThreadId, context.sourceMessageId);

        // Refresh threads list to update the sidebar
        this.#get().refreshThreads();
      }

      // Create final context with updated topicId/threadId from server response
      const finalContext = { ...operationContext, topicId: finalTopicId, threadId: finalThreadId };
      this.#get().replaceMessages(data.messages, {
        context: finalContext,
        action: 'sendMessage/serverResponse',
      });

      if (data.isCreateNewTopic && data.topicId && !skipTopicSwitch) {
        // clearNewKey: true ensures the _new key data is cleared after topic creation
        await this.#get().switchTopic(data.topicId, {
          clearNewKey: true,
          skipRefreshMessage: true,
        });
      }

      // Notify the caller as soon as the conversation exists server-side, so the
      // chat view can be shown immediately rather than after streaming completes.
      onConversationStart?.({ topicId: finalTopicId ?? undefined });
    } catch (e) {
      console.error(e);
      // Fail operation on error
      this.#get().failOperation(operationId, {
        type: e instanceof Error ? e.name : 'unknown_error',
        message: e instanceof Error ? e.message : 'Unknown error',
      });

      if (e instanceof TRPCClientError) {
        const isAbort = e.message.includes('aborted') || e.name === 'AbortError';
        // Check if error is due to cancellation
        if (!isAbort) {
          this.#get().updateOperationMetadata(operationId, { inputSendErrorMsg: e.message });
          const op = this.#get().operations[operationId];
          if (op?.metadata.inputEditorTempState) {
            this.#get().mainInputEditor?.setJSONState(op.metadata.inputEditorTempState);
          } else {
            this.#get().mainInputEditor?.setDocument('markdown', message);
          }
        }
      }
    } finally {
      // A new topic was created, or the user cancelled the message (or it failed), so data is absent here
      if (data?.isCreateNewTopic || !data) {
        this.#get().internal_dispatchMessage(
          { type: 'deleteMessages', ids: [tempId, tempAssistantId] },
          { operationId },
        );
      }
    }

    // Clear editor temp state after message created
    if (data) {
      this.#get().updateOperationMetadata(operationId, { inputEditorTempState: null });
    }

    if (ENABLE_BUSINESS_FEATURES) {
      markUserValidAction();
    }

    if (!data) return;

    if (data.topicId) this.#get().internal_updateTopicLoading(data.topicId, true);

    const summaryTitle = async () => {
      // check activeTopic and then auto update topic title
      if (data.isCreateNewTopic) {
        await this.#get().summaryTopicTitle(data.topicId, data.messages);
        return;
      }

      if (!data.topicId) return;

      const topic = topicSelectors.getTopicById(data.topicId)(this.#get());

      if (topic && !topic.title) {
        const chats = displayMessageSelectors
          .getDisplayMessagesByKey(messageMapKey({ agentId, topicId: topic.id }))(this.#get())
          .filter((item) => item.id !== data.assistantMessageId);

        await this.#get().summaryTopicTitle(topic.id, chats);
      }
    };

    summaryTitle().catch(console.error);

    // Complete sendMessage operation here - message creation is done
    // execAgentRuntime is a separate operation (child) that handles AI response generation
    this.#get().completeOperation(operationId);

    const execContext = {
      ...operationContext,
      topicId: data.topicId ?? operationContext.topicId,
      threadId: data.createdThreadId ?? operationContext.threadId,
    };

    // ── Auto-dismiss pending tool interventions ──
    // Uses direct dispatch (updateMessage) instead of optimisticUpdatePlugin because
    // agent runtime checks pluginIntervention.status, not plugin.intervention.status.
    {
      const msgs = displayMessageSelectors.getDisplayMessagesByKey(messageMapKey(execContext))(
        this.#get(),
      );

      const pendingToolMsgIds = msgs.flatMap((m) => {
        const ids: string[] = [];
        if (m.role === 'tool' && m.pluginIntervention?.status === 'pending') ids.push(m.id);

        const childIds =
          m.children?.flatMap((child) =>
            (child.tools ?? [])
              .filter((t) => t.intervention?.status === 'pending' && t.result_msg_id)
              .map((t) => t.result_msg_id!),
          ) ?? [];

        return [...ids, ...childIds];
      });

      for (const msgId of pendingToolMsgIds) {
        this.#get().internal_dispatchMessage({
          id: msgId,
          type: 'updateMessage',
          value: {
            pluginIntervention: { status: 'aborted' },
            content: 'User bypassed this interaction by sending a message directly.',
          },
        });
        void messageService.updateMessagePlugin(
          msgId,
          { intervention: { status: 'aborted' } },
          {
            agentId: execContext.agentId,
            groupId: execContext.groupId,
            threadId: execContext.threadId,
            topicId: execContext.topicId,
          },
        );
      }
    }

    // ── Compute materialization: sync uploaded files before LLM execution ──
    // Consume pending file IDs from earlier uploads, plus the current message's attached files.
    // Important: await materialization before agent execution so compute workspace is ready.
    {
      const finalTopicId = data.topicId ?? operationContext.topicId;
      const attachedFileIds = (fileIdList || []).filter(Boolean);
      const pendingIds = getFileStoreState().consumePendingComputeMaterializeFileIds();

      // Deduplicate across both sources
      const allFileIds = [...new Set([...attachedFileIds, ...pendingIds])];

      if (finalTopicId && allFileIds.length > 0) {
        try {
          const result = await openTerminalWorkspaceService.materializeFiles({
            fileIds: allFileIds,
            overwrite: false,
            topicId: finalTopicId,
          });

          const failed = result.results.filter((r) => r.status === 'failed');
          if (failed.length > 0) {
            console.warn(
              '[sendMessage] materializeFiles failures:',
              failed.map((f) => f.fileId),
            );
            // Re-add failed IDs to pending so they can be retried on next send
            getFileStoreState().addPendingComputeMaterializeFileIds(failed.map((f) => f.fileId));
          }
        } catch (error) {
          if (isOpenTerminalApiMissing(error)) {
            // API missing: silently continue — the agent can still work
            // without compute-synced files. Do NOT re-add IDs to avoid
            // repeated blocking attempts.
          } else {
            console.warn('[sendMessage] materializeFiles error:', error);
            // Non-API error: re-add all IDs for a retry on next send
            getFileStoreState().addPendingComputeMaterializeFileIds(allFileIds);
          }
        }
      }
    }

    // ── AI execution (client mode) ──
    {
      const displayMessages = displayMessageSelectors.getDisplayMessagesByKey(
        messageMapKey(execContext),
      )(this.#get());

      try {
        // When agents are @mentioned, inject a slim callAgent-only manifest
        // so the AI can delegate directly without activating the full agent-management tool
        const injectedManifests = hasMentionedAgents ? [createCallAgentManifest()] : undefined;

        const hasInitialContext = hasMentionedAgents || !!injectedManifests;

        // Note: selectedSkills and selectedTools are NOT passed here — they are
        // persisted into the user message content above so they survive across
        // turns without re-injection.
        const agentRuntimeInitialContext = hasInitialContext
          ? {
              initialContext: {
                // Only inject mentionedAgents in non-group context to avoid
                // group @member mentions (including ALL_MEMBERS) leaking into agent-management
                ...(hasMentionedAgents ? { mentionedAgents } : undefined),
                ...(injectedManifests ? { injectedManifests } : undefined),
              },
              phase: 'init' as const,
            }
          : undefined;

        setActiveProjectKnowledgeBaseId(projectKnowledgeBaseId);
        setActiveProjectSystemPrompt(projectSystemPrompt || undefined);
        try {
          await internal_execAgentRuntime({
            context: execContext,
            initialContext: agentRuntimeInitialContext,
            messages: displayMessages,
            parentMessageId: data.assistantMessageId,
            parentMessageType: 'assistant',
            parentOperationId: operationId,
            inPortalThread: !!data.createdThreadId,
            skipCreateFirstMessage: true,
          });
        } finally {
          setActiveProjectKnowledgeBaseId(undefined);
          setActiveProjectSystemPrompt(undefined);
        }

        const userFiles = dbMessageSelectors
          .dbUserFiles(this.#get())
          .map((f) => f?.id)
          .filter(Boolean) as string[];

        if (userFiles.length > 0) {
          await getAgentStoreState().addFilesToAgent(userFiles, false);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (data.topicId) this.#get().internal_updateTopicLoading(data.topicId, false);
      }
    }

    // Return result for callers who need message IDs
    return {
      assistantMessageId: data.assistantMessageId,
      createdThreadId: data.createdThreadId,
      topicId: data.topicId,
      userMessageId: data.userMessageId,
    };
  };

  continueGenerationMessage = async (id: string, messageId: string): Promise<void> => {
    const message = dbMessageSelectors.getDbMessageById(id)(this.#get());
    if (!message) return;

    const { activeGroupAgentId, activeSessionId, activeTopicId, activeThreadId, activeGroupId } =
      this.#get();
    const activeAgentId = activeGroupAgentId || activeSessionId;
    if (!activeAgentId) return;

    // Create base context for continue operation (using global state)
    const continueContext = {
      agentId: activeAgentId,
      topicId: activeTopicId,
      threadId: activeThreadId ?? undefined,
      groupId: activeGroupId,
    };

    // Create continue operation
    const { operationId } = this.#get().startOperation({
      type: 'continue',
      context: { ...continueContext, messageId },
    });

    try {
      const chats = displayMessageSelectors.mainAIChatsWithHistoryConfig(this.#get());

      await this.#get().internal_execAgentRuntime({
        context: continueContext,
        messages: chats,
        parentMessageId: id,
        parentMessageType: message.role as 'assistant' | 'tool' | 'user',
        parentOperationId: operationId,
      });

      this.#get().completeOperation(operationId);
    } catch (error) {
      this.#get().failOperation(operationId, {
        type: 'ContinueError',
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  /**
   * Execute context compression for /compact command.
   * Reuses the same service methods as the agent runtime's compress_context executor.
   */
  executeCompression = async (
    context: Record<string, any>,
    parentOperationId: string,
  ): Promise<void> => {
    const { agentId, topicId } = context;
    if (!topicId) return;

    const contextKey = messageMapKey(context as any);
    const dbMessages = dbMessageSelectors.getDbMessagesByKey(contextKey)(this.#get()) || [];
    const messageIds = getCompressionCandidateMessageIds(dbMessages);

    if (messageIds.length === 0) return;

    const tempId = 'tmp_compress_' + nanoid();
    const { abortController, operationId } = this.#get().startOperation({
      context: { ...context, messageId: tempId },
      parentOperationId,
      type: 'contextCompression',
    });

    // Immediate UI feedback: render a pending compressed group from the first frame
    this.#get().internal_dispatchMessage(
      {
        id: tempId,
        type: 'createMessage',
        value: createPendingCompressedGroup({
          agentId,
          groupId: context.groupId,
          id: tempId,
          threadId: context.threadId,
          topicId,
        }) as any,
      },
      { operationId },
    );

    try {
      // 1. Create compression group on server
      const result = await messageService.createCompressionGroup({
        agentId,
        messageIds,
        topicId,
      });
      const { messageGroupId, messages: serverMessages, messagesToSummarize } = result;

      // Replace local pending group with server compression group
      this.#get().replaceMessages(serverMessages, { context: context as any });
      this.#get().associateMessageWithOperation(messageGroupId, operationId);

      // 2. Generate summary via LLM
      const _agentCfg = agentSelectors.getAgentConfigById(agentId)(getAgentStoreState());
      const model = _agentCfg?.model ?? '';
      const provider = _agentCfg?.provider ?? '';
      const compressionPayload = chainCompressContext(messagesToSummarize);
      let summaryContent = '';

      await chatService.fetchPresetTaskResult({
        abortController,
        onMessageHandle: (chunk) => {
          if (chunk.type === 'text') {
            summaryContent += chunk.text || '';
            this.#get().internal_dispatchMessage(
              { id: messageGroupId, type: 'updateMessage', value: { content: summaryContent } },
              { operationId },
            );
          }
        },
        params: { ...compressionPayload, model, provider },
      });

      if (abortController.signal.aborted) throw createAbortError();

      // 3. Finalize compression
      const finalResult = await messageService.finalizeCompression({
        agentId,
        content: summaryContent,
        messageGroupId,
        topicId,
      });

      if (finalResult.messages) {
        this.#get().replaceMessages(finalResult.messages, { context: context as any });
      }

      this.#get().completeOperation(operationId);
    } catch (error) {
      if (isAbortError(error, abortController)) {
        this.#get().internal_dispatchMessage(
          { type: 'deleteMessages', ids: [tempId] },
          { operationId },
        );
        return;
      }

      console.error('[/compact] Compression failed:', error);
      this.#get().internal_dispatchMessage(
        { type: 'deleteMessages', ids: [tempId] },
        { operationId },
      );
      this.#get().failOperation(operationId, {
        message: error instanceof Error ? error.message : String(error),
        type: 'compression_failed',
      });
    }
  };
}

export type ConversationLifecycleAction = Pick<
  ConversationLifecycleActionImpl,
  keyof ConversationLifecycleActionImpl
>;
