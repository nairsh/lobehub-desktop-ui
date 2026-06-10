'use client';

import { Button, Flexbox, Icon, TextArea } from '@lobehub/ui';
import { cssVar } from 'antd-style';
import { SmilePlus } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import EmojiPicker from '@/components/EmojiPicker';
import { useGlobalStore } from '@/store/global';
import { globalGeneralSelectors } from '@/store/global/selectors';
import { truncateByWeightedLength } from '@/utils/textLength';

import { usePageEditorStore } from './store';

const TitleSection = memo(() => {
  const { t } = useTranslation('file');
  const locale = useGlobalStore(globalGeneralSelectors.currentLanguage);

  const emoji = usePageEditorStore((s) => s.emoji);
  const title = usePageEditorStore((s) => s.title);
  const setEmoji = usePageEditorStore((s) => s.setEmoji);
  const setTitle = usePageEditorStore((s) => s.setTitle);
  const handleTitleSubmit = usePageEditorStore((s) => s.handleTitleSubmit);

  const [isHoveringTitle, setIsHoveringTitle] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  return (
    <Flexbox
      gap={8}
      paddingBlock={'0 12px'}
      style={{
        cursor: 'default',
        marginTop: -10,
        position: 'relative',
      }}
      onMouseEnter={() => setIsHoveringTitle(true)}
      onMouseLeave={() => setIsHoveringTitle(false)}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {/* Emoji picker above Choose Icon button */}
      {(emoji || showEmojiPicker) && (
        <EmojiPicker
          allowDelete
          locale={locale}
          open={showEmojiPicker}
          shape={'square'}
          size={78}
          title={t('pageEditor.chooseIcon')}
          value={emoji}
          onChange={(e) => {
            setEmoji(e);
            setShowEmojiPicker(false);
          }}
          onDelete={() => {
            setEmoji(undefined);
            setShowEmojiPicker(false);
          }}
          onOpenChange={(open) => {
            setShowEmojiPicker(open);
          }}
        />
      )}

      {/* Choose Icon button - only shown when no emoji */}
      {!emoji && !showEmojiPicker && (
        <Button
          icon={<Icon icon={SmilePlus} />}
          size="small"
          type="text"
          style={{
            opacity: isHoveringTitle ? 1 : 0,
            pointerEvents: isHoveringTitle ? 'auto' : 'none',
            position: 'absolute',
            top: -36,
            transition: 'opacity 120ms ease',
            width: 'fit-content',
          }}
          onClick={() => {
            setEmoji('📄');
            setShowEmojiPicker(true);
          }}
        >
          {t('pageEditor.chooseIcon')}
        </Button>
      )}

      {/* Title Input */}
      <TextArea
        autoSize={{ minRows: 1 }}
        placeholder={t('pageEditor.titlePlaceholder')}
        value={title}
        variant={'borderless'}
        style={{
          color: cssVar.colorText,
          fontFamily:
            'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: 0,
          lineHeight: 1.18,
          minHeight: 48,
          padding: 0,
          resize: 'none',
          width: '100%',
        }}
        onChange={(e) => {
          const truncated = truncateByWeightedLength(e.target.value, 100);
          setTitle(truncated);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleTitleSubmit();
          }
        }}
      />
    </Flexbox>
  );
});

export default TitleSection;
