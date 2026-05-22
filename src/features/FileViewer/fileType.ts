export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
export const IMAGE_MIME_TYPES = new Set([
  'image/jpg',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
]);

export const HTML_EXTENSIONS = ['.html', '.htm'];
export const HTML_MIME_TYPES = new Set(['html', 'htm', 'text/html']);

export const matchesFileType = (
  fileType: string | undefined,
  fileName: string | undefined,
  extensions: string[],
  mimeTypes: Set<string>,
): boolean => {
  const lowerFileType = fileType?.toLowerCase();
  const lowerFileName = fileName?.toLowerCase();

  if (lowerFileType && mimeTypes.has(lowerFileType)) {
    return true;
  }

  if (lowerFileType && extensions.some((ext) => lowerFileType.includes(ext.slice(1)))) {
    return true;
  }

  if (lowerFileName && extensions.some((ext) => lowerFileName.endsWith(ext))) {
    return true;
  }

  return false;
};
