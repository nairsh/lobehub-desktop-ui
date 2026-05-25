const createStorageMock = (): Storage =>
  ({
    clear: () => {},
    getItem: () => null,
    key: () => null,
    length: 0,
    removeItem: () => {},
    setItem: () => {},
  }) as Storage;

const storage =
  typeof globalThis.window !== 'undefined' &&
  typeof globalThis.window.localStorage?.getItem === 'function'
    ? globalThis.window.localStorage
    : createStorageMock();

if (typeof globalThis.localStorage?.getItem !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
    writable: true,
  });
}

if (typeof globalThis.sessionStorage?.getItem !== 'function') {
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value:
      typeof globalThis.window !== 'undefined' &&
      typeof globalThis.window.sessionStorage?.getItem === 'function'
        ? globalThis.window.sessionStorage
        : createStorageMock(),
    writable: true,
  });
}
