'use client';

import { ActionIcon, Button, Flexbox, Icon, Text } from '@lobehub/ui';
import { Alert, Empty, Input, Tabs } from 'antd';
import { createStaticStyles, cssVar } from 'antd-style';
import {
  ArrowUpIcon,
  FileIcon,
  FolderIcon,
  PlayIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SendIcon,
  SquareIcon,
  TerminalIcon,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  OPEN_TERMINAL_API_MISSING,
  openTerminalWorkspaceService,
  type TerminalFileEntry,
  type TerminalWorkspaceInfo,
} from '@/services/openTerminalWorkspace';
import { useChatStore } from '@/store/chat';

const styles = createStaticStyles(({ css, cssVar }) => ({
  body: css`
    overflow: hidden;
    height: 100%;
    padding: 12px;
  `,
  code: css`
    overflow: auto;

    height: 100%;
    margin: 0;
    padding: 12px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadiusLG}px;

    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    line-height: 1.55;
    white-space: pre-wrap;

    background: ${cssVar.colorFillQuaternary};
  `,
  fileRow: css`
    cursor: pointer;
    padding-block: 7px;
    padding-inline: 8px;
    border-radius: ${cssVar.borderRadius}px;

    &:hover {
      background: ${cssVar.colorFillTertiary};
    }
  `,
  pathBar: css`
    overflow: hidden;

    padding-block: 7px;
    padding-inline: 9px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadiusLG}px;

    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;

    background: ${cssVar.colorFillQuaternary};
  `,
  terminalOutput: css`
    min-height: 260px;
    color: ${cssVar.colorText};
    background: ${cssVar.colorBgElevated};
  `,
}));

const getParentPath = (path: string) => {
  const normalized = path.replace(/\/+$/, '');
  const index = normalized.lastIndexOf('/');
  if (index <= 0) return '/';
  return normalized.slice(0, index);
};

