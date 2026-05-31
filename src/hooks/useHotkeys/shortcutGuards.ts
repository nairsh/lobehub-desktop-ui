export const isEditableShortcutTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  if (target.isContentEditable) return true;

  const tagName = target.tagName.toLowerCase();
  if (tagName === 'textarea' || tagName === 'select') return true;

  if (tagName === 'input') {
    const type = (target as HTMLInputElement).type;
    return ![
      'button',
      'checkbox',
      'color',
      'file',
      'image',
      'radio',
      'range',
      'reset',
      'submit',
    ].includes(type);
  }

  return !!target.closest('[contenteditable="true"], [data-lexical-editor="true"]');
};

export const isModTEvent = (event: KeyboardEvent): boolean =>
  event.key.toLowerCase() === 't' && (event.metaKey || event.ctrlKey) && !event.altKey;

export const isFloatingChatEvent = (event: KeyboardEvent): boolean =>
  (event.key.toLowerCase() === 'k' || event.code === 'KeyK') &&
  (event.metaKey || event.ctrlKey) &&
  event.shiftKey &&
  !event.altKey;
