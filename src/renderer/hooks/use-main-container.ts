import * as React from 'react';

// context that provides an optional default container element for portals
// we store the element itself so consumers re-render when it becomes available
export const MainContainerContext = React.createContext<Element | null>(null);

export function useMainContainer(): Element | null {
  return React.useContext(MainContainerContext);
}
