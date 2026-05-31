import { describe, expect, it } from 'vitest';

import { isEditableShortcutTarget, isFloatingChatEvent, isModTEvent } from './shortcutGuards';

describe('shortcutGuards', () => {
  it('detects editable shortcut targets', () => {
    const input = document.createElement('input');
    input.type = 'text';
    const textarea = document.createElement('textarea');
    const button = document.createElement('input');
    button.type = 'button';
    const editor = document.createElement('div');
    editor.setAttribute('data-lexical-editor', 'true');
    const child = document.createElement('span');
    editor.appendChild(child);

    expect(isEditableShortcutTarget(input)).toBe(true);
    expect(isEditableShortcutTarget(textarea)).toBe(true);
    expect(isEditableShortcutTarget(child)).toBe(true);
    expect(isEditableShortcutTarget(button)).toBe(false);
  });

  it('detects guarded shortcut key combinations', () => {
    expect(isModTEvent(new KeyboardEvent('keydown', { key: 't', metaKey: true }))).toBe(true);
    expect(isModTEvent(new KeyboardEvent('keydown', { key: 't', ctrlKey: true }))).toBe(true);
    expect(
      isModTEvent(new KeyboardEvent('keydown', { altKey: true, key: 't', metaKey: true })),
    ).toBe(false);

    expect(
      isFloatingChatEvent(
        new KeyboardEvent('keydown', { code: 'KeyK', key: 'k', metaKey: true, shiftKey: true }),
      ),
    ).toBe(true);
    expect(
      isFloatingChatEvent(new KeyboardEvent('keydown', { code: 'KeyK', key: 'k', metaKey: true })),
    ).toBe(false);
  });
});
