import { Flexbox, Popover } from '@lobehub/ui';
import { BotPromptIcon } from '@lobehub/ui/icons';
import { createStaticStyles } from 'antd-style';
import { RadioTowerIcon } from 'lucide-react';
import { type PropsWithChildren } from 'react';
import { memo, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import urlJoin from 'url-join';

import NavItem from '@/features/NavPanel/components/NavItem';
import SkeletonList from '@/features/NavPanel/components/SkeletonList';
import { usePathname } from '@/libs/router/navigation';
import List from '@/routes/(main)/home/_layout/Body/Agent/List';
import { AgentModalProvider } from '@/routes/(main)/home/_layout/Body/Agent/ModalProvider';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

const styles = createStaticStyles(({ cssVar, css }) => ({
  list: css`
    overflow-y: auto;
    max-height: 50vh;
  `,
  separator: css`
    margin-block: 4px;
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
  `,
  trigger: css`
    &[data-popup-open] {
      background: ${cssVar.colorFillTertiary};
    }
  `,
}));

const SwitchPanel = memo<PropsWithChildren>(({ children }) => {
  const { t } = useTranslation('chat');
  const { aid } = useParams<{ aid?: string }>();
  const navigate = useNavigate();
  const pathname = usePathname();
  const { isAgentEditable } = useServerConfigStore(featureFlagsSelectors);
  const showAgentActions = Boolean(aid) && isAgentEditable;

  const content = useMemo(
    () => (
      <Suspense fallback={<SkeletonList rows={6} />}>
        <AgentModalProvider>
          <Flexbox gap={4} padding={8}>
            {showAgentActions && (
              <>
                <Flexbox gap={4}>
                  <NavItem
                    active={pathname.includes('/profile')}
                    icon={BotPromptIcon}
                    title={t('tab.profile')}
                    onClick={() => navigate(urlJoin('/agent', aid!, 'profile'))}
                  />
                  <NavItem
                    active={pathname.includes('/channel')}
                    icon={RadioTowerIcon}
                    title={t('tab.integration')}
                    onClick={() => navigate(urlJoin('/agent', aid!, 'channel'))}
                  />
                </Flexbox>
                <div className={styles.separator} />
              </>
            )}
            <Flexbox className={styles.list} gap={4}>
              <List onMoreClick={() => navigate('/')} />
            </Flexbox>
          </Flexbox>
        </AgentModalProvider>
      </Suspense>
    ),
    [aid, navigate, pathname, showAgentActions, t],
  );

  return (
    <Popover
      classNames={{ trigger: styles.trigger }}
      content={content}
      nativeButton={false}
      placement="bottomLeft"
      trigger="click"
      styles={{
        content: {
          padding: 0,
          width: 240,
        },
      }}
    >
      {children}
    </Popover>
  );
});

export default SwitchPanel;
