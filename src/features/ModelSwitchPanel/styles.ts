import { createStaticStyles } from 'antd-style';

export const MENU_ITEM_WRAPPER_STYLE = { marginBlock: 2 } as const;
export const MENU_ITEM_TRIGGER_STYLE = { paddingBlock: 4, paddingInline: 4 } as const;

const ITEM_MARGIN_INLINE = 6;

export const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    pointer-events: auto;
    user-select: none;
    overflow: hidden;
    padding: 0 !important;
  `,
  detailPopup: css`
    user-select: none;
    overscroll-behavior: contain;
    width: 400px;
  `,
  dropdownMenu: css`
    user-select: none;

    [role='menuitem'] {
      min-height: 0;
      margin-block: ${MENU_ITEM_WRAPPER_STYLE.marginBlock}px;
      margin-inline: ${ITEM_MARGIN_INLINE}px;
      padding-block: ${MENU_ITEM_TRIGGER_STYLE.paddingBlock}px;
      padding-inline: ${MENU_ITEM_TRIGGER_STYLE.paddingInline}px;
      border-radius: ${cssVar.borderRadiusSM};
    }
  `,
  groupHeader: css`
    width: 100%;
    color: ${cssVar.colorTextSecondary};
  `,
  list: css`
    position: relative;

    overflow: hidden auto;
    overscroll-behavior: contain;

    width: 100%;
    padding-block: 4px;
    padding-inline: 0;
  `,
  menuItem: css`
    cursor: pointer;

    position: relative;

    gap: 8px;
    align-items: center;

    min-height: 0;
    margin-block: ${MENU_ITEM_WRAPPER_STYLE.marginBlock}px;
    margin-inline: ${ITEM_MARGIN_INLINE}px;
    padding-block: ${MENU_ITEM_TRIGGER_STYLE.paddingBlock}px;
    padding-inline: ${MENU_ITEM_TRIGGER_STYLE.paddingInline}px;
    border-radius: ${cssVar.borderRadiusSM};
  `,
  menuItemActive: css`
    background: ${cssVar.colorFillTertiary};
  `,
  menuTrigger: css`
    overflow: hidden;

    /* width: auto lets flex stretch apply correctly with margin-inline */
    box-sizing: border-box;
    width: auto !important;
    min-height: 0 !important;
    margin-inline: ${ITEM_MARGIN_INLINE}px;
    padding-block: ${MENU_ITEM_TRIGGER_STYLE.paddingBlock}px !important;
    padding-inline: ${MENU_ITEM_TRIGGER_STYLE.paddingInline}px !important;
  `,
  footer: css`
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
  `,
  toolbar: css`
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};
  `,
  trigger: css`
    display: inline-flex;
    outline: none;

    /* SVG icons (from @lobehub/icons IconAvatar) can receive focus when dropdown closes,
       causing an unwanted blue outline ring */
    svg:focus {
      outline: none;
    }
  `,
}));
