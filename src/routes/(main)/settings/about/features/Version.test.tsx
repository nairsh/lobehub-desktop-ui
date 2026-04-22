/**
 * @vitest-environment happy-dom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Version from './Version';

const getElectronIpcMock = vi.hoisted(() => vi.fn());
const messageErrorMock = vi.hoisted(() => vi.fn());
const messageSuccessMock = vi.hoisted(() => vi.fn());
const getAppIconStateMock = vi.hoisted(() =>
  vi.fn(async () => ({
    isCustom: true,
    previewDataUrl: 'data:image/png;base64,initial-icon',
  })),
);
const resetAppIconMock = vi.hoisted(() =>
  vi.fn(async () => ({
    isCustom: false,
    previewDataUrl: 'data:image/png;base64,default-icon',
  })),
);
const selectAppIconMock = vi.hoisted(() =>
  vi.fn(async () => ({
    isCustom: true,
    previewDataUrl: 'data:image/png;base64,selected-icon',
  })),
);
const getBuildChannelMock = vi.hoisted(() => vi.fn(async () => 'stable'));
const getUpdaterStateMock = vi.hoisted(() => vi.fn(async () => ({ stage: 'idle' })));
const installNowMock = vi.hoisted(() => vi.fn(async () => undefined));
const checkUpdateMock = vi.hoisted(() => vi.fn(async () => undefined));
const useCheckServerVersionMock = vi.hoisted(() => vi.fn());
const useNewVersionMock = vi.hoisted(() => vi.fn(() => false));

vi.mock('@lobechat/business-const', () => ({
  BRANDING_NAME: 'LobeHub',
}));

vi.mock('@lobechat/electron-client-ipc', () => ({
  getElectronIpc: getElectronIpcMock,
  useWatchBroadcast: vi.fn(),
}));

vi.mock('@lobehub/ui', () => ({
  Block: ({
    children,
    onClick,
    ...props
  }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) => (
    <div
      data-testid="version-logo"
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  ),
  Button: ({
    children,
    loading,
    onClick,
    ...props
  }: HTMLAttributes<HTMLButtonElement> & { children: ReactNode; loading?: boolean }) => (
    <button type="button" onClick={onClick} {...props}>
      {loading ? 'loading' : children}
    </button>
  ),
  Flexbox: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  Tag: ({ children, ...props }: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) => (
    <span {...props}>{children}</span>
  ),
}));

vi.mock('antd', () => ({
  App: {
    useApp: () => ({
      message: {
        error: messageErrorMock,
        success: messageSuccessMock,
      },
    }),
  },
}));

vi.mock('antd-style', () => ({
  createStaticStyles: (factory: any) =>
    factory({
      css: () => 'mock-class',
      cssVar: {
        borderRadiusLG: '8px',
        colorTextDescription: '#999',
      },
    }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => options?.defaultValue || key,
  }),
}));

vi.mock('@/components/Branding', () => ({
  ProductLogo: () => <div>ProductLogo</div>,
}));

vi.mock('@/const/url', () => ({
  CHANGELOG_URL: 'https://example.com/changelog',
  MANUAL_UPGRADE_URL: 'https://example.com/upgrade',
  OFFICIAL_SITE: 'https://example.com',
}));

vi.mock('@/const/version', () => ({
  CURRENT_VERSION: '1.0.0',
}));

vi.mock('@/features/User/UserPanel/useNewVersion', () => ({
  useNewVersion: useNewVersionMock,
}));

vi.mock('@/services/electron/autoUpdate', () => ({
  autoUpdateService: {
    checkUpdate: checkUpdateMock,
    getBuildChannel: getBuildChannelMock,
    getUpdaterState: getUpdaterStateMock,
    installNow: installNowMock,
  },
}));

vi.mock('@/services/electron/system', () => ({
  electronSystemService: {
    getAppIconState: getAppIconStateMock,
    resetAppIcon: resetAppIconMock,
    selectAppIcon: selectAppIconMock,
  },
}));

vi.mock('@/store/global', () => ({
  useGlobalStore: (selector: (state: any) => unknown) =>
    selector({
      latestVersion: null,
      serverVersion: null,
      useCheckServerVersion: useCheckServerVersionMock,
    }),
}));

describe('Version', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getElectronIpcMock.mockReturnValue({});
    getAppIconStateMock.mockResolvedValue({
      isCustom: true,
      previewDataUrl: 'data:image/png;base64,initial-icon',
    });
    selectAppIconMock.mockResolvedValue({
      isCustom: true,
      previewDataUrl: 'data:image/png;base64,selected-icon',
    });
    resetAppIconMock.mockResolvedValue({
      isCustom: false,
      previewDataUrl: 'data:image/png;base64,default-icon',
    });
    getUpdaterStateMock.mockResolvedValue({ stage: 'idle' });
    getBuildChannelMock.mockResolvedValue('stable');
    useNewVersionMock.mockReturnValue(false);
  });

  it('should let desktop users change and reset the app icon from the prominent logo', async () => {
    render(<Version />);

    await waitFor(() => {
      expect(getAppIconStateMock).toHaveBeenCalled();
    });

    expect(screen.getByText('about.appIcon.desc')).toBeTruthy();
    expect(screen.getByText('about.appIcon.reset')).toBeTruthy();
    expect(screen.getByAltText('LobeHub').getAttribute('src')).toBe(
      'data:image/png;base64,initial-icon',
    );

    fireEvent.click(screen.getByTestId('version-logo'));

    await waitFor(() => {
      expect(selectAppIconMock).toHaveBeenCalled();
    });

    expect(messageSuccessMock).toHaveBeenCalledWith('about.appIcon.updateSuccess');
    expect(screen.getByAltText('LobeHub').getAttribute('src')).toBe(
      'data:image/png;base64,selected-icon',
    );

    fireEvent.click(screen.getByText('about.appIcon.reset'));

    await waitFor(() => {
      expect(resetAppIconMock).toHaveBeenCalled();
    });

    expect(messageSuccessMock).toHaveBeenCalledWith('about.appIcon.resetSuccess');
    expect(screen.getByAltText('LobeHub').getAttribute('src')).toBe(
      'data:image/png;base64,default-icon',
    );
  });

  it('should keep the website link behavior outside Electron', async () => {
    getElectronIpcMock.mockReturnValue(null);

    const { container } = render(<Version />);

    await waitFor(() => {
      expect(getAppIconStateMock).not.toHaveBeenCalled();
    });

    expect(screen.queryByText('about.appIcon.desc')).toBeNull();
    expect(container.querySelector('a[href="https://example.com"]')).toBeTruthy();
  });
});
