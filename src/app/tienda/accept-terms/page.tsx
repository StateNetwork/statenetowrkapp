'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { TermsOfUse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AcceptTermsPage() {
    const [terms, setTerms] = useState<TermsOfUse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const termsRef = doc(db, 'siteContent', 'termsOfUse');
                const termsSnap = await getDoc(termsRef);
                if (termsSnap.exists()) {
                    setTerms(termsSnap.data() as TermsOfUse);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Error fetching terms:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchTerms();
    }, []);

    const handleAccept = () => {
        localStorage.setItem('store_terms_accepted', 'true');
        router.push('/tienda');
    };

    return (
        <div className="container flex items-center justify-center min-h-[calc(100vh-14rem)] py-12">
            <Card className="w-full max-w-2xl border-primary/50">
                <CardHeader>
                    <CardTitle className="text-2xl">Términos de Uso de la Tienda</CardTitle>
                    <CardDescription>Por favor, lee y acepta los términos para continuar.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    )}
                    {error && (
                         <div className="text-center py-10 text-destructive">
                            <p>No se pudieron cargar los términos de uso.</p>
                            <p>Por favor, inténtalo de nuevo más tarde.</p>
                        </div>
                    )}
                    {terms && (
                        <ScrollArea className="h-72 w-full rounded-md border p-4 whitespace-pre-wrap font-mono text-sm">
                            {terms.content}
                        </ScrollArea>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => router.push('/')}>
                        Rechazar
                    </Button>
                    <Button onClick={handleAccept} disabled={loading || error || !terms}>
                        Aceptar y Continuar
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
