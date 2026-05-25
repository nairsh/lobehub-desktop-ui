import { Button, Flexbox } from '@lobehub/ui';
import { Plus } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useActionSWR } from '@/libs/swr';
import { useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';

const AddButton = memo<{ groupId?: string }>(({ groupId }) => {
  const { t } = useTranslation('chat');
  const createChat = useSessionStore((s) => s.createChat);
  const mobile = useServerConfigStore((s) => s.isMobile);
  const { mutate, isValidating } = useActionSWR(['chat.createChat', groupId], () => {
    return createChat({ groupId });
  });

  return (
    <Flexbox flex={1} padding={mobile ? 16 : 0}>
      <Button
        block
        icon={Plus}
        loading={isValidating}
        variant={'filled'}
        style={{
          marginTop: 8,
        }}
        onClick={() => mutate()}
      >
        {t('newChat')}
      </Button>
    </Flexbox>
  );
});

export default AddButton;
