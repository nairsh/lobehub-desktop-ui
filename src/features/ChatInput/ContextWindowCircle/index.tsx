'use client';

import { memo } from 'react';

import { useModelHasContextWindowToken } from '@/hooks/useModelHasContextWindowToken';
import dynamic from '@/libs/next/dynamic';
import { useChatStore } from '@/store/chat';
import { displayMessageSelectors } from '@/store/chat/selectors';

const CircleContent = dynamic(() => import('./CircleContent'), { ssr: false });

const ContextWindowCircle = memo(() => {
  const showCircle = useModelHasContextWindowToken();
  const total = useChatStore(displayMessageSelectors.mainAIChatsMessageString);

  if (!showCircle) return null;

  return <CircleContent total={total} />;
});

ContextWindowCircle.displayName = 'ContextWindowCircle';

export default ContextWindowCircle;
