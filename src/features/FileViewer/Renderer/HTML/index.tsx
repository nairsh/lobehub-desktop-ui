'use client';

import { Center, Flexbox } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import NeuralNetworkLoading from '@/components/NeuralNetworkLoading';

import { useTextFileLoader } from '../../hooks/useTextFileLoader';

const styles = createStaticStyles(({ css, cssVar }) => ({
  iframe: css`
    width: 100%;
    height: 100%;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadius}px;

    background: ${cssVar.colorBgContainer};
  `,
}));

interface HTMLViewerProps {
  fileId: string;
  url: string | null;
}

const HTMLViewer = memo<HTMLViewerProps>(({ url }) => {
  const { t } = useTranslation('components');
  const { fileData, loading } = useTextFileLoader(url);

  if (loading) {
    return (
      <Center height={'100%'}>
        <NeuralNetworkLoading size={36} />
      </Center>
    );
  }

  if (!fileData) return null;

  return (
    <Flexbox height={'100%'} paddingInline={8} width={'100%'}>
      <iframe
        className={styles.iframe}
        sandbox="allow-scripts allow-forms allow-modals"
        srcDoc={fileData}
        title={t('HtmlPreview.iframeTitle')}
      />
    </Flexbox>
  );
});

export default HTMLViewer;
