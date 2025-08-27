
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { RuleCategory } from '@/lib/types';

function RuleCardSkeleton() {
    return (
        <Card className="h-full w-full max-w-sm overflow-hidden border border-primary/20">
            <CardHeader className="p-0">
                <Skeleton className="h-48 w-full" />
            </CardHeader>
            <CardContent className="p-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
            </CardContent>
        </Card>
    )
}

export default function NormativasPage() {
    const [ruleCategories, setRuleCategories] = useState<RuleCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRules = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "ruleCategories"));
                const rules = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return { id: doc.id, ...data }
                }) as RuleCategory[];
                setRuleCategories(rules);
            } catch (error) {
                console.error("Error fetching rules:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRules();
    }, []);

  return (
    <div className="container mx-auto py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-glow">Normativas del Servidor</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Conoce las reglas para una convivencia justa y divertida.
        </p>
      </div>
        {loading ? (
             <div className="grid justify-items-center gap-8 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <RuleCardSkeleton key={i} />)}
            </div>
        ) : ruleCategories.length === 0 ? (
            <div className="text-center py-16">
                <p className="text-xl text-muted-foreground">Aún no se han publicado normativas.</p>
                <p className="text-muted-foreground">Los administradores están trabajando en ello.</p>
            </div>
        ) : (
             <div className="grid justify-items-center gap-8 md:grid-cols-2 lg:grid-cols-3">
                {ruleCategories.map((category) => (
                <Link href={`/normativas/${category.id}`} key={category.id} className="group w-full max-w-sm">
                    <Card className="h-full overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 border border-primary/20 hover:border-primary/50">
                    <CardHeader className="p-0">
                        <div className="relative h-48 w-full">
                        <Image
                            src={category.image}
                            alt={category.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <CardTitle className="text-2xl font-bold mb-2">{category.title}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                    </CardContent>
                    </Card>
                </Link>
                ))
            }
            </div>
        )}
    </div>
  );
}
