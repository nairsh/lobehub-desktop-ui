'use client';

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import InputArea from './InputArea';

const Home = memo(() => {
  return (
    <Flexbox gap={40}>
      <InputArea />
    </Flexbox>
  );
});

export default Home;
