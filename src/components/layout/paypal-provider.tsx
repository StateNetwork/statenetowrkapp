
'use client';

import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import React from 'react';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb'; // 'sb' is for sandbox/testing

export function PayPalProvider({ children }: { children: React.ReactNode }) {
  if (!PAYPAL_CLIENT_ID) {
    console.error("PayPal Client ID no está configurado. La funcionalidad de pago no estará disponible.");
    return <>{children}</>;
  }

  return (
    <PayPalScriptProvider options={{ 
        clientId: PAYPAL_CLIENT_ID,
        currency: "USD", // You can change this to your default currency
        intent: "capture"
    }}>
      {children}
    </PayPalScriptProvider>
  );
}
