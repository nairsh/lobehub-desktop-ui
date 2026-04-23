import type { UpdaterState } from '@lobechat/electron-client-ipc';
import { useWatchBroadcast } from '@lobechat/electron-client-ipc';
import { Button, Flexbox, Icon } from '@lobehub/ui';
import { Modal, Progress } from 'antd';
import { createStaticStyles, cssVar } from 'antd-style';
import { AlertCircle, CircleFadingArrowUp, Download, Loader2, RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { autoUpdateService } from '@/services/electron/autoUpdate';

const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    position: fixed;
    z-index: 1000;
    inset-block-end: 16px;
    inset-inline-start: 16px;
  `,

  releaseNote: css`
    overflow: scroll;

    max-height: 300px;
    padding: 8px;
    border-radius: 8px;

    background: ${cssVar.colorFillQuaternary};
  `,
}));

export const UpdateNotification: React.FC = () => {
  const { t } = useTranslation('electron');
  const [updaterState, setUpdaterState] = useState<UpdaterState>({ stage: 'idle' });
  const [dismissed, setDismissed] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installLaterConfirmed, setInstallLaterConfirmed] = useState(false);

  useEffect(() => {
    autoUpdateService
      .getUpdaterState()
      .then(setUpdaterState)
      .catch(() => {});
  }, []);

  useWatchBroadcast('updaterStateChanged', (state: UpdaterState) => {
    setUpdaterState(state);

    if (state.stage === 'downloading' || state.stage === 'downloaded' || state.stage === 'error') {
      setDismissed(false);
    }
    if (state.stage === 'idle') {
      setIsInstalling(false);
    }
  });

  useWatchBroadcast('updateWillInstallLater', () => {
    setInstallLaterConfirmed(true);
    setTimeout(() => setInstallLaterConfirmed(false), 5000);
  });

  const { stage, progress, updateInfo, errorMessage } = updaterState;

  if (dismissed || stage === 'idle' || stage === 'checking' || stage === 'latest') return null;

  if (installLaterConfirmed) {
    return (
      <div
        style={{
          backgroundColor: cssVar.colorBgElevated,
          borderRadius: cssVar.borderRadius,
          bottom: 20,
          boxShadow: cssVar.boxShadow,
          color: cssVar.colorText,
          left: 16,
          padding: '10px 16px',
          position: 'fixed',
          zIndex: 1000,
        }}
      >
        {t('updater.willInstallLater')}
      </div>
    );
  }

  // --- Error state ---
  if (stage === 'error') {
    return (
      <div className={styles.container}>
        <div
          style={{
            alignItems: 'center',
            background: cssVar.colorBgElevated,
            border: `1px solid ${cssVar.colorErrorBorder}`,
            borderRadius: 12,
            boxShadow: cssVar.boxShadow,
            color: cssVar.colorText,
            display: 'flex',
            gap: 8,
            maxWidth: 420,
            padding: '8px 10px',
          }}
        >
          <Icon icon={AlertCircle} style={{ color: cssVar.colorError, fontSize: 16 }} />
          <div style={{ flex: 1, fontSize: 12 }}>
            {errorMessage
              ? t('updater.updateErrorWithMessage', { message: errorMessage })
              : t('updater.updateError')}
          </div>
          <Button
            size="small"
            type="text"
            onClick={() => {
              setDismissed(true);
            }}
          >
            {t('updater.later')}
          </Button>
          <Button
            size="small"
            onClick={() => {
              autoUpdateService.checkUpdate();
            }}
          >
            <Icon icon={RefreshCw} style={{ fontSize: 12 }} />
          </Button>
        </div>
      </div>
    );
  }

  // --- Downloading state ---
  if (stage === 'downloading') {
    const percent = progress ? Math.round(progress.percent) : 0;
    const speedMB = progress ? (progress.bytesPerSecond / (1024 * 1024)).toFixed(1) : '0';

    return (
      <div className={styles.container}>
        <div
          style={{
            background: cssVar.colorBgElevated,
            border: `1px solid ${cssVar.colorBorderSecondary}`,
            borderRadius: 12,
            boxShadow: cssVar.boxShadow,
            color: cssVar.colorText,
            minWidth: 280,
            padding: '10px 12px',
          }}
        >
          <Flexbox horizontal align="center" gap={8}>
            <Icon icon={Download} style={{ fontSize: 16 }} />
            <div style={{ flex: 1, fontSize: 12 }}>
              {t('updater.downloadingUpdate')}
              {updateInfo?.version ? ` · ${updateInfo.version}` : ''}
            </div>
            <div style={{ color: cssVar.colorTextDescription, fontSize: 11 }}>{speedMB} MB/s</div>
          </Flexbox>
          <Progress
            percent={percent}
            showInfo={false}
            size="small"
            status="active"
            style={{ marginBottom: -4, marginTop: 4 }}
          />
        </div>
      </div>
    );
  }

  // --- Downloaded / ready to install ---
  if (stage === 'downloaded') {
    return (
      <>
        <div className={styles.container}>
          <div
            style={{
              alignItems: 'center',
              background: cssVar.colorBgElevated,
              border: `1px solid ${cssVar.colorBorderSecondary}`,
              borderRadius: 12,
              boxShadow: cssVar.boxShadow,
              color: cssVar.colorText,
              display: 'flex',
              gap: 8,
              padding: '8px 10px',
            }}
          >
            <Icon
              icon={isInstalling ? Loader2 : CircleFadingArrowUp}
              spin={isInstalling}
              style={{ fontSize: 16 }}
            />
            <div style={{ cursor: 'pointer', fontSize: 12 }} onClick={() => setDetailVisible(true)}>
              {isInstalling ? t('updater.updateInstalling') : t('updater.updateReady')}
              {updateInfo?.version ? ` · ${updateInfo.version}` : ''}
            </div>
            <div style={{ flex: 1 }} />
            {!isInstalling && (
              <>
                <Button
                  size="small"
                  type="text"
                  onClick={() => {
                    autoUpdateService.installLater();
                  }}
                >
                  {t('updater.later')}
                </Button>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    setIsInstalling(true);
                    autoUpdateService.installNow();
                  }}
                >
                  {t('updater.upgradeNow')}
                </Button>
              </>
            )}
          </div>
        </div>

        <Modal
          footer={null}
          open={detailVisible}
          title={t('updater.updateReady')}
          width={520}
          onCancel={() => setDetailVisible(false)}
        >
          <Flexbox gap={12} style={{ maxWidth: 480 }}>
            <div style={{ color: cssVar.colorTextSecondary, fontSize: 12 }}>
              {updateInfo?.version}
            </div>
            {updateInfo?.releaseNotes && (
              <div
                className={styles.releaseNote}
                dangerouslySetInnerHTML={{ __html: updateInfo.releaseNotes as string }}
              />
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button size="small" onClick={() => autoUpdateService.installLater()}>
                {t('updater.installLater')}
              </Button>
              <Button
                loading={isInstalling}
                size="small"
                type="primary"
                onClick={() => {
                  setIsInstalling(true);
                  autoUpdateService.installNow();
                }}
              >
                {t('updater.restartAndInstall')}
              </Button>
            </div>
          </Flexbox>
        </Modal>
      </>
    );
  }

  return null;
};
