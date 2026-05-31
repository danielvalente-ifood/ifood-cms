'use client';

import { createContext, useContext } from 'react';

interface MediaContextValue {
  verticalId: string | null;
  verticalSlug: string | null;
}

const MediaContext = createContext<MediaContextValue>({
  verticalId: null,
  verticalSlug: null,
});

export function MediaProvider({
  verticalId,
  verticalSlug,
  children,
}: MediaContextValue & { children: React.ReactNode }) {
  return (
    <MediaContext.Provider value={{ verticalId, verticalSlug }}>
      {children}
    </MediaContext.Provider>
  );
}

export function useMediaContext() {
  return useContext(MediaContext);
}
