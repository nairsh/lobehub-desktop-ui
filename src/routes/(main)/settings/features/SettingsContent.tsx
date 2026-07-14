'use client';

import { Fragment, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Button, Empty, Flexbox } from '@lobehub/ui';

import NavHeader from '@/features/NavHeader';
import SettingContainer from '@/features/Setting/SettingContainer';
import { SettingsTabs } from '@/store/global/initialState';
import { serverConfigSelectors, useServerConfigStore } from '@/store/serverConfig';

import { componentMap } from './componentMap';

const REDIRECT_MAP: Record<string, string> = {
  [SettingsTabs.Common]: SettingsTabs.Appearance,
  [SettingsTabs.ChatAppearance]: SettingsTabs.Appearance,
  [SettingsTabs.Agent]: SettingsTabs.ServiceModel,
  [SettingsTabs.TTS]: SettingsTabs.ServiceModel,
  [SettingsTabs.Image]: SettingsTabs.ServiceModel,
};

interface SettingsContentProps {
  activeTab?: string;
  mobile?: boolean;
}

const SettingsContent = ({ mobile, activeTab }: SettingsContentProps) => {
  const { t } = useTranslation('setting');
  const enableBusinessFeatures = useServerConfigStore(serverConfigSelectors.enableBusinessFeatures);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab && REDIRECT_MAP[activeTab]) {
      navigate(`/settings/${REDIRECT_MAP[activeTab]}`, { replace: true });
    }
  }, [activeTab, navigate]);

  const renderComponent = (tab: string) => {
    const Component = componentMap[tab as keyof typeof componentMap];
    if (!Component) return null;

    const componentProps: { mobile?: boolean } = {};
    if (
      [
        SettingsTabs.About,
        SettingsTabs.ServiceModel,
        SettingsTabs.Provider,
        SettingsTabs.Profile,
        SettingsTabs.Stats,
        SettingsTabs.Usage,
        SettingsTabs.Security,
        ...(enableBusinessFeatures
          ? [SettingsTabs.Plans, SettingsTabs.Credits, SettingsTabs.Billing, SettingsTabs.Referral]
          : []),
      ].includes(tab as any)
    ) {
      componentProps.mobile = mobile;
    }

    return <Component {...componentProps} />;
  };

  const renderUnknownTab = () => (
    <>
      {!mobile && <NavHeader />}
      <SettingContainer maxWidth={1024} paddingBlock={'24px 128px'} paddingInline={24}>
        <Flexbox align="center" justify="center" style={{ minHeight: 360 }}>
          <Empty
            description={t('settingsTabNotFound.desc')}
            title={t('settingsTabNotFound.title')}
            type="page"
          />
          <Button type="primary" onClick={() => navigate('/settings/profile', { replace: true })}>
            {t('settingsTabNotFound.action')}
          </Button>
        </Flexbox>
      </SettingContainer>
    </>
  );

  if (activeTab && REDIRECT_MAP[activeTab]) return null;

  if (activeTab && !componentMap[activeTab as keyof typeof componentMap]) {
    return renderUnknownTab();
  }

  if (mobile) {
    return activeTab ? renderComponent(activeTab) : renderComponent(SettingsTabs.Profile);
  }

  return (
    <>
      {Object.keys(componentMap).map((tabKey) => {
        const isProvider = tabKey === SettingsTabs.Provider;
        if (activeTab !== tabKey) return null;
        const content = renderComponent(tabKey);
        if (isProvider) return <Fragment key={tabKey}>{content}</Fragment>;
        return (
          <Fragment key={tabKey}>
            <NavHeader />
            <SettingContainer maxWidth={1024} paddingBlock={'24px 128px'} paddingInline={24}>
              {content}
            </SettingContainer>
          </Fragment>
        );
      })}
    </>
  );
};

export default SettingsContent;
