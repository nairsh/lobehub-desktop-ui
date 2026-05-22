import { openTerminalWorkspaceService } from '@/services/openTerminalWorkspace';

const MAX_INLINE_COMPUTE_UPLOAD_BYTES = 10 * 1024 * 1024;

const sanitizeFileName = (name: string) =>
  name
    .replaceAll('\\', '/')
    .split('/')
    .at(-1)
    ?.replaceAll(/[^\w.+=,@-]/g, '_')
    .replace(/^_+$/, '') || 'upload.bin';

const shellQuote = (value: string) => `'${value.replaceAll("'", "'\"'\"'")}'`;

const arrayBufferToBase64 = (buffer: ArrayBuffer) => Buffer.from(buffer).toString('base64');

export const syncFilesToComputeWorkspace = async (topicId: string | undefined, files: File[]) => {
  if (!topicId || files.length === 0) return { failed: 0, skipped: 0, synced: 0 };

  const info = await openTerminalWorkspaceService.workspaceInfo(topicId);
  const uploadDirectory = `${info.topicWorkspacePath}/uploads`;
  let synced = 0;
  let skipped = 0;
  let failed = 0;

  await openTerminalWorkspaceService.runCommand({
    command: `mkdir -p ${shellQuote(uploadDirectory)}`,
    topicId,
    wait: 1,
  });

  for (const file of files) {
    if (file.size > MAX_INLINE_COMPUTE_UPLOAD_BYTES) {
      skipped += 1;
      continue;
    }

    const fileName = sanitizeFileName(file.name);
    const targetPath = `${uploadDirectory}/${fileName}`;
    const base64Path = `${targetPath}.b64`;

    try {
      const base64 = arrayBufferToBase64(await file.arrayBuffer());
      await openTerminalWorkspaceService.writeFile({
        content: base64,
        path: base64Path,
        topicId,
      });
      const result = await openTerminalWorkspaceService.runCommand({
        command: `python3 - <<'PY'\nimport base64, pathlib\nsrc = pathlib.Path(${JSON.stringify(base64Path)})\ndst = pathlib.Path(${JSON.stringify(targetPath)})\ndst.write_bytes(base64.b64decode(src.read_text()))\nsrc.unlink(missing_ok=True)\nPY`,
        topicId,
        wait: 5,
      });

      if (result.exitCode && result.exitCode !== 0) {
        failed += 1;
      } else {
        synced += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return { failed, skipped, synced };
};
