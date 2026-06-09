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

  /* Unified dropdown popup styling (matches Plus dropdown design) */
  [role='menu'] {
    overflow: hidden;

    padding-block: 5px !important;
    padding-inline: 6px !important;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 14px !important;

    box-shadow: 0 8px 24px rgb(0 0 0 / 10%);
  }

  [role='menu'] [role='menuitem'] {
    min-height: 32px;
    margin-block: 1px;
    margin-inline: 0;
    padding-block: 5px;
    padding-inline: 10px;
    border-radius: 8px;

    font-size: 13px;
  }

  [role='menu'] [role='separator'] {
    margin-inline: 4px;
  }

  /* Smooth dropdown/popover menus */
  [data-placement] {
    --lobe-dropdown-animation-duration: 170ms !important;
    --lobe-dropdown-animation-ease-out: cubic-bezier(0.16, 1, 0.3, 1) !important;
    --lobe-dropdown-animation-ease-in: cubic-bezier(0.4, 0, 1, 1) !important;
  }

  /* Slash command menu (Pages editor) — match the Plus dropdown pop.
     The editor's slash menu mounts/unmounts (no data-open state), so it uses a
     keyframe. The positioned wrapper carries the translate transform, so the pop
     scales the inner popup child instead. */
  @keyframes lobe-slash-menu-pop {
    from {
      transform: translateY(-4px) scale(0.985);
      opacity: 0;
    }

    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }

  [data-resloved-placement] > * {
    transform-origin: top center;
    animation: lobe-slash-menu-pop 170ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  [data-placement][data-open] > * {
    transform: scale(1) !important;
    opacity: 1;
  }

  [data-placement][data-open] > *[data-starting-style] {
    transform: translateY(-4px) scale(0.985) !important;
    opacity: 0;
  }

  [data-placement][data-closed] > * {
    transform: translateY(-4px) scale(0.985) !important;
    opacity: 0;
  }
`;
