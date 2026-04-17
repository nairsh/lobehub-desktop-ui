import { CLASSNAMES } from '@lobehub/ui';
import type { Theme } from 'antd-style';
import { css } from 'antd-style';

// fix ios input keyboard
// overflow: hidden;
// ref: https://zhuanlan.zhihu.com/p/113855026
// eslint-disable-next-line unicorn/no-anonymous-default-export
export default ({ token }: { prefixCls: string; token: Theme }) => css`
  html,
  body,
  #__next {
    position: relative;

    overscroll-behavior: none;

    height: 100%;
    min-height: 100dvh;
    max-height: 100dvh;

    @media (device-width >= 576px) {
      overflow: hidden;
    }
  }

  body {
    /* Increase compositing layer, force hardware acceleration, otherwise render black edges will appear */
    will-change: opacity;
    transform: translateZ(0);
    font-weight: 400;
  }

  * {
    scrollbar-color: ${token.colorFill} transparent;
    scrollbar-width: thin;
    transition-duration: 0.1s;
    transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow;

    ::-webkit-scrollbar {
      width: 0.75em;
      height: 0.75em;
    }

    ::-webkit-scrollbar-thumb {
      border-radius: 10px;
    }

    :hover::-webkit-scrollbar-thumb {
      border: 3px solid transparent;
      background-color: ${token.colorText};
      background-clip: content-box;
    }

    ::-webkit-scrollbar-track {
      background-color: transparent;
    }
  }

  html.desktop[data-theme='dark'] body {
    background-color: color-mix(in srgb, ${token.colorBgLayout} 50%, transparent);
  }

  html.desktop[data-theme='light'] body {
    background-color: color-mix(in srgb, ${token.colorBgLayout} 70%, transparent);
  }

  button {
    -webkit-app-region: no-drag;
  }

  .${CLASSNAMES.ContextTrigger}[data-popup-open]:not([data-no-highlight]),
  .${CLASSNAMES.DropdownMenuTrigger}[data-popup-open]:not([data-no-highlight]) {
    background: ${token.colorFillTertiary};
  }
  .accordion-action:has(
    .${CLASSNAMES.DropdownMenuTrigger}[data-popup-open]:not([data-no-highlight])
  ) {
    opacity: 1;
  }

  /* Snappy pop animation for all dropdown/popover menus */
  [data-placement] {
    --lobe-dropdown-animation-duration: 110ms !important;
    --lobe-dropdown-animation-ease-out: cubic-bezier(0.25, 1.4, 0.5, 1) !important;
    --lobe-dropdown-animation-ease-in: cubic-bezier(0.4, 0, 1, 1) !important;
  }

  [data-placement][data-open] > * {
    transform: scale(1) !important;
    opacity: 1;
  }

  [data-placement][data-open] > *[data-starting-style] {
    transform: scale(0.92) !important;
    opacity: 0;
  }

  [data-placement][data-closed] > * {
    transform: scale(0.92) !important;
    opacity: 0;
  }
`;
