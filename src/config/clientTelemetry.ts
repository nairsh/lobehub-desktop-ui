export interface ClientPostHogConfig {
  debug: boolean;
  enabled: boolean;
  host: string;
  key: string;
}

export interface ClientTelemetryConfig {
  posthog: ClientPostHogConfig;
}

export interface ClientTelemetryOverrides {
  posthog?: Partial<ClientPostHogConfig>;
}

const DEFAULT_POSTHOG_HOST = 'https://app.posthog.com';

const parseBoolean = (value: string | undefined) => value === '1' || value === 'true';

const getBaseClientTelemetryConfig = (): ClientTelemetryConfig => {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_KEY || '';

  return {
    posthog: {
      debug: parseBoolean(
        process.env.NEXT_PUBLIC_POSTHOG_DEBUG || process.env.DEBUG_POSTHOG_ANALYTICS,
      ),
      enabled: !!posthogKey,
      host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || process.env.POSTHOG_HOST || DEFAULT_POSTHOG_HOST,
      key: posthogKey,
    },
  };
};

export const resolveClientTelemetryConfig = (
  overrides?: ClientTelemetryOverrides,
): ClientTelemetryConfig => {
  const baseConfig = getBaseClientTelemetryConfig();

  return {
    posthog: {
      ...baseConfig.posthog,
      ...overrides?.posthog,
      enabled: overrides?.posthog?.key
        ? true
        : (overrides?.posthog?.enabled ?? baseConfig.posthog.enabled),
    },
  };
};

export const getClientTelemetryConfig = () => resolveClientTelemetryConfig();

export const clientTelemetryConfig = resolveClientTelemetryConfig();
