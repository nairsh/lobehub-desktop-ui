import { type KnowledgeItem, KnowledgeType } from '@lobechat/types';
import { Tag, Tooltip } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import KnowledgeIcon from '@/components/KnowledgeIcon';
import { useEventCallback } from '@/hooks/useEventCallback';
import { useAgentStore } from '@/store/agent';

const styles = createStaticStyles(({ css }) => ({
  name: css`
    overflow: hidden;
    flex: 1;

    min-width: 0;

    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}));

const KnowledgeSelectionItem = memo<KnowledgeItem>(({ fileType, id, name, type }) => {
  const [removeFileFromAgent, removeKnowledgeBaseFromAgent] = useAgentStore((s) => [
    s.removeFileFromAgent,
    s.removeKnowledgeBaseFromAgent,
  ]);

  const handleClose = useEventCallback(async () => {
    if (type === KnowledgeType.KnowledgeBase) {
      await removeKnowledgeBaseFromAgent(id);
      return;
    }

    await removeFileFromAgent(id);
  });

  return (
    <Tag
      closable
      icon={<KnowledgeIcon fileType={fileType} name={name} size={16} type={type} />}
      size={'large'}
      onClose={() => void handleClose()}
    >
      <Tooltip title={name}>
        <span className={styles.name}>{name}</span>
      </Tooltip>
    </Tag>
  );
});

KnowledgeSelectionItem.displayName = 'KnowledgeSelectionItem';

export default KnowledgeSelectionItem;
