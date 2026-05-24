import { createStaticStyles } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { ArrowRight, Square } from 'lucide-react';
import { memo } from 'react';

import { selectors, useChatInputStore } from '../store';

const styles = createStaticStyles(({ css, cssVar }) => ({
  button: css`
    cursor: pointer;

    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    width: 28px;
    height: 28px;
    border: none;
    border-radius: 50%;

    color: ${cssVar.colorBgBase};

    background: ${cssVar.colorText};

    transition: opacity 0.08s;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.3;
    }

    &:hover:not(:disabled) {
      opacity: 0.8;
    }
  `,
}));

const SendButton = memo(() => {
  const { generating, disabled } = useChatInputStore(selectors.sendButtonProps, isEqual);
  const [send, handleStop] = useChatInputStore((s) => [s.handleSendButton, s.handleStop]);

  return (
    <button
      className={styles.button}
      disabled={disabled && !generating}
      onClick={() => (generating ? handleStop() : send())}
    >
      {generating ? (
        <Square fill={'currentColor'} size={10} strokeWidth={0} />
      ) : (
        <ArrowRight size={14} />
      )}
    </button>
  );
});

SendButton.displayName = 'SendButton';

export default SendButton;
