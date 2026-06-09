import { SKIP, visit } from 'unist-util-visit';

export const MODEL_CITE_TAG = 'model-cite';

/** Matches judge citation markers like `[[mc:1]]` that reference a council model by index. */
const MODEL_CITE_REGEX = /\[\[mc:(\d+)\]\]/gi;

/**
 * Rehype plugin that turns the judge's `[[mc:N]]` citation markers into custom
 * `<model-cite>` HAST elements so they can render as a model-icon chip instead of
 * a raw model name. Works in prose and inside table header/body cells.
 */
export const rehypeModelCite = () => (tree: any) => {
  visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
    if (index === undefined || !parent) return;
    // Leave code spans / blocks untouched.
    if (parent.tagName === 'code' || parent.tagName === 'pre') return;

    const value = String(node.value);

    MODEL_CITE_REGEX.lastIndex = 0;
    if (!MODEL_CITE_REGEX.test(value)) return;

    MODEL_CITE_REGEX.lastIndex = 0;
    const segments: any[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = MODEL_CITE_REGEX.exec(value)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', value: value.slice(lastIndex, match.index) });
      }

      segments.push({
        children: [{ type: 'text', value: match[0] }],
        properties: { citeIndex: Number(match[1]) },
        tagName: MODEL_CITE_TAG,
        type: 'element',
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < value.length) {
      segments.push({ type: 'text', value: value.slice(lastIndex) });
    }

    if (segments.length === 0) return;

    parent.children.splice(index, 1, ...segments);
    return [SKIP, index + segments.length];
  });
};
