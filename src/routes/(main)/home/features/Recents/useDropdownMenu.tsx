import { type MenuProps } from '@lobehub/ui';
import { Icon } from '@lobehub/ui';
import { App } from 'antd';
import { PencilLineIcon, Trash } from 'lucide-react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { topicService } from '@/services/topic';
import { useHomeStore } from '@/store/home';
import { type RecentChatItem } from '@/store/home/slices/recent/utils';

export const useRecentItemDropdownMenu = (
  item: RecentChatItem,
  toggleEditing: (visible?: boolean) => void,
) => {
  const { t } = useTranslation(['common', 'topic', 'components']);
  const { modal } = App.useApp();
  const [updateRecentTitle, refreshRecents] = useHomeStore((s) => [
    s.updateRecentTitle,
    s.refreshRecents,
  ]);

  const handleRename = useCallback(
    async (newTitle: string) => {
      updateRecentTitle(item.id, newTitle);
      await topicService.updateTopic(item.id, { title: newTitle });
    },
    [item, updateRecentTitle],
  );

  const handleDelete = useCallback(() => {
    modal.confirm({
      centered: true,
      okButtonProps: { danger: true },
      onOk: async () => {
        await topicService.removeTopic(item.id);
        await refreshRecents();
      },
      title: t('actions.confirmRemoveTopic', { ns: 'topic' }),
    });
  }, [item, modal, t, refreshRecents]);

  const dropdownMenu = useCallback((): MenuProps['items'] => {
    const canRename = true;

    return [
      ...(canRename
        ? [
            {
              icon: <Icon icon={PencilLineIcon} />,
              key: 'rename',
              label: t('rename'),
              onClick: () => toggleEditing(true),
            },
          ]
        : []),
      {
        danger: true,
        icon: <Icon icon={Trash} />,
        key: 'delete',
        label: t('delete'),
        onClick: handleDelete,
      },
    ];
  }, [t, toggleEditing, handleDelete]);

  return { dropdownMenu, handleRename };
};
