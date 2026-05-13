import { Accordion, AccordionItem, ScrollShadow } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { type CSSProperties, type ReactNode, type RefObject } from 'react';
import { memo, useEffect, useState } from 'react';

import MarkdownMessage from '@/features/Conversation/Markdown';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { type ChatCitationItem } from '@/types/index';

import Title from './Title';

const styles = createStaticStyles(({ css, cssVar }) => ({
  contentScroll: css`
    scrollbar-width: none;

    max-height: min(12vh, 96px);
    padding-block-end: 8px;
    padding-inline: 8px;

    color: ${cssVar.colorTextDescription};

    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }

    article * {
      color: ${cssVar.colorTextDescription};
    }
  `,
  contentScrollExpanded: css`
    max-height: min(60vh, 480px);
    padding-block-end: 8px;
    padding-inline: 8px;
    color: ${cssVar.colorTextDescription};

    article * {
      color: ${cssVar.colorTextDescription};
    }
  `,
}));

interface ThinkingProps {
  citations?: ChatCitationItem[];
  content?: string | ReactNode;
  duration?: number;
  style?: CSSProperties;
  thinking?: boolean;
  thinkingAnimated?: boolean;
}

const Thinking = memo<ThinkingProps>((props) => {
  const { content, duration, thinking, citations, thinkingAnimated } = props;
  const [showDetail, setShowDetail] = useState(thinking);

  const { ref, handleScroll } = useAutoScroll<HTMLDivElement>({
    deps: [content, showDetail],
    enabled: thinking && showDetail,
    threshold: 120,
  });

  // Auto-expand when thinking starts, collapse when thinking ends
  useEffect(() => {
    setShowDetail(thinking);
  }, [thinking]);

  return (
    <Accordion
      expandedKeys={showDetail ? ['thinking'] : []}
      gap={8}
      variant={'borderless'}
      onExpandedChange={(keys) => setShowDetail(keys.length > 0)}
    >
      <AccordionItem
        itemKey={'thinking'}
        paddingBlock={4}
        paddingInline={4}
        title={<Title duration={duration} thinking={thinking} />}
        variant={'borderless'}
      >
        <ScrollShadow
          className={thinking ? styles.contentScroll : styles.contentScrollExpanded}
          offset={12}
          ref={ref as RefObject<HTMLDivElement>}
          size={12}
          onScroll={handleScroll}
        >
          {typeof content === 'string' ? (
            <MarkdownMessage
              animated={thinkingAnimated}
              citations={citations}
              variant={'chat'}
              style={{
                overflow: 'unset',
              }}
            >
              {content}
            </MarkdownMessage>
          ) : (
            content
          )}
        </ScrollShadow>
      </AccordionItem>
    </Accordion>
  );
});

export default Thinking;
