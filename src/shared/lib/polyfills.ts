import { Buffer as BufferPolyfill } from 'buffer';

/**
 * @ton/core (used to build the TON transfer body) relies on the Node.js
 * `Buffer` global. Browsers don't provide it, and @ton/core touches `Buffer`
 * at module-evaluation time, so importing it without this polyfill throws
 * `ReferenceError: Buffer is not defined` and blanks the whole app.
 *
 * This module MUST be imported before anything that (transitively) imports
 * @ton/core — see the first import in `main.tsx`.
 */
const scope = globalThis as { Buffer?: unknown };

if (typeof scope.Buffer === 'undefined') {
  scope.Buffer = BufferPolyfill;
}

export {};
