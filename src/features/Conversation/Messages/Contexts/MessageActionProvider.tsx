import { isEqual } from 'es-toolkit/compat';
import { type FC, type PropsWithChildren } from 'react';
import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { MESSAGE_ACTION_BAR_PORTAL_SELECTORS } from '@/const/messageActionPortal';

import { dataSelectors, useConversationStore } from '../../store';
import { AssistantActionsBar } from '../Assistant/Actions';
import { GroupActionsBar } from '../AssistantGroup/Actions';
import { UserActionsBar } from '../User/Actions';
import { type MessageActionType } from './message-action-context';
import {
  MessageItemActionElementPortialContext,
  MessageItemActionTypeContext,
  SetMessageItemActionElementPortialContext,
  SetMessageItemActionTypeContext,
  useMessageItemActionElementPortialContext,
  useMessageItemActionTypeContext,
} from './message-action-context';

interface SingletonPortalProps {
  id: string;
  index: number;
}

const isFailedCouncilStatus = (status?: string) =>
  status === 'failed' || status === 'timeout' || status === 'canceled';

const isTerminalCouncilStatus = (status?: string) =>
  status === 'completed' || isFailedCouncilStatus(status);

const isActiveModelCouncilResponse = (message: any) => {
  if (!message) return false;

  const metadata = message.metadata || {};
  const council = metadata.modelCouncil;

  if (message.role === 'compareGroup') {
    const groupStatus = metadata.status as string | undefined;
    if (!isTerminalCouncilStatus(groupStatus)) return true;

    return (message.children || []).some((child: any) => {
      const status = child.error
        ? 'failed'
        : ((child.metadata?.modelCouncil || {}) as { status?: string }).status || 'waiting';

      return !isTerminalCouncilStatus(status);
    });
  }

  if (!council) return false;

  return !isTerminalCouncilStatus(council.status);
};

const AssistantActionsRenderer: FC<SingletonPortalProps> = ({ id, index }) => {
  const actionsConfig = useConversationStore((s) => s.actionsBar?.assistant);
  const item = useConversationStore(dataSelectors.getDisplayMessageById(id), isEqual);

  if (!item) return null;

  return <AssistantActionsBar actionsConfig={actionsConfig} data={item} id={id} index={index} />;
};

const UserActionsRenderer: FC<SingletonPortalProps> = ({ id, index }) => {
  const actionsConfig = useConversationStore((s) => s.actionsBar?.user);
  const item = useConversationStore(dataSelectors.getDisplayMessageById(id), isEqual);
  const nextMessage = useConversationStore((s) => s.displayMessages[index + 1], isEqual);

  if (!item) return null;
  if (isActiveModelCouncilResponse(nextMessage)) return null;

  return <UserActionsBar actionsConfig={actionsConfig} data={item} id={id} />;
};

const AssistantGroupActionsRenderer: FC<SingletonPortalProps> = ({ id }) => {
  const actionsConfig = useConversationStore(
    (s) => s.actionsBar?.assistantGroup ?? s.actionsBar?.assistant,
  );
  const item = useConversationStore(dataSelectors.getDisplayMessageById(id), isEqual);
  const lastAssistantMsg = useConversationStore(
    dataSelectors.getGroupLatestMessageWithoutTools(id),
  );
  const contentId = lastAssistantMsg?.id;

  if (!item) return null;

  return (
    <GroupActionsBar
      actionsConfig={actionsConfig}
      contentBlock={lastAssistantMsg}
      contentId={contentId}
      data={item}
      id={id}
    />
  );
};

