// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('getClientTelemetryConfig', () => {
  beforeEach(() => {
    vi.resetModules();

    delete process.env.NEXT_PUBLIC_POSTHOG_DEBUG;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.DEBUG_POSTHOG_ANALYTICS;
    delete process.env.POSTHOG_HOST;
    delete process.env.POSTHOG_KEY;
  });

  it('should map PostHog env values for client-side initialization', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_DEBUG = '1';
    process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://us.i.posthog.com';
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';

    const { getClientTelemetryConfig } = await import('./clientTelemetry');
    const config = getClientTelemetryConfig();

    expect(config.posthog).toEqual({
      debug: true,
      enabled: true,
      host: 'https://us.i.posthog.com',
      key: 'phc_test_key',
    });
  });

  it('should map server-style PostHog env values for desktop builds', async () => {
    process.env.DEBUG_POSTHOG_ANALYTICS = '1';
    process.env.POSTHOG_HOST = 'https://eu.i.posthog.com';
    process.env.POSTHOG_KEY = 'phc_desktop_key';

    const { getClientTelemetryConfig } = await import('./clientTelemetry');
    const config = getClientTelemetryConfig();

    expect(config.posthog).toEqual({
      debug: true,
      enabled: true,
      host: 'https://eu.i.posthog.com',
      key: 'phc_desktop_key',
    });
  });

  it('should fallback to safe defaults when env values are missing', async () => {
    const { getClientTelemetryConfig } = await import('./clientTelemetry');
    const config = getClientTelemetryConfig();

    expect(config.posthog).toEqual({
      debug: false,
      enabled: false,
      host: 'https://app.posthog.com',
      key: '',
    });
  });
});