const formatSize = (size?: number) => {
  if (size === undefined) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const TerminalWorkspaceBody = memo(() => {
  const { t } = useTranslation('portal');
  const topicId = useChatStore((s) => s.activeTopicId);

  const [info, setInfo] = useState<TerminalWorkspaceInfo | null>(null);
  const [currentPath, setCurrentPath] = useState<string>();
  const [files, setFiles] = useState<TerminalFileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ content: string; path: string } | null>(null);
  const [error, setError] = useState<string>();
  const [loadingFiles, setLoadingFiles] = useState(false);

  const [command, setCommand] = useState('');
  const [stdin, setStdin] = useState('');
  const [processId, setProcessId] = useState<string>();
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('');

  const getErrorMessage = useCallback(
    (error: unknown) => {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === OPEN_TERMINAL_API_MISSING
      ) {
        return t('terminalWorkspace.serverMissingApis');
      }

      return error instanceof Error ? error.message : String(error);
    },
    [t],
  );

  const sortedFiles = useMemo(
    () =>
      [...files].sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [files],
  );

  const loadFiles = useCallback(
    async (path?: string) => {
      if (!topicId) return;

      setLoadingFiles(true);
      setError(undefined);

      try {
        const result = await openTerminalWorkspaceService.listFiles({ path, topicId });
        setCurrentPath(result.directory);
        setFiles(result.entries);
      } catch (error) {
        setError(getErrorMessage(error));
      } finally {
        setLoadingFiles(false);
      }
    },
    [getErrorMessage, topicId],
  );

  useEffect(() => {
    if (!topicId) return;

    let cancelled = false;

    openTerminalWorkspaceService
      .workspaceInfo(topicId)
      .then(async (result) => {
        if (cancelled) return;
        setInfo(result);

        // Prefer the topic uploads subdirectory so synced uploads are discoverable.
        // Use direct listFiles (not loadFiles) because loadFiles catches errors internally
        // and would silently set the error state without letting us detect the failure.
        const uploadsPath = `${result.topicWorkspacePath}/uploads`;
        try {
          const listResult = await openTerminalWorkspaceService.listFiles({
            path: uploadsPath,
            topicId,
          });
          if (cancelled) return;
          setCurrentPath(listResult.directory);
          setFiles(listResult.entries);
        } catch (_err) {
          // uploads/ not available — fall back to topic workspace path
          if (cancelled) return;
          setCurrentPath(result.topicWorkspacePath);
          await loadFiles(result.topicWorkspacePath);
        }
      })
      .catch((error) => {
        if (!cancelled) setError(getErrorMessage(error));
      });

    return () => {
      cancelled = true;
    };
  }, [getErrorMessage, loadFiles, topicId]);

  useEffect(() => {
    if (!topicId || !processId || !isRunning) return;

    const timer = window.setInterval(() => {
      openTerminalWorkspaceService
        .getCommandStatus({ processId, topicId, wait: 0 })
        .then((result) => {
          if (result.output) setTerminalOutput((value) => value + result.output);
          setIsRunning(result.running);
        })
        .catch((error) => {
          setTerminalOutput((value) => `${value}\n${getErrorMessage(error)}`);
          setIsRunning(false);
        });
    }, 1500);

    return () => window.clearInterval(timer);
  }, [getErrorMessage, isRunning, processId, topicId]);

  const readFile = useCallback(
    async (file: TerminalFileEntry) => {
      if (!topicId) return;

      setError(undefined);
      try {
        const result = await openTerminalWorkspaceService.readFile({
          endLine: 500,
          path: file.path,
          startLine: 1,
          topicId,
        });
        setSelectedFile({ content: result.content, path: result.path });
      } catch (error) {
        setError(getErrorMessage(error));
      }
    },
    [getErrorMessage, topicId],
  );

  const runCommand = useCallback(
    async (nextCommand = command, background = false) => {
      if (!topicId || !nextCommand.trim()) return;

      setError(undefined);
      setTerminalOutput((value) => `${value}$ ${nextCommand}\n`);

      try {
        const result = await openTerminalWorkspaceService.runCommand({
          background,
          command: nextCommand,
          cwd: currentPath,
          topicId,
          wait: background ? 0 : 1,
        });

        if (result.output) setTerminalOutput((value) => value + result.output);
        setProcessId(result.id);
        setIsRunning(result.running);
        setCommand('');
      } catch (error) {
        setTerminalOutput((value) => `${value}${getErrorMessage(error)}\n`);
      }
    },
    [command, currentPath, getErrorMessage, topicId],
  );

  const sendInput = useCallback(async () => {
    if (!topicId || !processId || !stdin) return;

    await openTerminalWorkspaceService.sendCommandInput({
      input: stdin.endsWith('\n') ? stdin : `${stdin}\n`,
      processId,
      topicId,
    });
    setTerminalOutput((value) => `${value}${stdin}\n`);
    setStdin('');
  }, [processId, stdin, topicId]);

  const stopCommand = useCallback(async () => {
    if (!topicId || !processId) return;
    await openTerminalWorkspaceService.killCommand({ processId, topicId });
    setIsRunning(false);
  }, [processId, topicId]);

  const resetWorkspace = useCallback(async () => {
    if (!topicId) return;
    await openTerminalWorkspaceService.resetCurrentTopicWorkspace(topicId);
    setSelectedFile(null);
    await loadFiles(info?.topicWorkspacePath);
  }, [info?.topicWorkspacePath, loadFiles, topicId]);

  if (!topicId) {
    return (
      <Flexbox className={styles.body}>
        <Alert showIcon message={t('terminalWorkspace.noTopic')} type="info" />
      </Flexbox>
    );
  }

  return (
    <Flexbox className={styles.body} gap={12}>
      {error && <Alert showIcon message={error} type="warning" />}

      {info && (
        <Flexbox gap={4}>
          <Text strong>{info.label}</Text>
          <Text type="secondary">
            {t('terminalWorkspace.workspacePaths', {
              shared: info.sharedWorkspacePath,
              topic: info.topicWorkspacePath,
            })}
          </Text>
        </Flexbox>
      )}

      <Tabs
        destroyInactiveTabPane={false}
        items={[
          {
            key: 'files',
            label: t('terminalWorkspace.tabs.files'),
            children: (
              <Flexbox gap={10} height="100%">
                <Flexbox horizontal align="center" gap={6}>
                  <Button size="small" onClick={() => info && loadFiles(info.rootPath)}>
                    {t('terminalWorkspace.rootDirectory')}
                  </Button>
                  <Button size="small" onClick={() => info && loadFiles(info.sharedWorkspacePath)}>
                    {t('terminalWorkspace.sharedDirectory')}
                  </Button>
                  <Button size="small" onClick={() => info && loadFiles(info.topicWorkspacePath)}>
                    {t('terminalWorkspace.topicDirectory')}
                  </Button>
                  <ActionIcon
                    disabled={!currentPath || currentPath === '/'}
                    icon={ArrowUpIcon}
                    title={t('terminalWorkspace.parentDirectory')}
                    onClick={() => currentPath && loadFiles(getParentPath(currentPath))}
                  />
                  <div className={styles.pathBar} style={{ flex: 1 }}>
                    {currentPath || info?.topicWorkspacePath || '.'}
                  </div>
                  <ActionIcon
                    icon={RefreshCwIcon}
                    loading={loadingFiles}
                    title={t('terminalWorkspace.refresh')}
                    onClick={() => loadFiles(currentPath)}
                  />
                  <ActionIcon
                    icon={RotateCcwIcon}
                    title={t('terminalWorkspace.resetTopic')}
                    onClick={resetWorkspace}
                  />
                </Flexbox>

                <Flexbox gap={2} style={{ overflow: 'auto' }}>
                  {sortedFiles.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    sortedFiles.map((file) => (
                      <Flexbox
                        horizontal
                        align="center"
                        className={styles.fileRow}
                        gap={8}
                        key={file.path}
                        onClick={() => (file.isDirectory ? loadFiles(file.path) : readFile(file))}
                      >
                        <Icon
                          color={file.isDirectory ? cssVar.colorWarning : undefined}
                          icon={file.isDirectory ? FolderIcon : FileIcon}
                          size={16}
                        />
                        <Text ellipsis style={{ flex: 1 }}>
                          {file.name}
                        </Text>
                        {!file.isDirectory && (
                          <Text style={{ fontSize: 11 }} type="secondary">
                            {formatSize(file.size)}
                          </Text>
                        )}
                      </Flexbox>
                    ))
                  )}
                </Flexbox>

                {selectedFile && (
                  <Flexbox gap={6} style={{ minHeight: 180 }}>
                    <Text ellipsis type="secondary">
                      {selectedFile.path}
                    </Text>
                    <pre className={styles.code}>{selectedFile.content}</pre>
                  </Flexbox>
                )}
              </Flexbox>
            ),
          },
          {
            key: 'terminal',
            label: t('terminalWorkspace.tabs.terminal'),
            children: (
              <Flexbox gap={10} height="100%">
                <Flexbox horizontal gap={6}>
                  <Input
                    placeholder={t('terminalWorkspace.commandPlaceholder')}
                    prefix={<TerminalIcon size={14} />}
                    value={command}
                    onChange={(event) => setCommand(event.target.value)}
                    onPressEnter={() => runCommand()}
                  />
                  <Button icon={PlayIcon} type="primary" onClick={() => runCommand()}>
                    {t('terminalWorkspace.run')}
                  </Button>
                  <Button onClick={() => runCommand('bash', true)}>
                    {t('terminalWorkspace.startShell')}
                  </Button>
                  <ActionIcon
                    disabled={!isRunning}
                    icon={SquareIcon}
                    title={t('terminalWorkspace.stop')}
                    onClick={stopCommand}
                  />
                </Flexbox>

                <pre className={`${styles.code} ${styles.terminalOutput}`}>
                  {terminalOutput || t('terminalWorkspace.outputPlaceholder')}
                </pre>

                <Flexbox horizontal gap={6}>
                  <Input
                    disabled={!processId || !isRunning}
                    placeholder={t('terminalWorkspace.stdinPlaceholder')}
                    value={stdin}
                    onChange={(event) => setStdin(event.target.value)}
                    onPressEnter={sendInput}
                  />
                  <ActionIcon
                    disabled={!processId || !isRunning || !stdin}
                    icon={SendIcon}
                    title={t('terminalWorkspace.sendInput')}
                    onClick={sendInput}
                  />
                </Flexbox>
              </Flexbox>
            ),
          },
        ]}
      />
    </Flexbox>
  );
});

TerminalWorkspaceBody.displayName = 'TerminalWorkspaceBody';

export default TerminalWorkspaceBody;
