import { BRANDING_NAME } from '@lobechat/business-const';
import type { DesktopAppIconState, UpdaterState } from '@lobechat/electron-client-ipc';
import { getElectronIpc, useWatchBroadcast } from '@lobechat/electron-client-ipc';
import { Block, Button, Flexbox, Tag } from '@lobehub/ui';
import { App } from 'antd';
import { createStaticStyles } from 'antd-style';
import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ProductLogo } from '@/components/Branding';
import { CHANGELOG_URL, MANUAL_UPGRADE_URL, OFFICIAL_SITE } from '@/const/url';
import { CURRENT_VERSION } from '@/const/version';
import { useNewVersion } from '@/features/User/UserPanel/useNewVersion';
import { autoUpdateService } from '@/services/electron/autoUpdate';
import { electronSystemService } from '@/services/electron/system';
import { useGlobalStore } from '@/store/global';

import { APP_VERSION } from './appVersion';

const styles = createStaticStyles(({ css, cssVar }) => ({
  logo: css`
    border-radius: calc(${cssVar.borderRadiusLG} * 2);
  `,
  logoImage: css`
    display: block;

    width: 52px;
    height: 52px;
    border-radius: calc(${cssVar.borderRadiusLG} * 1.5);

    object-fit: cover;
  `,
  subtitle: css`
    font-size: 12px;
    line-height: 1.5;
    color: ${cssVar.colorTextDescription};
  `,
}));

