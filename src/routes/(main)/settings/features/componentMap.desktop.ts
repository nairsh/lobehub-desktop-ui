// The desktop build shares the lazy settings component map — eagerly importing
// every settings page pulled all of them into the main renderer chunk.
// Must re-export from `./componentMap.lazy` (not `./componentMap`, which
// vitePlatformResolve would rewrite back to this file, creating a cycle).
export { componentMap } from './componentMap.lazy';
