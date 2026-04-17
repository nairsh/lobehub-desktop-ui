import { Flexbox } from '@lobehub/ui';
import { type FC } from 'react';
import { useLocation } from 'react-router-dom';

import PageTitle from '@/components/PageTitle';
import NavHeader from '@/features/NavHeader';
import WideScreenContainer from '@/features/WideScreenContainer';

import HomeContent from './features';

const Home: FC = () => {
  const { pathname } = useLocation();
  const isHomeRoute = pathname === '/';

  return (
    <>
      {isHomeRoute && <PageTitle title="" />}
      <NavHeader right={<Flexbox horizontal align="center" />} />
      <Flexbox
        height={'100%'}
        justify={'center'}
        style={{ overflowY: 'auto', padding: '6vh 0 12vh' }}
        width={'100%'}
      >
        <WideScreenContainer wrapperStyle={{ minHeight: '100%' }}>
          <HomeContent />
        </WideScreenContainer>
      </Flexbox>
    </>
  );
};

export default Home;