const Version = memo<{ mobile?: boolean }>(({ mobile }) => {
  const hasNewVersion = useNewVersion();
  const [latestVersion, serverVersion, useCheckServerVersion] = useGlobalStore((s) => [
    s.latestVersion,
    s.serverVersion,
    s.useCheckServerVersion,
  ]);
  const { t } = useTranslation(['common', 'setting']);
  const { message } = App.useApp();

  useCheckServerVersion();

  const showServerVersion = serverVersion && serverVersion !== CURRENT_VERSION;
  const isDesktop = useMemo(() => !!getElectronIpc(), []);

  const [appIcon, setAppIcon] = useState<DesktopAppIconState>();
  const [appIconUpdating, setAppIconUpdating] = useState(false);
  const [updaterState, setUpdaterState] = useState<UpdaterState>({ stage: 'idle' });
  const [buildChannel, setBuildChannel] = useState<string | null>(null);

  useEffect(() => {
    if (!isDesktop) return;

    electronSystemService.getAppIconState().then(setAppIcon).catch(console.error);
  }, [isDesktop]);

  useEffect(() => {
    if (!isDesktop) return;
    autoUpdateService.getUpdaterState().then(setUpdaterState);
  }, [isDesktop]);

  useEffect(() => {
    if (!isDesktop) return;
    autoUpdateService.getBuildChannel().then(setBuildChannel);
  }, [isDesktop]);

  useWatchBroadcast('updaterStateChanged', (state: UpdaterState) => {
    setUpdaterState(state);
  });

  const handleSelectAppIcon = async () => {
    if (!isDesktop) return;

    setAppIconUpdating(true);
    try {
      const nextIcon = await electronSystemService.selectAppIcon();

      if (!nextIcon) return;

      setAppIcon(nextIcon);
      message.success(t('about.appIcon.updateSuccess', { ns: 'setting' }));
    } catch (error) {
      console.error(error);
      message.error(t('about.appIcon.updateError', { ns: 'setting' }));
    } finally {
      setAppIconUpdating(false);
    }
  };

  const handleResetAppIcon = async () => {
    if (!isDesktop) return;

    setAppIconUpdating(true);
    try {
      const nextIcon = await electronSystemService.resetAppIcon();

      setAppIcon(nextIcon);
      message.success(t('about.appIcon.resetSuccess', { ns: 'setting' }));
    } catch (error) {
      console.error(error);
      message.error(t('about.appIcon.resetError', { ns: 'setting' }));
    } finally {
      setAppIconUpdating(false);
    }
  };

  const renderUpdateButton = () => {
    if (!isDesktop) {
      if (hasNewVersion) {
        return (
          <a href={MANUAL_UPGRADE_URL} rel="noreferrer" style={{ flex: 1 }} target="_blank">
            <Button block={mobile} type={'primary'}>
              {t('upgradeVersion.action')}
            </Button>
          </a>
        );
      }
      return null;
    }

    const { stage, progress } = updaterState;

    switch (stage) {
      case 'checking': {
        return (
          <Button loading block={mobile}>
            {t('checkForUpdates')}
          </Button>
        );
      }
      case 'downloading': {
        const percent = progress ? Math.round(progress.percent) : 0;
        return (
          <Button loading block={mobile}>
            {t('downloadingUpdate', { percent })}
          </Button>
        );
      }
      case 'downloaded': {
        return (
          <Button block={mobile} type="primary" onClick={() => void autoUpdateService.installNow()}>
            {t('restartToUpdate')}
          </Button>
        );
      }
      case 'latest': {
        return (
          <Button disabled block={mobile}>
            {t('alreadyUpToDate')}
          </Button>
        );
      }
      default: {
        return (
          <Button block={mobile} onClick={() => void autoUpdateService.checkUpdate()}>
            {t('checkForUpdates')}
          </Button>
        );
      }
    }
  };

  const logo = (
    <Block
      align={'center'}
      className={styles.logo}
      clickable={isDesktop}
      height={64}
      justify={'center'}
      width={64}
      style={{
        opacity: appIconUpdating ? 0.7 : 1,
        pointerEvents: appIconUpdating ? 'none' : undefined,
      }}
      onClick={isDesktop ? () => void handleSelectAppIcon() : undefined}
    >
      {isDesktop && appIcon?.previewDataUrl ? (
        <img alt={BRANDING_NAME} className={styles.logoImage} src={appIcon.previewDataUrl} />
      ) : (
        <ProductLogo size={52} />
      )}
    </Block>
  );

  return (
    <Flexbox
      align={mobile ? 'stretch' : 'center'}
      gap={16}
      horizontal={!mobile}
      justify={'space-between'}
      width={'100%'}
    >
      <Flexbox horizontal align={'center'} flex={'none'} gap={16}>
        {isDesktop ? (
          logo
        ) : (
          <a href={OFFICIAL_SITE} rel="noreferrer" target="_blank">
            {logo}
          </a>
        )}
        <Flexbox align={'flex-start'} gap={6}>
          <div style={{ fontSize: 18, fontWeight: 'bolder' }}>{BRANDING_NAME}</div>
          <Flexbox gap={6} horizontal={!mobile}>
            <Tag>v{APP_VERSION}</Tag>

            {buildChannel && buildChannel !== 'stable' && (
              <Tag color={'gold'}>
                {t(`setting:tab.advanced.updateChannel.${buildChannel}`, {
                  defaultValue: buildChannel.charAt(0).toUpperCase() + buildChannel.slice(1),
                })}
              </Tag>
            )}
            {showServerVersion && (
              <Tag>{t('upgradeVersion.serverVersion', { version: `v${serverVersion}` })}</Tag>
            )}
            {hasNewVersion && (
              <Tag color={'info'}>
                {t('upgradeVersion.newVersion', { version: `v${latestVersion}` })}
              </Tag>
            )}
          </Flexbox>
          {isDesktop && (
            <div className={styles.subtitle}>{t('about.appIcon.desc', { ns: 'setting' })}</div>
          )}
        </Flexbox>
      </Flexbox>
      <Flexbox horizontal flex={mobile ? 1 : undefined} gap={8}>
        {isDesktop && appIcon?.isCustom && (
          <Button
            block={mobile}
            loading={appIconUpdating}
            onClick={() => void handleResetAppIcon()}
          >
            {t('about.appIcon.reset', { ns: 'setting' })}
          </Button>
        )}
        <a href={CHANGELOG_URL} rel="noreferrer" style={{ flex: 1 }} target="_blank">
          <Button block={mobile}>{t('changelog')}</Button>
        </a>
        {renderUpdateButton()}
      </Flexbox>
    </Flexbox>
  );
});

export default Version;
