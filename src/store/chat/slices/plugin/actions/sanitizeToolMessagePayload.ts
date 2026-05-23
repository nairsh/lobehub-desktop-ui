import { truncateToolResult } from '@/server/utils/truncateToolResult';

const MAX_METADATA_DEPTH = 4;
const MAX_METADATA_ITEMS = 40;
const MAX_METADATA_STRING_LENGTH = 4000;
const MAX_PLUGIN_STATE_BYTES = 100 * 1024;

const truncateString = (value: string) => {
  if (value.length <= MAX_METADATA_STRING_LENGTH) return value;

  return `${value.slice(0, MAX_METADATA_STRING_LENGTH)}\n...[truncated]`;
};

const sanitizeSerializableValue = (value: unknown, depth = 0): unknown => {
  if (value == null) return value;

  if (typeof value === 'string') return truncateString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;

  if (depth >= MAX_METADATA_DEPTH) {
    if (Array.isArray(value)) return `[truncated array:${value.length}]`;
    return '[truncated object]';
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_METADATA_ITEMS)
      .map((item) => sanitizeSerializableValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_METADATA_ITEMS);

    return Object.fromEntries(
      entries.map(([key, item]) => [key, sanitizeSerializableValue(item, depth + 1)]),
    );
  }

  return String(value);
};

const sanitizePluginState = (value: unknown) => {
  if (value === undefined) return undefined;

  const sanitized = sanitizeSerializableValue(value);
  const serialized = JSON.stringify(sanitized);

  if (serialized.length <= MAX_PLUGIN_STATE_BYTES) return sanitized;

  return {
    notice: 'Plugin state was truncated before persistence because it exceeded the size limit.',
    preview: truncateString(serialized),
    truncated: true,
  };
};

export const sanitizeToolMessagePayload = <
  T extends {
    content?: string;
    metadata?: Record<string, unknown>;
    pluginState?: unknown;
  },
>(
  payload: T,
) => {
  const nextPayload = { ...payload } as Omit<T, 'content' | 'metadata' | 'pluginState'> & {
    content?: string;
    metadata?: Record<string, unknown>;
    pluginState?: unknown;
  };

  if (typeof nextPayload.content === 'string') {
    nextPayload.content = truncateToolResult(nextPayload.content);
  }

  if (nextPayload.metadata) {
    nextPayload.metadata = sanitizeSerializableValue(nextPayload.metadata) as Record<
      string,
      unknown
    >;
  }

  if ('pluginState' in nextPayload) {
    nextPayload.pluginState = sanitizePluginState(nextPayload.pluginState);
  }

  return nextPayload;
};
