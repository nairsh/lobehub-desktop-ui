// Share the lazy antd-locale loader with the web build — the previous
// `eager: true` glob inlined all 18 antd locales into the startup graph.
export { getAntdLocale } from './locale.vite';
