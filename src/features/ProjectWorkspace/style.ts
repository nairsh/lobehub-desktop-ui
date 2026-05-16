import { createStaticStyles } from 'antd-style';

export const styles = createStaticStyles(({ css, cssVar }) => ({
  backLink: css`
    display: inline-flex;
    gap: 6px;
    align-items: center;

    font-size: 13px;
    color: ${cssVar.colorTextSecondary};
    text-decoration: none;

    transition: color 0.15s;

    &:hover {
      color: ${cssVar.colorText};
    }
  `,
  backRow: css`
    padding-block: 20px 0;
    padding-inline: 60px;
  `,
  chatPane: css`
    overflow: hidden auto;
    min-width: 0;
    height: 100%;
    background: ${cssVar.colorBgLayout};
  `,
  container: css`
    position: relative;
    overflow: hidden;
    background: ${cssVar.colorBgContainer};
  `,
  conversationDivider: css`
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};
  `,
  conversationsEmpty: css`
    padding-block: 28px;
    text-align: center;
  `,
  conversationsSection: css`
    padding-block-start: 8px;
    padding-inline: 60px;
  `,
  descriptionRow: css`
    padding-block: 6px 0;
    padding-inline: 60px;
  `,
  /* Chat input — inset from content edges */
  inputSection: css`
    margin-block: 36px 0;
    padding-inline: 120px;
  `,
  /* ── Right panel (gray bg, card sections inside) ── */
  panel: css`
    overflow: hidden;
    flex-shrink: 0;

    width: 400px;
    height: 100%;
    border-inline-start: 1px solid ${cssVar.colorBorderSecondary};

    background: ${cssVar.colorBgLayout};
  `,
  panelBody: css`
    overflow: hidden auto;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 12px;

    padding: 16px;
  `,
  /* White card with border inside the gray panel */
  panelCard: css`
    overflow: hidden;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 10px;
    background: ${cssVar.colorBgContainer};
  `,
  panelCardBody: css`
    padding-block: 0 14px;
    padding-inline: 16px;
  `,
  panelCardHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding-block: 12px 8px;
    padding-inline: 16px;
  `,
  panelCardLabel: css`
    font-size: 14px;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
  projectDescription: css`
    font-size: 14px;
    line-height: 1.6;
    color: ${cssVar.colorTextSecondary};
  `,
  projectTitle: css`
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
    color: ${cssVar.colorText};
  `,
  storageText: css`
    font-size: 11px;
    color: ${cssVar.colorTextTertiary};
  `,
  titleRow: css`
    gap: 8px;
    padding-block: 12px 6px;
    padding-inline: 60px;
  `,
}));
