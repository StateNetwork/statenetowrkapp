
'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { linkDiscordAccount } from '@/app/actions/discordActions';
import { Loader2 } from 'lucide-react';

function DiscordCallback() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      console.error(`Discord callback error: ${error}`);
      // Handle error display or redirect if necessary
      return;
    }

    if (code) {
      linkDiscordAccount(code);
    }
  }, [code, error]);

  return (
    <div className="w-full h-[calc(100vh-14rem)] flex flex-col items-center justify-center gap-4 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <h1 className="text-xl font-medium">Vinculando tu cuenta de Discord...</h1>
      <p className="text-muted-foreground">Por favor, espera. Esto no debería tardar mucho.</p>
    </div>
  );
}


export default function DiscordCallbackPage() {
    return (
        <Suspense>
            <DiscordCallback />
        </Suspense>
    )
}
