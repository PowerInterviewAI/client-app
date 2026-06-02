// Some dependencies (e.g. react-markdown) reference the global `JSX` namespace.
// Ensure it exists by wiring it to React's JSX definitions.

import type { JSX as ReactJSX } from 'react';

declare global {
  namespace JSX {
    // Use a type alias instead of an empty interface to avoid
    // `@typescript-eslint/no-empty-object-type` while keeping
    // the global JSX.IntrinsicElements mapped to React's definitions.
    type IntrinsicElements = ReactJSX.IntrinsicElements;
  }
}

export {};
