import { createStaticStyles } from 'antd-style';

export const styles = createStaticStyles(({ css, cssVar }) => ({
  chatPane: css`
    min-width: 0;
    height: 100%;
    background: ${cssVar.colorBgLayout};
  `,
  container: css`
    position: relative;
    overflow: hidden;
    background: ${cssVar.colorBgContainer};
  `,
  emptyChat: css`
    flex: 1;
    gap: 12px;
    align-items: center;
    justify-content: center;

    padding: 24px;

    color: ${cssVar.colorTextTertiary};
    text-align: center;
  `,
  emptyChatTitle: css`
    font-size: 16px;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
  fakeInput: css`
    display: flex;
    gap: 8px;
    align-items: center;

    width: min(720px, 90%);
    margin-block: 16px 24px;
    margin-inline: auto;
    padding-block: 12px;
    padding-inline: 16px;
    border: 1px solid ${cssVar.colorBorder};
    border-radius: 12px;

    font-size: 14px;
    color: ${cssVar.colorTextPlaceholder};

    background: ${cssVar.colorBgElevated};
  `,
  header: css`
    flex-shrink: 0;

    padding-block: 8px;
    padding-inline: 16px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};

    background: ${cssVar.colorBgContainer};
  `,
  headerTitle: css`
    overflow: hidden;

    font-size: 14px;
    font-weight: 600;
    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  panel: css`
    overflow: hidden;
    flex-shrink: 0;

    width: 360px;
    height: 100%;
    border-inline-start: 1px solid ${cssVar.colorBorderSecondary};

    background: ${cssVar.colorBgContainer};
  `,
  panelBody: css`
    overflow: hidden auto;
    flex: 1;
    padding: 16px;
  `,
  panelHeader: css`
    flex-shrink: 0;

    padding-block: 12px;
    padding-inline: 16px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};

    font-size: 14px;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
  sectionLabel: css`
    margin-block-end: 8px;

    font-size: 12px;
    font-weight: 600;
    color: ${cssVar.colorTextSecondary};
    text-transform: uppercase;
    letter-spacing: 0.04em;
  `,
}));
