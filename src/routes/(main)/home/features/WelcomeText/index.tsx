import { Center } from '@lobehub/ui';
import { sample } from 'es-toolkit/compat';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/slices/auth/selectors';

const WelcomeText = memo(() => {
  const { t } = useTranslation('welcome');
  const userName = useUserStore(userProfileSelectors.displayUserName) || 'there';

  const sentence = useMemo(() => {
    const messages = t('welcomeMessages', { returnObjects: true }) as Record<string, string>;
    const picked = sample(Object.values(messages));
    return picked?.replaceAll('{{userName}}', userName);
  }, [t, userName]);

  return (
    <Center
      style={{
        fontSize: 28,
        fontWeight: 500,
        marginBlock: '36px 24px',
      }}
    >
      {sentence}
    </Center>
  );
});

export default WelcomeText;