const SingletonMessageActionsBar = memo(() => {
  const portalElement = useMessageItemActionElementPortialContext();
  const actionType = useMessageItemActionTypeContext();

  const hostRef = useRef<HTMLDivElement | null>(null);
  if (!hostRef.current && typeof document !== 'undefined') {
    hostRef.current = document.createElement('div');
    hostRef.current.dataset.singletonMessageActionBarHost = 'true';
  }

  // Keep the React tree mounted in a stable host element, and only move the host via DOM.
  useEffect(() => {
    const hostEl = hostRef.current;
    if (!hostEl || typeof document === 'undefined') return;

    // By default, keep it hidden but mounted.
    let placeholderEl: HTMLDivElement | null = null;

    if (portalElement && actionType) {
      switch (actionType.type) {
        case 'assistant': {
          placeholderEl = portalElement.querySelector<HTMLDivElement>(
            MESSAGE_ACTION_BAR_PORTAL_SELECTORS.assistant,
          );
          break;
        }
        case 'user': {
          placeholderEl = portalElement.querySelector<HTMLDivElement>(
            MESSAGE_ACTION_BAR_PORTAL_SELECTORS.user,
          );
          break;
        }
        case 'assistantGroup': {
          placeholderEl = portalElement.querySelector<HTMLDivElement>(
            MESSAGE_ACTION_BAR_PORTAL_SELECTORS.assistantGroup,
          );
          break;
        }
      }
    }

    if (placeholderEl) {
      if (hostEl.parentElement !== placeholderEl) placeholderEl.append(hostEl);
      hostEl.style.display = '';
      return;
    }

    // No valid placeholder: attach to body to keep DOM owned, but hidden.
    if (document.body && hostEl.parentElement !== document.body) document.body.append(hostEl);
    hostEl.style.display = 'none';
  }, [portalElement, actionType]);

  useEffect(() => {
    const hostEl = hostRef.current;
    if (!hostEl) return;

    return () => {
      hostEl.remove();
    };
  }, []);

  const hostEl = hostRef.current;
  if (!hostEl || !actionType || !portalElement) return null;

  if (portalElement && actionType) {
    const selector =
      actionType.type === 'assistant'
        ? MESSAGE_ACTION_BAR_PORTAL_SELECTORS.assistant
        : actionType.type === 'assistantGroup'
          ? MESSAGE_ACTION_BAR_PORTAL_SELECTORS.assistantGroup
          : MESSAGE_ACTION_BAR_PORTAL_SELECTORS.user;

    if (!portalElement.querySelector(selector)) return null;
  }

  switch (actionType.type) {
    case 'assistant': {
      return createPortal(
        <AssistantActionsRenderer id={actionType.id} index={actionType.index} />,
        hostEl,
      );
    }
    case 'user': {
      return createPortal(
        <UserActionsRenderer id={actionType.id} index={actionType.index} />,
        hostEl,
      );
    }
    case 'assistantGroup': {
      return createPortal(
        <AssistantGroupActionsRenderer id={actionType.id} index={actionType.index} />,
        hostEl,
      );
    }
  }

  return null;
});

interface MessageActionProviderProps extends PropsWithChildren {
  /**
   * Whether to mount the singleton message actions portal renderer.
   *
   * NOTE: This renderer currently depends on `useConversationStore`, so it should only
   * be enabled in Conversation message lists.
   */
  withSingletonActionsBar?: boolean;
}

export const MessageActionProvider: FC<MessageActionProviderProps> = ({
  children,
  withSingletonActionsBar,
}) => {
  const [messageItemActionElementPortialContext, setMessageItemActionElementPortialContext] =
    useState<HTMLDivElement | null>(null);
  const [messageItemActionTypeContext, setMessageItemActionTypeContext] =
    useState<MessageActionType | null>(null);

  return (
    <MessageItemActionElementPortialContext value={messageItemActionElementPortialContext}>
      <SetMessageItemActionElementPortialContext value={setMessageItemActionElementPortialContext}>
        <SetMessageItemActionTypeContext value={setMessageItemActionTypeContext}>
          <MessageItemActionTypeContext value={messageItemActionTypeContext}>
            {withSingletonActionsBar && <SingletonMessageActionsBar />}
            {children}
          </MessageItemActionTypeContext>
        </SetMessageItemActionTypeContext>
      </SetMessageItemActionElementPortialContext>
    </MessageItemActionElementPortialContext>
  );
};
