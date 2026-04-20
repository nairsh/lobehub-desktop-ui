import { BRANDING_NAME } from '@lobechat/business-const';
import { type MarkdownProps } from '@lobehub/ui';
import { Center, Markdown } from '@lobehub/ui';
import { useTranslation } from 'react-i18next';

import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/slices/auth/selectors';

const ChatPreview = ({ fontSize }: Pick<MarkdownProps, 'fontSize'>) => {
  const { t } = useTranslation('welcome');
  const userName = useUserStore(userProfileSelectors.displayUserName) || 'there';
  return (
    <Center>
      <Markdown fontSize={fontSize} variant={'chat'}>
        {t('guide.defaultMessageWithoutCreate', {
          appName: BRANDING_NAME,
          userName,
        })}
      </Markdown>
    </Center>
  );
};

export default ChatPreview;
