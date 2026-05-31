'use client';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import PageTitle from '@/components/PageTitle';
import { useChatStore } from '@/store/chat';
import { topicSelectors } from '@/store/chat/selectors';

const Title = memo(() => {
  const { t } = useTranslation('electron');

  const topicTitle = useChatStore((s) => topicSelectors.currentActiveTopic(s)?.title);
  return <PageTitle title={topicTitle || t('navigation.chat')} />;
});

export default Title;
