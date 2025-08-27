
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  query,
  orderBy,
  deleteField,
} from 'firebase/firestore';
import type { User, StoreItem, RuleCategory, TermsOfUse, Appeal, RuleContentBlock } from '@/lib/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileEdit, PlusCircle, Trash2, Loader2, Save, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';


// Schemas for form validation
const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  price: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number().nonnegative("El precio no puede ser negativo.")),
  currency: z.enum(['USD', 'EUR', 'MXN'], { required_error: "La moneda es requerida."}),
  description: z.string().min(1, "La descripción es requerida."),
  terms: z.string().min(1, "Los términos son requeridos."),
  type: z.string().min(1, "El tipo es requerido."),
  image: z.string().url("Debe ser una URL de imagen válida."),
  onSale: z.boolean().optional(),
  salePrice: z.preprocess((a) => (a !== null && a !== '') ? parseFloat(z.string().parse(a)) : undefined, z.number().nonnegative("El precio de oferta no puede ser negativo.").optional().nullable()),
  featured: z.boolean().optional(),
}).refine(data => !data.onSale || (data.onSale && data.salePrice !== undefined && data.salePrice !== null), {
    message: "El precio de oferta es requerido si el producto está en oferta.",
    path: ["salePrice"],
});


const ruleSchema = z.object({
    title: z.string().min(1, "El título es requerido."),
    description: z.string().min(1, "La descripción es requerida."),
    image: z.string().url("Debe ser una URL de imagen válida."),
});

const termsSchema = z.object({
    content: z.string().min(50, "Los términos deben tener al menos 50 caracteres."),
});

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-[#5865F2]"
    {...props}
  >
    <path d="M20.317 4.36981C18.699 3.50417 16.942 2.92058 15.097 2.6511C15.029 2.78587 14.962 2.92058 14.884 3.0553C13.537 2.58697 12.101 2.34246 10.619 2.34246C9.13603 2.34246 7.69901 2.58697 6.36301 3.0553C6.28501 2.92058 6.21701 2.78587 6.14901 2.6511C4.30401 2.92058 2.54701 3.50417 0.929014 4.36981C0.215014 6.64319 0.0000143135 8.98402 0.254014 11.292C1.69101 12.3195 3.08401 13.1174 4.43101 13.6858C4.81901 13.5174 5.18801 13.3092 5.54601 13.081C5.46801 13.0013 5.39001 12.9215 5.32301 12.8317C4.16701 12.2332 3.12001 11.5352 2.22701 10.7473C2.27201 10.5391 2.32801 10.3309 2.38401 10.1227C2.88801 10.4801 3.42101 10.8176 3.98201 11.1252C5.36201 11.6638 6.78601 12.0113 8.24901 12.1604C8.24901 12.1604 8.25801 12.1604 8.26701 12.1604C8.42301 12.0807 8.57901 11.9909 8.72401 11.8912C8.87901 11.7914 9.02301 11.6916 9.16801 11.5819C10.63001 12.3499 12.24701 12.7274 13.929 12.7274C15.611 12.7274 17.228 12.3499 18.69 11.5819C18.835 11.6916 18.979 11.7914 19.124 11.8912C19.269 11.9909 19.425 12.0807 19.581 12.1604C21.054 12.0113 22.488 11.6638 23.868 11.1252C24.429 10.8176 24.962 10.4801 25.466 10.1227C25.522 10.3309 25.578 10.5391 25.623 10.7473C24.72 11.5352 23.684 12.2332 22.528 12.8317C22.45 12.9215 22.372 13.0013 22.294 13.081C22.652 13.3092 23.021 13.5174 23.409 13.6858C24.766 13.1174 26.159 12.3095 27.596 11.292C27.918 8.79491 27.42 6.34781 26.19 4.36981C24.529 3.50417 22.75 2.92058 20.905 2.6511C20.973 2.78587 21.041 2.92058 21.119 3.0553C19.783 2.58697 18.347 2.34246 16.864 2.34246C15.381 2.34246 13.944 2.58697 12.608 3.0553C12.686 2.92058 12.754 2.78587 12.822 2.6511C13.257 2.70094 13.692 2.77073 14.127 2.86047C14.127 2.86047 14.127 2.86047 14.127 2.86047ZM9.85101 9.42152C9.00601 9.42152 8.31001 8.71558 8.31001 7.85994C8.31001 7.00431 9.00601 6.29837 9.85101 6.29837C10.696 6.29837 11.392 7.00431 11.392 7.85994C11.392 8.71558 10.696 9.42152 9.85101 9.42152ZM17.971 9.42152C17.126 9.42152 16.43 8.71558 16.43 7.85994C16.43 7.00431 17.126 6.29837 17.971 6.29837C18.816 6.29837 19.512 7.00431 19.512 7.85994C19.512 8.71558 18.816 9.42152 17.971 9.42152Z"/>
  </svg>
);


