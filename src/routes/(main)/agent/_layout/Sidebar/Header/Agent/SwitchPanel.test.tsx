/**
 * @vitest-environment happy-dom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SwitchPanel from './SwitchPanel';

const navigateMock = vi.hoisted(() => vi.fn());
const useParamsMock = vi.hoisted(() => vi.fn());
const usePathnameMock = vi.hoisted(() => vi.fn());
const useServerConfigStoreMock = vi.hoisted(() => vi.fn());

vi.mock('@lobehub/ui', () => ({
  Flexbox: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Popover: ({ children, content }: { children?: ReactNode; content?: ReactNode }) => (
    <div>
      <div>{children}</div>
      <div>{content}</div>
    </div>
  ),
}));

vi.mock('@/features/NavPanel/components/NavItem', () => ({
  default: ({
    active,
    onClick,
    title,
  }: {
    active?: boolean;
    onClick?: () => void;
    title: string;
  }) => (
    <button data-active={active ? 'true' : 'false'} onClick={onClick}>
      {title}
    </button>
  ),
}));

vi.mock('@/features/NavPanel/components/SkeletonList', () => ({
  default: () => <div>Loading</div>,
}));

vi.mock('@/routes/(main)/home/_layout/Body/Agent/List', () => ({
  default: () => <div>Agent list</div>,
}));

vi.mock('@/routes/(main)/home/_layout/Body/Agent/ModalProvider', () => ({
  AgentModalProvider: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock('@/libs/router/navigation', () => ({
  usePathname: usePathnameMock,
}));

vi.mock('@/store/serverConfig', () => ({
  featureFlagsSelectors: vi.fn(),
  useServerConfigStore: useServerConfigStoreMock,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      (
        ({
          'tab.integration': 'Channels',
          'tab.profile': 'Agent Profile',
        }) as Record<string, string>
      )[key] || key,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: useParamsMock,
  };
});

describe('SwitchPanel', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useParamsMock.mockReturnValue({ aid: 'agent-123' });
    usePathnameMock.mockReturnValue('/agent/agent-123');
    useServerConfigStoreMock.mockReturnValue({ isAgentEditable: true });
  });

  it('renders agent profile and channels shortcuts for editable agents', () => {
    render(
      <SwitchPanel>
        <button>Trigger</button>
      </SwitchPanel>,
    );

    expect(screen.getByText('Agent Profile')).toBeInTheDocument();
    expect(screen.getByText('Channels')).toBeInTheDocument();
  });

  it('navigates to the agent profile and channel pages', () => {
    render(
      <SwitchPanel>
        <button>Trigger</button>
      </SwitchPanel>,
    );

    fireEvent.click(screen.getByText('Agent Profile'));
    fireEvent.click(screen.getByText('Channels'));

    expect(navigateMock).toHaveBeenNthCalledWith(1, '/agent/agent-123/profile');
    expect(navigateMock).toHaveBeenNthCalledWith(2, '/agent/agent-123/channel');
  });

  it('still renders agent shortcuts for the inbox agent route', () => {
    render(
      <SwitchPanel>
        <button>Trigger</button>
      </SwitchPanel>,
    );

    expect(screen.getByText('Agent Profile')).toBeInTheDocument();
    expect(screen.getByText('Channels')).toBeInTheDocument();
  });

  it('hides agent shortcuts when agent editing is disabled', () => {
    useServerConfigStoreMock.mockReturnValue({ isAgentEditable: false });

    render(
      <SwitchPanel>
        <button>Trigger</button>
      </SwitchPanel>,
    );

    expect(screen.queryByText('Agent Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Channels')).not.toBeInTheDocument();
  });
});
