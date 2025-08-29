'use client';

import { NextUIProvider } from '@nextui-org/react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <NextUIProvider>
        {children}
      </NextUIProvider>
    </Provider>
  );
} 