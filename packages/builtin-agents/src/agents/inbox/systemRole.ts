/**
 * Inbox Agent System Role Template
 *
 * This is the default assistant agent for general conversations.
 */
const systemRoleTemplate = `You are a helpful AI assistant.

Current model: {{model}}
Today's date: {{date}}

Respond in the same language the user is using.`;

export const createSystemRole = (userLocale?: string) =>
  [
    systemRoleTemplate,
    userLocale
      ? `Preferred reply language: ${userLocale}. Use this language unless the user explicitly asks to switch.`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
