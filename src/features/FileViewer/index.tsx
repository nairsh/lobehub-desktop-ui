'use client';

import { type CSSProperties } from 'react';
import { memo } from 'react';

import { type FileListItem } from '@/types/files';

import {
  HTML_EXTENSIONS,
  HTML_MIME_TYPES,
  IMAGE_EXTENSIONS,
  IMAGE_MIME_TYPES,
  matchesFileType,
} from './fileType';
import NotSupport from './NotSupport';
import CodeViewer from './Renderer/Code';
import HTMLViewer from './Renderer/HTML';
import ImageViewer from './Renderer/Image';
import MSDocViewer from './Renderer/MSDoc';
import PDFViewer from './Renderer/PDF';
import VideoViewer from './Renderer/Video';

// File type definitions
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg'];
const VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/webm', 'video/ogg', 'mp4', 'webm', 'ogg']);

const CODE_EXTENSIONS = [
  // JavaScript/TypeScript
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  // Python
  '.py',
  '.pyw',
  // Java/JVM
  '.java',
  '.kt',
  '.kts',
  '.scala',
  '.groovy',
  // C/C++
  '.c',
  '.h',
  '.cpp',
  '.cxx',
  '.cc',
  '.hpp',
  '.hxx',
  // Other compiled languages
  '.cs',
  '.go',
  '.rs',
  '.rb',
  '.php',
  '.swift',
  '.lua',
  '.r',
  '.dart',
  // Shell
  '.sh',
  '.bash',
  '.zsh',
  // Web
  '.html',
  '.htm',
  '.css',
  '.scss',
  '.sass',
  '.less',
  // Data formats
  '.json',
  '.xml',
  '.yaml',
  '.yml',
  '.toml',
  '.sql',
  // Functional languages
  '.ex',
  '.exs',
  '.erl',
  '.hrl',
  '.clj',
  '.cljs',
  '.cljc',
  // Markdown
  '.md',
  '.mdx',
  // Other
  '.vim',
  '.graphql',
  '.gql',
  '.txt',
];

const CODE_MIME_TYPES = new Set([
  // JavaScript/TypeScript
  'js',
  'jsx',
  'ts',
  'tsx',
  'application/javascript',
  'application/x-javascript',
  'text/javascript',
  'application/typescript',
  'text/typescript',
  // Python
  'python',
  'text/x-python',
  'application/x-python-code',
  // Java/JVM
  'java',
  'text/x-java-source',
  'kotlin',
  'scala',
  // C/C++
  'c',
  'text/x-c',
  'cpp',
  'text/x-c++',
  // Other languages
  'csharp',
  'go',
  'rust',
  'ruby',
  'php',
  'text/x-php',
  'swift',
  'lua',
  'r',
  'dart',
  // Shell
  'bash',
  'shell',
  'text/x-shellscript',
  // Web
  'html',
  'text/html',
  'css',
  'text/css',
  'scss',
  'sass',
  'less',
  // Data
  'json',
  'application/json',
  'xml',
  'text/xml',
  'application/xml',
  'yaml',
  'text/yaml',
  'application/x-yaml',
  'toml',
  'sql',
  'text/x-sql',
  // Markdown
  'md',
  'mdx',
  'text/markdown',
  'text/x-markdown',
  // Other
  'graphql',
  'txt',
  'text/plain',
]);

const MSDOC_EXTENSIONS = ['.doc', '.docx', '.odt', '.ppt', '.pptx', '.xls', '.xlsx'];
const MSDOC_MIME_TYPES = new Set([
  'doc',
  'docx',
  'odt',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

// Archive file types - not supported for preview
const ARCHIVE_EXTENSIONS = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.tgz'];
const ARCHIVE_MIME_TYPES = new Set([
  'zip',
  'rar',
  '7z',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  'application/x-gzip',
  'application/x-bzip2',
  'application/x-xz',
]);

interface FileViewerProps extends FileListItem {
  className?: string;
  style?: CSSProperties;
}

/**
 * Preview any file type.
 */
const FileViewer = memo<FileViewerProps>(({ id, style, fileType, url, name }) => {
  // PDF files
  if (fileType?.toLowerCase() === 'pdf' || name?.toLowerCase().endsWith('.pdf')) {
    return <PDFViewer fileId={id} url={url} />;
  }

  // Image files
  if (matchesFileType(fileType, name, IMAGE_EXTENSIONS, IMAGE_MIME_TYPES)) {
    return <ImageViewer fileId={id} url={url} />;
  }

  // Video files
  if (matchesFileType(fileType, name, VIDEO_EXTENSIONS, VIDEO_MIME_TYPES)) {
    return <VideoViewer fileId={id} url={url} />;
  }

  // HTML files should render as documents, not syntax-highlighted source.
  if (matchesFileType(fileType, name, HTML_EXTENSIONS, HTML_MIME_TYPES)) {
    return <HTMLViewer fileId={id} url={url} />;
  }

  // Archive files (zip, rar, 7z, etc.) - not supported for preview
  // Check before code files to avoid false matches
  if (matchesFileType(fileType, name, ARCHIVE_EXTENSIONS, ARCHIVE_MIME_TYPES)) {
    return <NotSupport fileName={name} style={style} url={url} />;
  }

  // Microsoft Office documents - check before code files to avoid false matches
  // (e.g., 'doc' contains 'c' which would match CODE_EXTENSIONS)
  if (matchesFileType(fileType, name, MSDOC_EXTENSIONS, MSDOC_MIME_TYPES)) {
    return <MSDocViewer fileId={id} url={url} />;
  }

  // Code files (JavaScript, TypeScript, Python, Java, C++, Go, Rust, Markdown, etc.)
  if (matchesFileType(fileType, name, CODE_EXTENSIONS, CODE_MIME_TYPES)) {
    return <CodeViewer fileId={id} fileName={name} url={url} />;
  }

  // Unsupported file type
  return <NotSupport fileName={name} style={style} url={url} />;
});

export default FileViewer;
