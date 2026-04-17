import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGlobalStore } from '@/store/global';
import { initialState } from '@/store/global/initialState';

const localStorageMock = vi.hoisted(() => {
  const storage = {
    getItem: vi.fn(() => null),
    removeItem: vi.fn(),
    setItem: vi.fn(),
  };

  vi.stubGlobal('localStorage', storage);

  return storage;
});

describe('workspacePaneAction', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.setItem.mockClear();
    useGlobalStore.setState(initialState);
    useGlobalStore.setState({ isStatusInit: true });
  });

  it('should preserve topic browse context when opening command menu from chats', () => {
    const { result } = renderHook(() => useGlobalStore());

    act(() => {
      result.current.toggleCommandMenu(true, { topicBrowse: true });
    });

    expect(useGlobalStore.getState().status.showCommandMenu).toBe(true);
    expect(useGlobalStore.getState().commandMenuOpenState).toEqual({ topicBrowse: true });
  });

  it('should clear command menu context when closing', () => {
    const { result } = renderHook(() => useGlobalStore());

    act(() => {
      result.current.toggleCommandMenu(true, { topicBrowse: true });
      result.current.toggleCommandMenu(false);
    });

    expect(useGlobalStore.getState().status.showCommandMenu).toBe(false);
    expect(useGlobalStore.getState().commandMenuOpenState).toBeUndefined();
  });
});
