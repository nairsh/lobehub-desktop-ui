import { nanoid } from '@lobechat/utils';
import { type SlashOptions } from '@lobehub/editor';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_CODEMIRROR_COMMAND,
  INSERT_HEADING_COMMAND,
  INSERT_HORIZONTAL_RULE_COMMAND,
  INSERT_IMAGE_COMMAND,
  INSERT_MATH_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_QUOTE_COMMAND,
  INSERT_TABLE_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lobehub/editor';
import { Flexbox, Text } from '@lobehub/ui';
import {
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  MinusIcon,
  PilcrowIcon,
  QuoteIcon,
  SigmaIcon,
  SparklesIcon,
  SquareDashedBottomCodeIcon,
  Table2Icon,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { openFileSelector } from '@/features/EditorCanvas';

import { usePageEditorStore } from '../store';

export const useSlashItems = (): SlashOptions['items'] => {
  const { t } = useTranslation('editor');
  const pageId = usePageEditorStore((s) => s.documentId);
  const setAiIsland = usePageEditorStore((s) => s.setAiIsland);

  return useMemo(() => {
    const data: SlashOptions['items'] = [
      {
        icon: SparklesIcon,
        key: 'ask-ai',
        label: t('pageAiIsland.askAi'),
        onSelect: () => {
          const selection = window.getSelection();
          const rangeRect =
            selection && selection.rangeCount > 0
              ? selection.getRangeAt(0).getBoundingClientRect()
              : undefined;
          const anchorElement =
            selection?.anchorNode instanceof Element
              ? selection.anchorNode
              : selection?.anchorNode?.parentElement;
          const blockElement = anchorElement?.closest<HTMLElement>('[data-block-id]');
          const blockText = blockElement?.textContent?.replaceAll(/\s+/g, ' ').trim() || '';
          const blockRect = blockElement?.getBoundingClientRect();

          // TODO: wire to AI backend.
          setAiIsland({
            content: blockText,
            format: 'text',
            id: `slash-${nanoid(6)}`,
            pageId,
            preview: blockText || undefined,
            rect: {
              left: rangeRect?.left || blockRect?.left || window.innerWidth / 2 - 150,
              top: (rangeRect?.bottom || blockRect?.bottom || 160) + 8,
              width: rangeRect?.width || blockRect?.width || 300,
            },
          });
        },
      },
      {
        type: 'divider',
      },
      {
        icon: PilcrowIcon,
        key: 'text',
        label: t('selectionToolbar.text'),
        onSelect: (editor) => {
          editor.dispatchCommand(INSERT_HEADING_COMMAND, { tag: 'p' } as any);
        },
      },
      {
        icon: Heading1Icon,
        key: 'h1',
        label: t('slash.h1'),
        onSelect: (editor) => {
          editor.dispatchCommand(INSERT_HEADING_COMMAND, { tag: 'h1' });
        },
      },
      {
        icon: Heading2Icon,
        key: 'h2',
        label: t('slash.h2'),
        onSelect: (editor) => {
          editor.dispatchCommand(INSERT_HEADING_COMMAND, { tag: 'h2' });
        },
      },
      {
        icon: Heading3Icon,
        key: 'h3',
        label: t('slash.h3'),
        onSelect: (editor) => {
          editor.dispatchCommand(INSERT_HEADING_COMMAND, { tag: 'h3' });
        },
      },
      {
        icon: Heading3Icon,
        key: 'h4',
        label: t('slash.h4'),
        onSelect: (editor) => {
          editor.dispatchCommand(INSERT_HEADING_COMMAND, { tag: 'h4' });
        },
      },
      {
        icon: ListTodoIcon,
        key: 'tl',
        label: t('typobar.taskList'),
        onSelect: (editor) => {
          editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
        },
      },
      {
        icon: ListIcon,
        key: 'ul',
        label: t('typobar.bulletList'),
        onSelect: (editor) => {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        },
      },
      {
        icon: ListOrderedIcon,
        key: 'ol',
        label: t('typobar.numberList'),
        onSelect: (editor) => {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        },
      },
      {
        icon: Table2Icon,
        key: 'table',
        label: t('slash.table'),
        onSelect: (editor) => {
          editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: '3', rows: '3' });
        },
      },
      {
        icon: QuoteIcon,
        key: 'quote',
        label: t('typobar.blockquote'),
        onSelect: (editor) => {
          editor.dispatchCommand(INSERT_QUOTE_COMMAND, undefined);
        },
      },
      {
        icon: MinusIcon,
        key: 'hr',
        label: t('slash.hr'),
        onSelect: (editor) => {
          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, {});
        },
      },
      {
        type: 'divider',
      },
      {
        icon: ImageIcon,
        key: 'image',
        label: t('typobar.image'),
        onSelect: (editor) => {
          openFileSelector((files) => {
            for (const file of files) {
              if (file && file.type.startsWith('image/')) {
                editor.dispatchCommand(INSERT_IMAGE_COMMAND, { file });
              }
            }
          }, 'image/*');
        },
      },
      {
        icon: SquareDashedBottomCodeIcon,
        key: 'codeblock',
        label: t('typobar.codeblock'),
        onSelect: (editor) => {
          editor.dispatchCommand(INSERT_CODEMIRROR_COMMAND, undefined);
          queueMicrotask(() => {
            editor.focus();
          });
        },
      },
      {
        icon: SigmaIcon,
        key: 'tex',
        label: t('slash.tex'),
        onSelect: (editor) => {
          editor.dispatchCommand(INSERT_MATH_COMMAND, { code: 'x^2 + y^2 = z^2' });
          queueMicrotask(() => {
            editor.focus();
          });
        },
      },
    ];
    return data.map((item) => {
      if (item.type === 'divider') return item;
      const itemKey = String(item.key);
      const descriptions: Record<string, string> = {
        'ask-ai': t('slash.description.askAi'),
        'codeblock': t('slash.description.codeblock', {
          defaultValue: 'Capture code with syntax highlighting.',
        }),
        'h1': t('slash.description.h1', { defaultValue: 'Big section heading.' }),
        'h2': t('slash.description.h2', { defaultValue: 'Medium section heading.' }),
        'h3': t('slash.description.h3', { defaultValue: 'Small section heading.' }),
        'h4': t('slash.description.h4', { defaultValue: 'Tiny section heading.' }),
        'hr': t('slash.description.hr', { defaultValue: 'Visually divide blocks.' }),
        'image': t('slash.description.image', { defaultValue: 'Upload or embed an image.' }),
        'ol': t('slash.description.ol', { defaultValue: 'Create a numbered list.' }),
        'quote': t('slash.description.quote', { defaultValue: 'Capture a quote or citation.' }),
        'table': t('slash.description.table', { defaultValue: 'Add a simple table.' }),
        'tex': t('slash.description.tex', { defaultValue: 'Write a TeX equation.' }),
        'text': t('slash.description.text', { defaultValue: 'Start writing plain text.' }),
        'tl': t('slash.description.tl', { defaultValue: 'Track tasks with checkboxes.' }),
        'ul': t('slash.description.ul', { defaultValue: 'Create a bulleted list.' }),
      };
      return {
        ...item,
        extra: (
          <Flexbox gap={2} style={{ minWidth: 160 }}>
            <Text fontSize={12} type={'secondary'}>
              {descriptions[itemKey] || itemKey}
            </Text>
          </Flexbox>
        ),
        metadata: {
          ...item.metadata,
          description: descriptions[itemKey] || itemKey,
        },
        style: {
          minHeight: 40,
          minWidth: 260,
        },
      };
    });
  }, [pageId, setAiIsland, t]);
};
