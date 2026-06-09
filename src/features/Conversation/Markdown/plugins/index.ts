import ImageSearchRef from './ImageSearchRef';
import LobeArtifact from './LobeArtifact';
import LobeThinking from './LobeThinking';
import LocalFile from './LocalFile';
import Mention from './Mention';
import ModelCite from './ModelCite';
import Thinking from './Thinking';
import { type MarkdownElement } from './type';

export type { MarkdownElement } from './type';

export const markdownElements: MarkdownElement[] = [
  Thinking,
  LobeArtifact,
  LobeThinking,
  LocalFile,
  Mention,
  ImageSearchRef,
  ModelCite,
];
