'use client';

import {
  type GoogleAnalyticsProviderConfig,
  type PostHogProviderAnalyticsConfig,
} from '@lobehub/analytics';
import { createSingletonAnalytics } from '@lobehub/analytics';
import { AnalyticsProvider } from '@lobehub/analytics/react';
import { type ReactNode } from 'react';
import { memo, useMemo } from 'react';

import { BUSINESS_LINE } from '@/const/analytics';
import { isDesktop } from '@/const/version';
import { isDev } from '@/utils/env';

type Props = {
  children: ReactNode;
  ga4Config: GoogleAnalyticsProviderConfig;
  postHogConfig: PostHogProviderAnalyticsConfig;
};

let analyticsInstance: ReturnType<typeof createSingletonAnalytics> | null = null;
let analyticsInstanceConfigKey = '';

const getConfigKey = (
  ga4Config: GoogleAnalyticsProviderConfig,
  postHogConfig: PostHogProviderAnalyticsConfig,
) => JSON.stringify({ ga4Config, postHogConfig });

export const LobeAnalyticsProvider = memo(({ children, ga4Config, postHogConfig }: Props) => {
  const analytics = useMemo(() => {
    const configKey = getConfigKey(ga4Config, postHogConfig);

    if (analyticsInstance && analyticsInstanceConfigKey === configKey) {
      return analyticsInstance;
    }

    analyticsInstance = createSingletonAnalytics({
      business: BUSINESS_LINE,
      debug: isDev,
      providers: {
        ga4: ga4Config,
        posthog: postHogConfig,
      },
    });
    analyticsInstanceConfigKey = configKey;

    return analyticsInstance;
  }, [ga4Config, postHogConfig]);

  if (!analytics) return children;

  return (
    <AnalyticsProvider
      client={analytics}
      onInitializeSuccess={() => {
        analyticsInstance?.setGlobalContext({
          platform: isDesktop ? 'desktop' : 'web',
        });

        analyticsInstance
          ?.getProvider('posthog')
          ?.getNativeInstance()
          ?.register({
            platform: isDesktop ? 'desktop' : 'web',
          });
      }}
    >
      {children}
    </AnalyticsProvider>
  );
});
