// The desktop build now shares the lazy (code-split) route tree with the web
// build. Eagerly importing every route pulled the whole app into one ~33 MB
// renderer chunk that V8 had to parse on every launch; route-level dynamic
// imports load instantly from local disk while keeping startup parse cost low.
//
// NOTE: this file must stay a re-export of `./desktopRouter.routes` (same as
// `desktopRouter.config.tsx`). It cannot import `./desktopRouter.config`
// directly — the vitePlatformResolve plugin would rewrite that specifier back
// to this `.desktop` file and create an import cycle.
export { desktopRoutes } from './desktopRouter.routes';
