import { createStaticStyles } from 'antd-style';
import { ArrowRight, Square } from 'lucide-react';
import isEqual from 'fast-deep-equal';
import { memo } from 'react';

import { selectors, useChatInputStore } from '../store';

const styles = createStaticStyles(({ css, cssVar }) => ({
  button: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 34px;
    height: 34px;
    flex-shrink: 0;

    color: ${cssVar.colorBgBase};
    background: ${cssVar.colorText};
    border: none;
    border-radius: 50%;

    cursor: pointer;
    transition: opacity 0.08s;

    &:hover:not(:disabled) {
      opacity: 0.8;
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
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
        <Square fill={'currentColor'} size={12} strokeWidth={0} />
      ) : (
        <ArrowRight size={16} />
      )}
    </button>
  );
});

SendButton.displayName = 'SendButton';

export default SendButton;
