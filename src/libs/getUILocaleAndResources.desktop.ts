// Share the lazy UI-locale loader with the web build. The previous
// `eager: true` glob statically imported ui.json for every locale, which
// (via the i18n-{locale} manualChunks grouping) chained ALL locale chunks
// into the renderer's startup module graph.
export { getUILocaleAndResources } from './getUILocaleAndResources.vite';
