import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAgentStore } from '@/store/agent';

import DesktopFloatingChat from './index';

vi.mock('@/features/FloatingChat', () => ({
  default: () => <div data-testid="floating-chat" />,
}));

const renderRoute = () =>
  render(
    <MemoryRouter initialEntries={['/floating-chat']}>
      <Routes>
        <Route element={<DesktopFloatingChat />} path="/floating-chat" />
        <Route element={<div data-testid="desktop-onboarding" />} path="/desktop-onboarding" />
      </Routes>
    </MemoryRouter>,
  );

describe('DesktopFloatingChat', () => {
  const useInitBuiltinAgent = vi.fn();

  beforeEach(() => {
    useInitBuiltinAgent.mockReturnValue({});
    useAgentStore.setState({
      activeAgentId: undefined,
      builtinAgentIdMap: {},
      useInitBuiltinAgent,
    } as any);
  });

  afterEach(() => {
    cleanup();
    useInitBuiltinAgent.mockReset();
  });

  it('initializes the inbox agent without redirecting to onboarding', () => {
    renderRoute();

    expect(useInitBuiltinAgent).toHaveBeenCalledWith('inbox');
    expect(screen.queryByTestId('desktop-onboarding')).toBeNull();
    expect(screen.queryByTestId('floating-chat')).toBeNull();
  });

  it('renders the floating chat when an agent is available', () => {
    useAgentStore.setState({ activeAgentId: 'agent-1' });

    renderRoute();

    expect(screen.getByTestId('floating-chat')).toBeInTheDocument();
  });

  it('renders the floating chat when the inbox agent is available', () => {
    useAgentStore.setState({ builtinAgentIdMap: { inbox: 'inbox-agent' } });

    renderRoute();

    expect(screen.getByTestId('floating-chat')).toBeInTheDocument();
  });
});
