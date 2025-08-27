
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { StoreItemCard } from '@/components/store-item-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { StoreItem } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Gift } from 'lucide-react';

function StoreItemSkeleton() {
    return (
        <Card className="flex flex-col h-full w-full max-w-sm overflow-hidden border border-primary/20 bg-card">
            <CardHeader className="p-0">
                <Skeleton className="h-56 w-full" />
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-5/6" />
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
                 <Skeleton className="h-10 w-24" />
                 <Skeleton className="h-8 w-20" />
            </CardFooter>
        </Card>
    )
}

export default function TiendaPage() {
    const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
    const [ownedItems, setOwnedItems] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();


    useEffect(() => {
        const hasAccepted = localStorage.getItem('store_terms_accepted');
        if (hasAccepted !== 'true') {
            router.push('/tienda/accept-terms');
            return;
        }

        const fetchItems = async () => {
            setLoading(true);
            try {
                const itemsQuery = query(collection(db, "storeItems"));
                const itemsSnapshot = await getDocs(itemsQuery);
                const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StoreItem[];
                setStoreItems(items);

                if (user) {
                    const packagesSnapshot = await getDocs(collection(db, `users/${user.uid}/packages`));
                    const ownedItemIds = new Set(packagesSnapshot.docs.map(doc => doc.data().id as string));
                    setOwnedItems(ownedItemIds);
                } else {
                    setOwnedItems(new Set());
                }

            } catch (error) {
                console.error("Error fetching store items:", error);
            } finally {
                setLoading(false);
            }
        };

        if(!authLoading){
             fetchItems();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, authLoading, user]);

    const itemTypes = useMemo(() => {
        const types = new Set(storeItems.map(item => item.type));
        return ['all', ...Array.from(types)];
    }, [storeItems]);

    const filteredItems = useMemo(() => {
        return storeItems
            .filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesType = selectedType === 'all' || item.type === selectedType;
                return matchesSearch && matchesType;
            })
            // Sort owned items to the end
            .sort((a, b) => {
                const aIsOwned = ownedItems.has(a.id);
                const bIsOwned = ownedItems.has(b.id);
                if (aIsOwned === bIsOwned) return 0;
                return aIsOwned ? 1 : -1;
            });
    }, [storeItems, searchTerm, selectedType, ownedItems]);

  return (
    <div className="container mx-auto py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-glow">Tienda del Servidor</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Mejora tu experiencia de juego con nuestros paquetes exclusivos.
        </p>
      </div>

       <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-col md:flex-row gap-4">
                <Input
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                />
                <Select onValueChange={setSelectedType} defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        {itemTypes.map(type => (
                            <SelectItem key={type} value={type} className="capitalize">
                                {type === 'all' ? 'Todos los tipos' : type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <Button asChild>
                <Link href="/tienda/regalar">
                    <Gift className="mr-2 h-4 w-4" />
                    Hacer un Regalo
                </Link>
            </Button>
      </div>

      {loading ? (
           <div className="grid justify-items-center gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
               {Array.from({ length: 8 }).map((_, i) => <StoreItemSkeleton key={i} />)}
           </div>
      ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">No se encontraron productos.</p>
              <p className="text-muted-foreground">Intenta ajustar tu búsqueda o filtros.</p>
          </div>
      ) : (
          <div className="grid justify-items-center gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                  <StoreItemCard key={item.id} item={item} isOwned={ownedItems.has(item.id)} />
              ))}
          </div>
      )}
    </div>
  );
}

    