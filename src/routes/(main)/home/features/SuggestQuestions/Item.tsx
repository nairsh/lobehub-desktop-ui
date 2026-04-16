'use client';

import { Flexbox, Icon, Text } from '@lobehub/ui';
import { createStaticStyles, cssVar } from 'antd-style';
import { CornerRightUp } from 'lucide-react';
import { memo, useCallback } from 'react';

import { useChatStore } from '@/store/chat';

const styles = createStaticStyles(({ css, cssVar }) => ({
  item: css`
    cursor: pointer;
    border-radius: ${cssVar.borderRadiusSM};
    padding: 7px 10px;
    transition: background 0.1s;

    &:hover {
      background: ${cssVar.colorFillTertiary};

      .arrow-icon {
        opacity: 1;
      }
    }
  `,
}));

interface ItemProps {
  description: string;
  prompt: string;
  title: string;
}

const Item = memo<ItemProps>(({ title, prompt }) => {
  const mainInputEditor = useChatStore((s) => s.mainInputEditor);

  const handleClick = useCallback(() => {
    mainInputEditor?.instance?.setDocument('markdown', prompt);
    mainInputEditor?.focus();
  }, [prompt, mainInputEditor]);

  return (
    <Flexbox
      className={styles.item}
      horizontal
      align={'center'}
      justify={'space-between'}
      onClick={handleClick}
    >
      <Text ellipsis fontSize={13} style={{ fontWeight: 400 }}>
        {title}
      </Text>
      <Icon
        className="arrow-icon"
        color={cssVar.colorTextQuaternary}
        icon={CornerRightUp}
        size={13}
        style={{ flexShrink: 0, opacity: 0, transition: 'opacity 0.1s' }}
      />
    </Flexbox>
  );
});

export default Item;
