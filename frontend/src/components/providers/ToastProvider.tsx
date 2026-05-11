'use client';

import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// suppressHydrationWarning ile bis_skin_checked gibi browser extension
// attribute injection'larından kaynaklanan hydration uyarısı bastırıldı.
export default function ToastProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div suppressHydrationWarning>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#2a2a3e',
            color:      '#e2e8f0',
            border:     '1px solid rgba(99,102,241,0.3)',
            borderRadius: '10px',
            fontSize:   '0.875rem',
          },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </div>
  );
}
