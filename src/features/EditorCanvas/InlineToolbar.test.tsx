/**
 * @vitest-environment happy-dom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import InlineToolbar from './InlineToolbar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const createEditorState = () => ({
  blockquote: vi.fn(),
  bold: vi.fn(),
  bulletList: vi.fn(),
  canRedo: false,
  canUndo: false,
  checkList: vi.fn(),
  code: vi.fn(),
  codeblock: vi.fn(),
  insertLink: vi.fn(),
  insertMath: vi.fn(),
  isBlockquote: false,
  isBold: false,
  isCode: false,
  isItalic: false,
  isStrikethrough: false,
  isUnderline: false,
  italic: vi.fn(),
  numberList: vi.fn(),
  redo: vi.fn(),
  strikethrough: vi.fn(),
  underline: vi.fn(),
  undo: vi.fn(),
});

describe('InlineToolbar', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'getSelection').mockReturnValue({
      isCollapsed: false,
      toString: () => 'selected text',
    } as Selection);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the redesigned floating selection toolbar actions', () => {
    render(
      <InlineToolbar
        floating
        editor={{ dispatchCommand: vi.fn() } as any}
        editorState={createEditorState() as any}
      />,
    );

    expect(screen.getByLabelText('selectionToolbar.text')).toBeTruthy();
    expect(screen.getByLabelText('typobar.link')).toBeTruthy();
    expect(screen.getByLabelText('selectionToolbar.more')).toBeTruthy();
  });

  it('invokes formatting actions from floating buttons', () => {
    const editorState = createEditorState();

    render(
      <InlineToolbar
        floating
        editor={{ dispatchCommand: vi.fn() } as any}
        editorState={editorState as any}
      />,
    );

    fireEvent.click(screen.getByLabelText('typobar.bold'));

    expect(editorState.bold).toHaveBeenCalledTimes(1);
  });
});
