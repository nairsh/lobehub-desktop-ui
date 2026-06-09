// Share the lazy (code-split) loader with the web build. The previous
// `eager: true` globs inlined every locale × namespace into the startup module
// graph, which Electron had to parse on every launch; lazy chunks load
// near-instantly from local disk instead. The `.vite` suffix is
// platform-protected, so this re-export is not rewritten back to this file.
export type {
  LoadI18nNamespaceModuleParams,
  LoadI18nNamespaceModuleWithFallbackParams,
} from './loadI18nNamespaceModule.vite';
export {
  loadI18nNamespaceModule,
  loadI18nNamespaceModuleWithFallback,
} from './loadI18nNamespaceModule.vite';
