import { ActionIcon } from '@lobehub/ui';
import { Bot } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAgentId } from '@/features/ChatInput/hooks/useAgentId';
import { useAgentStore } from '@/store/agent';
import { chatConfigByIdSelectors } from '@/store/agent/selectors';

import { useUpdateAgentConfig } from '../../hooks/useUpdateAgentConfig';

const AgentModeToggle = memo(() => {
  const { t } = useTranslation('chat');
  const agentId = useAgentId();
  const { updateAgentChatConfig } = useUpdateAgentConfig();
  const enableAgentMode = useAgentStore(
    (s) => chatConfigByIdSelectors.getChatConfigById(agentId)(s).enableAgentMode !== false,
  );

  const handleToggle = (checked: boolean) => {
    updateAgentChatConfig({ enableAgentMode: checked });
  };

  return (
    <ActionIcon
      icon={Bot}
      title={t('agentMode.title', { defaultValue: 'Agent Mode' })}
      style={{
        color: enableAgentMode ? 'var(--colorPrimary)' : undefined,
      }}
      onClick={() => {
        handleToggle(!enableAgentMode);
      }}
    />
  );
});

AgentModeToggle.displayName = 'AgentModeToggle';

export default AgentModeToggle;
