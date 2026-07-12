'use client';

import { useEffect } from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { hydrateDraft, loadPersistedDraft } from '@/store/slices/editorialDraftSlice';

export function Providers({ children }: { children: React.ReactNode }) {
  // Rehydrate the persisted draft after mount only. Reading localStorage during
  // SSR/store-init would throw and cause a hydration mismatch (KTD1); the server
  // renders the empty initial state and the client fills it in here.
  useEffect(() => {
    const persisted = loadPersistedDraft();
    if (persisted) store.dispatch(hydrateDraft(persisted));
  }, []);

  return (
    <Provider store={store}>
      <NextUIProvider>
        <div data-theme="light">
          {children}
        </div>
      </NextUIProvider>
    </Provider>
  );
} 