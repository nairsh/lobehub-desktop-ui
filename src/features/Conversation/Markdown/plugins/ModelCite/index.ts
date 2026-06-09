import { type FC } from 'react';

import { type MarkdownElement, type MarkdownElementProps } from '../type';
import { MODEL_CITE_TAG, rehypeModelCite } from './rehypePlugin';
import Render from './Render';

export { MODEL_CITE_TAG, rehypeModelCite } from './rehypePlugin';
export { default as ModelCiteRender } from './Render';

const ModelCite: MarkdownElement = {
  Component: Render as FC<MarkdownElementProps>,
  rehypePlugin: rehypeModelCite,
  scope: 'assistant',
  tag: MODEL_CITE_TAG,
};

export default ModelCite;
