import { describe, expect, it } from 'vitest';

import {
  HTML_EXTENSIONS,
  HTML_MIME_TYPES,
  IMAGE_EXTENSIONS,
  IMAGE_MIME_TYPES,
  matchesFileType,
} from './fileType';

describe('FileViewer type matching', () => {
  it('detects exported HTML as renderable HTML instead of generic source', () => {
    expect(matchesFileType('text/html', 'report.html', HTML_EXTENSIONS, HTML_MIME_TYPES)).toBe(
      true,
    );
    expect(matchesFileType(undefined, 'report.htm', HTML_EXTENSIONS, HTML_MIME_TYPES)).toBe(true);
  });

  it('detects SVG as an image preview format', () => {
    expect(matchesFileType('image/svg+xml', 'chart.svg', IMAGE_EXTENSIONS, IMAGE_MIME_TYPES)).toBe(
      true,
    );
  });
});
