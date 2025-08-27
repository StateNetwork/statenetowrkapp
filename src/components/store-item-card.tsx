
"use client"

import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { StoreItem } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Tag, Star, Gift, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PayPalButtons, OnApproveData, CreateOrderData } from "@paypal/react-paypal-js";

interface StoreItemCardProps {
  item: StoreItem;
  isOwned: boolean;
}

const currencySymbols = {
  USD: '$',
  EUR: '€',
  MXN: '$',
};

export function StoreItemCard({ item, isOwned }: StoreItemCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isFree = item.price === 0;
  const displayPrice = item.onSale && item.salePrice ? item.salePrice : item.price;
  const originalPrice = item.onSale && item.salePrice ? item.price : null;
  const symbol = currencySymbols[item.currency || 'USD'];
  
  // This function is called when the user clicks the PayPal button.
  const createOrder = (data: CreateOrderData, actions: any) => {
    console.log("Creating order for:", item.name);
    return actions.order.create({
      purchase_units: [
        {
          description: item.name,
          amount: {
            currency_code: item.currency || 'USD',
            value: displayPrice.toFixed(2),
          },
        },
      ],
    });
  };

  const grantItemToUser = async (orderId?: string) => {
     if (!user) {
        throw new Error("Usuario no encontrado.");
      }

      // Check if user already owns the item one last time before granting
      const packagesRef = collection(db, `users/${user.uid}/packages`);
      const existingPackagesSnap = await getDocs(packagesRef);
      const ownedItemIds = new Set(existingPackagesSnap.docs.map(doc => doc.data().id as string));
      if (ownedItemIds.has(item.id)) {
        toast({ title: "Ya tienes este paquete", description: "No puedes comprar el mismo paquete dos veces.", variant: "destructive" });
        return;
      }

      const itemRef = doc(db, "storeItems", item.id);
      const itemSnap = await getDoc(itemRef);

      if (!itemSnap.exists()) {
          throw new Error("El producto ya no existe.");
      }
      
      const purchaseData: any = {
        ...itemSnap.data(),
        id: item.id, // Ensure the original item ID is stored
        purchaseDate: serverTimestamp(),
      }

      if(orderId){
        purchaseData.paypalOrderId = orderId;
      }

      await addDoc(packagesRef, purchaseData);
      
      toast({
        title: isFree ? "¡Paquete reclamado!" : "¡Compra exitosa!",
        description: `${item.name} ha sido añadido a tu perfil.`,
      });
      setDialogOpen(false);
      router.push('/profile');
      router.refresh(); // Refresh the page to update owned status
  }

  // This function is called after the user approves the payment on PayPal.
  const onApprove = async (data: OnApproveData, actions: any) => {
    setIsPurchasing(true);
    toast({ title: "Procesando pago...", description: "Por favor espera mientras verificamos tu compra." });

    try {
      console.log("Payment approved. Order ID:", data.orderID);

      const capture = await actions.order.capture();
      console.log("Payment captured:", capture);
      if(capture.status !== 'COMPLETED') {
        throw new Error("El pago no fue completado en PayPal.");
      }

      await grantItemToUser(data.orderID);

    } catch (error: any) {
       console.error("Purchase error:", error);
       toast({
        title: "Error en la compra",
        description: error.message || "No se pudo completar la compra. Contacta a soporte.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const onFreeClaim = async () => {
    setIsPurchasing(true);
    try {
        await grantItemToUser();
    } catch(error: any) {
        console.error("Free claim error:", error);
        toast({
            title: "Error al reclamar",
            description: error.message || "No se pudo añadir el paquete a tu cuenta.",
            variant: "destructive",
        });
    } finally {
        setIsPurchasing(false);
    }
  }

  const onError = (err: any) => {
    console.error("PayPal Error:", err);
    toast({
      title: "Error de PayPal",
      description: "Ocurrió un error al procesar el pago. Inténtalo de nuevo.",
      variant: "destructive",
    });
     setIsPurchasing(false);
  };


  const handleBuyClick = () => {
    if (isOwned) return;
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para comprar o reclamar items.",
        variant: "destructive",
      });
      router.push('/login');
      return;
    }
    setDialogOpen(true);
  }

  return (
    <>
      <Card className="flex flex-col h-full w-full max-w-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-border/50 hover:border-primary/50 relative bg-card/80 backdrop-blur-sm">
        {isOwned && (
             <div className="absolute top-2 left-2 z-10">
                <Badge variant="success" className="gap-1 border-green-500/50 text-white">
                    <CheckCircle className="h-3 w-3"/>
                    Obtenido
                </Badge>
            </div>
        )}
        {item.featured && !isOwned && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="secondary" className="gap-1 border-primary/50 text-primary">
              <Star className="h-3 w-3"/>
              Destacado
            </Badge>
          </div>
        )}
        <CardHeader className="p-0">
          <div className="relative h-56 w-full cursor-pointer group" onClick={handleBuyClick}>
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
             {isOwned && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <p className="text-white font-bold text-lg">Ya tienes este paquete</p>
                </div>
             )}
            {!isOwned && (
                 <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <p className="text-white font-bold">Ver Detalles</p>
                </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-lg font-bold mb-2 truncate">{item.name}</CardTitle>
          <CardDescription className="text-sm h-10 overflow-hidden text-ellipsis">{item.description.split('\n')[0]}</CardDescription>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="flex flex-col">
              {originalPrice && !isFree && (
                <span className="text-sm text-muted-foreground line-through">
                  {symbol}{originalPrice.toFixed(2)}
                </span>
              )}
              <p className="text-xl font-semibold text-primary">
                  {isFree ? "Gratis" : `${symbol}${displayPrice.toFixed(2)}`}
              </p>
          </div>
           {item.onSale && !isFree && <Badge variant="destructive"><Tag className="mr-1 h-3 w-3" />Oferta</Badge>}
           {isFree && !isOwned && <Badge variant="success"><Gift className="mr-1 h-3 w-3" />Gratis</Badge>}
        </CardFooter>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl bg-card/80 backdrop-blur-md">
            <div className="grid md:grid-cols-2 gap-6 items-start">
                <div className="relative aspect-video rounded-md overflow-hidden">
                    <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="flex flex-col h-full max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl mb-2 text-glow">{item.name}</DialogTitle>
                    </DialogHeader>
                    <div className="pr-4 flex-grow">
                      <ReactMarkdown 
                          className="prose prose-sm prose-invert max-w-none text-foreground/90 prose-headings:text-glow prose-strong:text-primary"
                          remarkPlugins={[remarkGfm]}
                      >
                          {item.description}
                      </ReactMarkdown>
                    </div>
                    <div className="mt-auto pt-4 border-t border-border">
                        
                        {isPurchasing ? (
                          <div className="flex justify-center items-center h-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : isFree ? (
                             <>
                                <p className="mb-4 text-center text-lg">Este paquete es <span className="font-bold text-success">Gratis</span></p>
                                <Button className="w-full" onClick={onFreeClaim}>
                                    <Gift className="mr-2 h-4 w-4" />
                                    Obtener Gratis
                                </Button>
                             </>
                        ) : (
                            <>
                                <p className="mb-4 text-center text-lg">Total a pagar: <span className="font-bold text-primary">{symbol}{displayPrice.toFixed(2)} {item.currency}</span></p>
                                <PayPalButtons
                                    style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                                    createOrder={createOrder}
                                    onApprove={onApprove}
                                    onError={onError}
                                    forceReRender={[item]}
                                />
                                <p className="text-xs text-muted-foreground mt-2 text-center">Serás redirigido a PayPal para completar el pago de forma segura.</p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
