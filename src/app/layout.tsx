
import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { AuthProvider } from '@/hooks/use-auth';
import { PayPalProvider } from '@/components/layout/paypal-provider';

export const metadata: Metadata = {
  title: 'Statehills Roleplay',
  description: 'Tu servidor de rol de próxima generación.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
       <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Outfit:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased min-h-screen flex flex-col", 'dark')}>
        <Image
          src="https://i.imgur.com/rlCv34U.png"
          alt="Fondo de Statehills"
          fill
          className="-z-20 object-cover"
        />
        <div className="absolute inset-0 bg-background/95 -z-10" />
        <AuthProvider>
          <PayPalProvider>
            <Navbar />
            <main className="flex-grow w-full flex flex-col items-center">
              <div className="w-full container px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
            <Footer />
          </PayPalProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
