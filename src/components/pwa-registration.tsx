'use strict';
'use client';

import { useEffect } from 'react';

export function PWARegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SW registered:', reg))
        .catch((err) => console.log('SW error:', err));
    }
  }, []);

  return null;
}