function ProductDialog({ children, product, onSave }: { children: React.ReactNode, product?: StoreItem, onSave: () => void }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const { register, handleSubmit, reset, control, watch, formState: { errors, isSubmitting } } = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: product ? {
            ...product,
            price: String(product.price),
            salePrice: product.salePrice ? String(product.salePrice) : null,
        } : {
            name: '',
            price: '0.00',
            currency: 'USD',
            description: '',
            terms: '',
            type: '',
            image: 'https://picsum.photos/400/300',
            onSale: false,
            featured: false,
            salePrice: null,
        },
    });
    
    const onSale = watch('onSale');

    useEffect(() => {
        if (open) {
            const defaultValues = product ? {
                ...product,
                price: String(product.price),
                salePrice: product.salePrice ? String(product.salePrice) : null,
            } : {
                name: '',
                price: '0.00',
                currency: 'USD',
                description: '',
                terms: '',
                type: '',
                image: 'https://picsum.photos/400/300',
                onSale: false,
                featured: false,
                salePrice: null,
            };
            reset(defaultValues);
        }
    }, [open, product, reset]);


    const onSubmit = async (data: z.infer<typeof productSchema>) => {
        try {
            const dataToSave: Partial<StoreItem> = {
                ...data,
                price: parseFloat(data.price as any),
                salePrice: data.onSale && data.salePrice ? parseFloat(data.salePrice as any) : deleteField(),
                featured: data.featured
            };

            if (!data.onSale) {
                 delete dataToSave.salePrice;
            }


            if (product) {
                const productRef = doc(db, 'storeItems', product.id);
                await updateDoc(productRef, dataToSave);
                toast({ title: "Producto actualizado", description: "El producto se ha actualizado correctamente." });
            } else {
                await addDoc(collection(db, 'storeItems'), dataToSave);
                toast({ title: "Producto creado", description: "El nuevo producto se ha añadido a la tienda." });
            }
            onSave();
            setOpen(false);
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "No se pudo guardar el producto.", variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{product ? 'Editar Producto' : 'Añadir Producto'}</DialogTitle>
                    <DialogDescription>{product ? 'Edita los detalles del producto.' : 'Rellena los detalles del nuevo producto.'}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <Input {...register("name")} placeholder="Nombre del producto" />
                        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
                        
                        <Input {...register("type")} placeholder="Tipo de producto (ej: Vehículo)" />
                        {errors.type && <p className="text-destructive text-sm">{errors.type.message}</p>}
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Input {...register("price")} type="number" step="0.01" placeholder="Precio" />
                                {errors.price && <p className="text-destructive text-sm">{errors.price.message}</p>}
                            </div>
                            <div>
                                <Controller
                                    name="currency"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Moneda" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="USD">USD ($)</SelectItem>
                                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                                <SelectItem value="MXN">MXN ($)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.currency && <p className="text-destructive text-sm">{errors.currency.message}</p>}
                            </div>
                        </div>

                        <Textarea {...register("description")} placeholder="Descripción (compatible con Markdown)" rows={6} />
                        {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}

                        <Textarea {...register("terms")} placeholder="Términos y condiciones" rows={4} />
                        {errors.terms && <p className="text-destructive text-sm">{errors.terms.message}</p>}

                        <Input {...register("image")} placeholder="URL de la imagen" />
                        {errors.image && <p className="text-destructive text-sm">{errors.image.message}</p>}
                        
                        <div className="flex items-center space-x-2">
                           <Controller name="onSale" control={control} render={({ field }) => <Switch id="onSale" checked={field.value} onCheckedChange={field.onChange} />} />
                           <Label htmlFor="onSale">En oferta</Label>
                        </div>

                        {onSale && (
                            <div>
                               <Input {...register("salePrice")} type="number" step="0.01" placeholder="Precio de Oferta" />
                               {errors.salePrice && <p className="text-destructive text-sm">{errors.salePrice.message}</p>}
                           </div>
                        )}

                        <div className="flex items-center space-x-2">
                           <Controller name="featured" control={control} render={({ field }) => <Switch id="featured" checked={field.value} onCheckedChange={field.onChange} />} />
                           <Label htmlFor="featured">Destacado</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function RuleDialog({ children, rule, onSave }: { children: React.ReactNode, rule?: RuleCategory, onSave: () => void }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof ruleSchema>>({
        resolver: zodResolver(ruleSchema),
        defaultValues: rule || {
            title: '',
            description: '',
            image: 'https://picsum.photos/600/400',
        },
    });

     useEffect(() => {
        if (open) {
            reset(rule || {
                title: '',
                description: '',
                image: 'https://picsum.photos/600/400',
            });
        }
    }, [open, rule, reset]);

    const onSubmit = async (data: z.infer<typeof ruleSchema>) => {
        try {
            if (rule) {
                const ruleRef = doc(db, 'ruleCategories', rule.id);
                // We only update the basic info here. Content is edited on the page itself.
                await updateDoc(ruleRef, data);
                toast({ title: "Normativa actualizada", description: "La normativa se ha actualizado correctamente." });
            } else {
                 const initialContent: RuleContentBlock[] = [
                    { id: Date.now().toString(), type: 'heading', content: 'Título de la Normativa' },
                    { id: (Date.now() + 1).toString(), type: 'paragraph', content: 'Este es un párrafo de ejemplo. Puedes editarlo o eliminarlo.' }
                ];
                await addDoc(collection(db, 'ruleCategories'), { ...data, content: initialContent });
                toast({ title: "Normativa creada", description: "La nueva normativa se ha añadido." });
            }
            onSave();
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo guardar la normativa.", variant: "destructive" });
        }
    };


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{rule ? 'Editar Normativa' : 'Añadir Normativa'}</DialogTitle>
                    <DialogDescription>{rule ? 'Edita los detalles de la normativa.' : 'Rellena los detalles de la nueva normativa.'}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <Input {...register("title")} placeholder="Título" />
                        {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}

                        <Textarea {...register("description")} placeholder="Descripción corta" />
                        {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}

                        <Input {...register("image")} placeholder="URL de la imagen" />
                        {errors.image && <p className="text-destructive text-sm">{errors.image.message}</p>}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function TermsOfUseEditor({ onSave, terms }: { onSave: () => void, terms: TermsOfUse | null }) {
    const { toast } = useToast();
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof termsSchema>>({
        resolver: zodResolver(termsSchema),
        defaultValues: { content: terms?.content || '' },
    });

    useEffect(() => {
        reset({ content: terms?.content || '' });
    }, [terms, reset]);

    const onSubmit = async (data: z.infer<typeof termsSchema>) => {
        try {
            // There's only one terms document, with a fixed ID
            const termsRef = doc(db, 'siteContent', 'termsOfUse');
            await setDoc(termsRef, data);
            toast({ title: "Términos actualizados", description: "Los términos de uso de la tienda se han guardado." });
            onSave();
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudieron guardar los términos de uso.", variant: "destructive" });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Términos de Uso de la Tienda</CardTitle>
                <CardDescription>Edita el texto que los usuarios deben aceptar antes de entrar a la tienda.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent>
                    <Textarea {...register("content")} rows={15} placeholder="Escribe aquí los términos y condiciones..." />
                    {errors.content && <p className="text-sm text-destructive mt-2">{errors.content.message}</p>}
                </CardContent>
                <CardContent>
                     <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Términos
                    </Button>
                </CardContent>
            </form>
        </Card>
    );
}

const appealStatusTranslations: { [key in Appeal['status']]: string } = {
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
};

function AppealsTab({ appeals, onUpdate, onDelete }: { appeals: Appeal[], onUpdate: () => void, onDelete: (id: string) => void }) {
    const { toast } = useToast();

    const handleStatusChange = async (appealId: string, status: Appeal['status']) => {
        try {
            const appealRef = doc(db, 'appeals', appealId);
            await updateDoc(appealRef, { status });
            toast({ title: 'Apelación actualizada', description: `La apelación ha sido marcada como ${appealStatusTranslations[status]}.` });
            onUpdate();
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'No se pudo actualizar la apelación.', variant: 'destructive' });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Apelaciones de Sanciones</CardTitle>
                <CardDescription>Revisa y gestiona las apelaciones enviadas por los usuarios.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Tipo Sanción</TableHead>
                            <TableHead className="hidden md:table-cell">Enviada</TableHead>
                             <TableHead>Estado</TableHead>
                            <TableHead><span className="sr-only">Acciones</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appeals.map((appeal) => (
                            <TableRow key={appeal.id}>
                                <TableCell>
                                    <div className="font-medium">{appeal.username}</div>
                                    <div className="text-sm text-muted-foreground">{appeal.userEmail}</div>
                                </TableCell>
                                <TableCell><Badge variant="secondary">{appeal.sanctionType}</Badge></TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {appeal.submittedAt ? formatDistanceToNow(appeal.submittedAt.toDate(), { addSuffix: true, locale: es }) : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={appeal.status === 'pending' ? 'default' : appeal.status === 'approved' ? 'success' : 'destructive'}>
                                        {appealStatusTranslations[appeal.status]}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                 <Button variant="outline" size="sm">Ver Detalles</Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>Detalles de la Apelación</DialogTitle>
                                                    <DialogDescription>De: {appeal.username} ({appeal.userEmail})</DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="font-semibold">Motivo de la Sanción:</div>
                                                    <p className="text-sm p-3 bg-muted rounded-md">{appeal.reason}</p>
                                                    <div className="font-semibold">Texto de la Apelación:</div>
                                                    <p className="text-sm p-3 bg-muted rounded-md whitespace-pre-wrap">{appeal.appealText}</p>
                                                </div>
                                                 <DialogFooter className="sm:justify-between">
                                                    <div className="flex gap-2">
                                                         <Button variant="success" onClick={() => handleStatusChange(appeal.id, 'approved')}><CheckCircle className="mr-2 h-4 w-4"/>Aprobar</Button>
                                                        <Button variant="destructive" onClick={() => handleStatusChange(appeal.id, 'rejected')}><XCircle className="mr-2 h-4 w-4"/>Rechazar</Button>
                                                    </div>
                                                    <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                        <DeleteConfirmationDialog onConfirm={() => onDelete(appeal.id)}>
                                             <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                        </DeleteConfirmationDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

const roleColors: Record<User['role'], 'default' | 'secondary' | 'destructive'> = {
    user: 'secondary',
    admin: 'default',
    owner: 'destructive'
};

function DeleteConfirmationDialog({ onConfirm, children }: { onConfirm: () => void, children: React.ReactNode }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás absolutely seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el elemento de la base de datos.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Continuar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


export default function AdminPage() {
    const { user: authUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
    const [ruleCategories, setRuleCategories] = useState<RuleCategory[]>([]);
    const [terms, setTerms] = useState<TermsOfUse | null>(null);
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersSnapshot, itemsSnapshot, rulesSnapshot, appealsSnapshot, termsSnap] = await Promise.all([
                getDocs(collection(db, "users")),
                getDocs(collection(db, "storeItems")),
                getDocs(collection(db, "ruleCategories")),
                getDocs(query(collection(db, "appeals"), orderBy("submittedAt", "desc"))),
                getDoc(doc(db, 'siteContent', 'termsOfUse'))
            ]);

            const usersList = await Promise.all(usersSnapshot.docs.map(async (userDoc) => {
                const userData = userDoc.data() as User;
                const packagesSnapshot = await getDocs(collection(db, `users/${userDoc.id}/packages`));
                const packages = packagesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as StoreItem));
                return { ...userData, id: userDoc.id, packages };
            }));
            setUsers(usersList);

            setStoreItems(itemsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as StoreItem)));
            setRuleCategories(rulesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as RuleCategory)));
            setAppeals(appealsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Appeal)));

            if (termsSnap.exists()) {
                setTerms({ id: termsSnap.id, ...termsSnap.data() } as TermsOfUse);
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ title: "Error de Carga", description: "No se pudieron cargar los datos desde Firestore.", variant: "destructive" });
        }
        setLoading(false);
    };

    useEffect(() => {
        if (authLoading) return;
        if (!authUser || (authUser.role !== 'admin' && authUser.role !== 'owner')) {
             toast({ title: "Acceso denegado", description: "No tienes permiso para ver esta página.", variant: "destructive" });
             router.push('/');
             return;
        }
        fetchData();
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authUser, authLoading, router]);

    const handleDeleteProduct = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'storeItems', id));
            toast({ title: 'Producto eliminado', description: 'El producto se ha eliminado correctamente.' });
            fetchData();
        } catch (error) {
            console.error("Error deleting product:", error);
            toast({ title: 'Error', description: 'No se pudo eliminar el producto.', variant: 'destructive' });
        }
    }

    const handleDeleteRule = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'ruleCategories', id));
            toast({ title: 'Normativa eliminada', description: 'La normativa se ha eliminado correctamente.' });
            fetchData();
        } catch (error) {
            console.error("Error deleting rule:", error);
            toast({ title: 'Error', description: 'No se pudo eliminar la normativa.', variant: 'destructive' });
        }
    }
    
    const handleDeleteAppeal = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'appeals', id));
            toast({ title: 'Apelación eliminada', description: 'La apelación se ha eliminado correctamente.' });
            fetchData();
        } catch (error) {
            console.error("Error deleting appeal:", error);
            toast({ title: 'Error', description: 'No se pudo eliminar la apelación.', variant: 'destructive' });
        }
    }

    const handleRoleChange = async (userId: string, newRole: User['role']) => {
        if (!authUser || authUser.role !== 'owner') {
            toast({ title: 'No autorizado', description: 'No tienes permisos para cambiar roles.', variant: 'destructive' });
            return;
        }

        if (authUser.id === userId) {
            toast({ title: 'Acción no permitida', description: 'No puedes cambiar tu propio rol.', variant: 'destructive' });
            return;
        }

        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { role: newRole });
            toast({ title: 'Rol actualizado', description: `El rol del usuario ha sido cambiado a ${newRole}.` });
            fetchData();
        } catch (error) {
            console.error("Error updating role:", error);
            toast({ title: 'Error', description: 'No se pudo actualizar el rol del usuario.', variant: 'destructive' });
        }
    }
    
    if (authLoading || loading || !authUser || (authUser.role !== 'admin' && authUser.role !== 'owner')) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-14rem)]">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }


    return (
        <div className="container mx-auto py-12 md:py-16">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline">Panel de Administrador</CardTitle>
                    <CardDescription>Gestiona el contenido de Statehills Roleplay.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="products">
                        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-5">
                            <TabsTrigger value="products">Productos</TabsTrigger>
                            <TabsTrigger value="rules">Normativas</TabsTrigger>
                            <TabsTrigger value="appeals">Apelaciones</TabsTrigger>
                            <TabsTrigger value="terms">Términos</TabsTrigger>
                            <TabsTrigger value="users">Usuarios</TabsTrigger>
                        </TabsList>
                        <TabsContent value="products">
                            <Card>
                                <CardHeader className="flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Productos de la Tienda</CardTitle>
                                        <CardDescription>Añade, edita o elimina productos.</CardDescription>
                                    </div>
                                    <ProductDialog onSave={fetchData}>
                                        <Button size="sm" className="gap-1">
                                            <PlusCircle className="h-3.5 w-3.5" />
                                            Añadir Producto
                                        </Button>
                                    </ProductDialog>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="hidden w-[100px] sm:table-cell">Imagen</TableHead>
                                                <TableHead>Nombre</TableHead>
                                                <TableHead>Tipo</TableHead>
                                                <TableHead>Precio</TableHead>
                                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {storeItems.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <Image alt={item.name} className="aspect-square rounded-md object-cover" height="64" src={item.image} width="64" />
                                                    </TableCell>
                                                    <TableCell className="font-medium">{item.name}</TableCell>
                                                    <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                                                    <TableCell>{item.price.toFixed(2)} {item.currency}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <ProductDialog product={item} onSave={fetchData}>
                                                                <Button size="icon" variant="ghost"><FileEdit className="h-4 w-4" /></Button>
                                                            </ProductDialog>
                                                             <DeleteConfirmationDialog onConfirm={() => handleDeleteProduct(item.id)}>
                                                                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                            </DeleteConfirmationDialog>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                         <TabsContent value="rules">
                            <Card>
                                <CardHeader className="flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Normativas del Servidor</CardTitle>
                                        <CardDescription>Añade, edita o elimina normativas.</CardDescription>
                                    </div>
                                     <RuleDialog onSave={fetchData}>
                                        <Button size="sm" className="gap-1">
                                            <PlusCircle className="h-3.5 w-3.5" />
                                            Añadir Normativa
                                        </Button>
                                    </RuleDialog>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Categoría</TableHead>
                                                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ruleCategories.map((rule) => (
                                                <TableRow key={rule.id}>
                                                    <TableCell className="font-medium">{rule.title}</TableCell>
                                                    <TableCell className="hidden md:table-cell max-w-xs truncate">{rule.description}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <RuleDialog rule={rule} onSave={fetchData}>
                                                                <Button size="icon" variant="ghost"><FileEdit className="h-4 w-4" /></Button>
                                                            </RuleDialog>
                                                            <DeleteConfirmationDialog onConfirm={() => handleDeleteRule(rule.id)}>
                                                                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                            </DeleteConfirmationDialog>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                         <TabsContent value="appeals">
                            <AppealsTab appeals={appeals} onUpdate={fetchData} onDelete={handleDeleteAppeal} />
                        </TabsContent>
                         <TabsContent value="terms">
                            <TermsOfUseEditor terms={terms} onSave={fetchData} />
                        </TabsContent>
                        <TabsContent value="users">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Usuarios Registrados</CardTitle>
                                    <CardDescription>Lista de todos los usuarios y sus paquetes comprados.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Usuario</TableHead>
                                                <TableHead>Rol</TableHead>
                                                <TableHead>Paquetes Comprados</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-4">
                                                            <Image src={user.avatar || `https://picsum.photos/seed/${user.id}/100/100`} alt={user.username} width={40} height={40} className="rounded-full"/>
                                                            <div>
                                                                <div className="font-medium">{user.username}</div>
                                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                                                {user.discordUsername && <div className="flex items-center gap-1 text-xs text-muted-foreground"><DiscordIcon className="h-3 w-3" /> {user.discordUsername}</div>}
                                                                {user.minecraftUsername && <div className="text-xs text-muted-foreground">Minecraft: {user.minecraftUsername}</div>}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                       {authUser?.role === 'owner' && authUser.id !== user.id ? (
                                                           <Select
                                                                defaultValue={user.role}
                                                                onValueChange={(newRole) => handleRoleChange(user.id, newRole as User['role'])}
                                                            >
                                                                <SelectTrigger className="w-[120px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="user">Usuario</SelectItem>
                                                                    <SelectItem value="admin">Admin</SelectItem>
                                                                    <SelectItem value="owner">Dueño</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                       ) : (
                                                          <Badge variant={roleColors[user.role] || 'secondary'} className="capitalize">{user.role}</Badge>
                                                       )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.packages && user.packages.length > 0 ? user.packages.map(p => (
                                                                <Badge key={p.id} variant="secondary">{p.name}</Badge>
                                                            )) : <span className="text-sm text-muted-foreground">Ninguno</span>}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
