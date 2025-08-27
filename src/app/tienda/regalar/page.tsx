
'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, where, query, addDoc, serverTimestamp, writeBatch, getDoc, doc } from 'firebase/firestore';
import type { StoreItem } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Gift } from 'lucide-react';
import { PayPalButtons, OnApproveData, CreateOrderData } from "@paypal/react-paypal-js";


const giftSchema = z.object({
  recipientEmail: z.string().email("Debe ser un correo electrónico válido."),
  itemId: z.string().min(1, "Debes seleccionar un producto."),
  message: z.string().max(500, "El mensaje no puede exceder los 500 caracteres.").optional(),
});

type GiftFormValues = z.infer<typeof giftSchema>;

export default function GiftPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [orderData, setOrderData] = useState<GiftFormValues | null>(null);

    const { control, register, handleSubmit, watch, formState: { errors } } = useForm<GiftFormValues>({
        resolver: zodResolver(giftSchema),
    });

    const selectedItemId = watch('itemId');
    const selectedItem = storeItems.find(item => item.id === selectedItemId);
    const isFree = selectedItem?.price === 0;

    useEffect(() => {
        if (!authLoading && !user) {
            toast({ title: "Acceso denegado", description: "Debes iniciar sesión para hacer un regalo.", variant: "destructive" });
            router.push('/login');
        }

        const fetchItems = async () => {
            setLoadingItems(true);
            try {
                const querySnapshot = await getDocs(collection(db, "storeItems"));
                const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StoreItem[];
                setStoreItems(items);
            } catch (error) {
                console.error("Error fetching items for gifting:", error);
                toast({ title: "Error", description: "No se pudieron cargar los productos.", variant: "destructive" });
            } finally {
                setLoadingItems(false);
            }
        };

        fetchItems();
    }, [authLoading, user, router, toast]);
    
    const onSubmit = (data: GiftFormValues) => {
        if (!user) return;
        if (data.recipientEmail === user.email) {
            toast({ title: "Acción no permitida", description: "No puedes regalarte un producto a ti mismo.", variant: "destructive" });
            return;
        }
        setOrderData(data);
    };

    const grantGiftToUser = async (data: GiftFormValues, orderId?: string) => {
        if (!user) throw new Error("Remitente no encontrado.");
        if (!selectedItem) throw new Error("Producto seleccionado no válido.");

        // 1. Find the recipient user by email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("email", "==", data.recipientEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error(`No se encontró ningún usuario con el correo electrónico: ${data.recipientEmail}`);
        }

        const recipientDoc = querySnapshot.docs[0];
        const recipientId = recipientDoc.id;
        
        // 2. Prepare item data to be added to subcollection
        const itemRef = doc(db, "storeItems", selectedItem.id);
        const itemSnap = await getDoc(itemRef);

        if (!itemSnap.exists()) {
            throw new Error("El producto ya no existe.");
        }
        
        const itemDataForGift = itemSnap.data();
        
        // 3. Use a batch write to add package and gift notification
        const batch = writeBatch(db);
        
        const recipientPackagesRef = collection(db, 'users', recipientId, 'packages');
        const newPackageRef = doc(recipientPackagesRef); // auto-generate ID
        batch.set(newPackageRef, {
            ...itemDataForGift,
            purchaseDate: serverTimestamp(),
            isGift: true,
            giftedBy: user.username,
            giftMessage: data.message || "",
            paypalOrderId: orderId || null
        });

        // (Optional) You could add a 'notifications' subcollection for the recipient
        // to explicitly inform them they received a gift. For now, it just appears in their packages.

        await batch.commit();

        toast({
            title: "¡Regalo enviado!",
            description: `${selectedItem.name} ha sido enviado a ${data.recipientEmail}.`,
        });

        router.push('/tienda');
    };
    
    // PAYPAL HANDLERS
    const createOrder = (data: CreateOrderData, actions: any) => {
        if (!selectedItem || selectedItem.price <= 0) {
            toast({ title: "Error", description: "Producto no válido para la compra.", variant: "destructive" });
            return Promise.reject(new Error("Invalid item for purchase"));
        }
        return actions.order.create({
            purchase_units: [{
                description: `Regalo: ${selectedItem.name} para ${orderData?.recipientEmail}`,
                amount: {
                    currency_code: selectedItem.currency || 'USD',
                    value: selectedItem.price.toFixed(2),
                },
            }],
        });
    };
    
    const onApprove = async (data: OnApproveData, actions: any) => {
        if (!orderData) return;
        setIsPurchasing(true);
        toast({ title: "Procesando pago...", description: "Por favor espera mientras verificamos tu regalo." });
        
        try {
            const capture = await actions.order.capture();
            if (capture.status !== 'COMPLETED') {
                throw new Error("El pago no fue completado en PayPal.");
            }
            await grantGiftToUser(orderData, data.orderID);
        } catch (error: any) {
            console.error("Gifting error:", error);
            toast({ title: "Error al regalar", description: error.message, variant: "destructive" });
        } finally {
            setIsPurchasing(false);
            setOrderData(null);
        }
    };
    
    const onError = (err: any) => {
        console.error("PayPal Error:", err);
        toast({ title: "Error de PayPal", description: "Ocurrió un error con PayPal. Inténtalo de nuevo.", variant: "destructive" });
        setIsPurchasing(false);
    };

    const handleFreeGift = async () => {
        if (!orderData) return;
        setIsPurchasing(true);
         try {
            await grantGiftToUser(orderData);
        } catch (error: any) {
            console.error("Free Gifting error:", error);
            toast({ title: "Error al regalar", description: error.message, variant: "destructive" });
        } finally {
            setIsPurchasing(false);
            setOrderData(null);
        }
    }


    if (authLoading || loadingItems || !user) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-14rem)]">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }
    

    return (
        <div className="container py-12 md:py-16">
            <Card className="max-w-2xl mx-auto bg-card/80">
                <CardHeader>
                    <CardTitle className="text-2xl">Hacer un Regalo</CardTitle>
                    <CardDescription>
                      Sorprende a otro usuario con un paquete de la tienda.
                    </CardDescription>
                </CardHeader>
                 <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="recipientEmail">Correo del Destinatario</Label>
                            <Input id="recipientEmail" placeholder="amigo@ejemplo.com" {...register('recipientEmail')} />
                            {errors.recipientEmail && <p className="text-sm text-destructive">{errors.recipientEmail.message}</p>}
                        </div>

                         <div className="grid gap-2">
                            <Label htmlFor="itemId">Producto a Regalar</Label>
                            <Controller
                                name="itemId"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger id="itemId">
                                            <SelectValue placeholder="Selecciona un producto..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {storeItems.map(item => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.name} ({item.price === 0 ? 'Gratis' : `${item.price.toFixed(2)} ${item.currency}`})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                             {errors.itemId && <p className="text-sm text-destructive">{errors.itemId.message}</p>}
                        </div>

                         <div className="grid gap-2">
                            <Label htmlFor="message">Mensaje (Opcional)</Label>
                            <Textarea id="message" rows={4} placeholder="¡Disfruta de tu regalo!" {...register('message')} />
                             {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
                        </div>
                        
                         {!orderData && (
                            <Button type="submit" className="w-full" disabled={!selectedItem}>
                                <Gift className="mr-2 h-4 w-4" />
                                Continuar con el Regalo
                            </Button>
                        )}
                    </CardContent>
                </form>

                {orderData && selectedItem && (
                    <CardContent>
                       <div className="mt-6 border-t pt-6 text-center">
                            <h3 className="text-lg font-semibold mb-2">Resumen del Regalo</h3>
                            <p><span className="font-medium">Para:</span> {orderData.recipientEmail}</p>
                            <p><span className="font-medium">Producto:</span> {selectedItem.name}</p>
                            {orderData.message && <p className="mt-2 text-muted-foreground italic">"{orderData.message}"</p>}
                            
                            <div className="mt-6">
                                {isPurchasing ? (
                                     <div className="flex justify-center items-center h-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                     </div>
                                ) : isFree ? (
                                    <Button className="w-full" onClick={handleFreeGift}>
                                        <Gift className="mr-2 h-4 w-4" />
                                        Enviar Regalo Gratis
                                    </Button>
                                ) : (
                                    <>
                                        <p className="mb-4 text-center text-lg">Total a pagar: <span className="font-bold text-primary">{selectedItem.price.toFixed(2)} {selectedItem.currency}</span></p>
                                        <PayPalButtons
                                            key={selectedItem.id} // Re-render paypal buttons when item changes
                                            style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                                            createOrder={createOrder}
                                            onApprove={onApprove}
                                            onError={onError}
                                        />
                                    </>
                                )}
                                <Button variant="link" onClick={() => setOrderData(null)} className="mt-2">Cambiar detalles</Button>
                            </div>
                       </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
