
'use client';

import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import type { StoreItem, User } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { setCookie } from 'cookies-next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck, FileEdit, Save, ExternalLink, Camera, Gamepad2, LogOut, Link, Link2Off } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';

const profileSchema = z.object({
    username: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
    minecraftUsername: z.string().optional(),
});

const avatarSchema = z.object({
  avatar: z.string().url("Debe ser una URL de imagen válida."),
});

function AvatarDialog({ children, onSave }: { children: React.ReactNode, onSave: (url: string) => void }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof avatarSchema>>({
        resolver: zodResolver(avatarSchema),
        defaultValues: { avatar: '' },
    });

    const onSubmit = async (data: z.infer<typeof avatarSchema>) => {
        onSave(data.avatar);
        setOpen(false);
        toast({ title: "Avatar actualizado", description: "Tu foto de perfil se ha cambiado." });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Cambiar Avatar</DialogTitle>
                    <DialogDescription>Pega la URL de tu nueva imagen de perfil.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <Input {...register("avatar")} placeholder="https://ejemplo.com/imagen.png" />
                        {errors.avatar && <p className="text-destructive text-sm">{errors.avatar.message}</p>}
                        <p className="text-xs text-muted-foreground">Puedes subir una imagen a un servicio como Imgur y pegar el enlace aquí.</p>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Avatar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

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


function ProfilePageContent() {
  const { user, loading: authLoading, logout, setUser: setAuthUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [packages, setPackages] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
        username: '',
        minecraftUsername: ''
    }
  });
  
  const fetchUserData = async (uid: string) => {
    try {
        setLoading(true);
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data() as User;
            setUserInfo(userData);
            reset({
                username: userData.username,
                minecraftUsername: userData.minecraftUsername || '',
            });

            // Update auth context if Discord linking updated the avatar
             if(user && userData.avatar !== user.avatar) {
                setAuthUser({ ...user, avatar: userData.avatar });
            }
        }

        const packagesSnapshot = await getDocs(collection(db, `users/${uid}/packages`));
        const packagesList = packagesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as StoreItem));
        setPackages(packagesList);
    } catch (error) {
        console.error("Error fetching user data:", error);
    } finally {
        setLoading(false);
    }
};

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    
    const discordStatus = searchParams.get('discord');
    if(discordStatus === 'linked') {
        toast({ title: "Discord Vinculado", description: "Tu cuenta de Discord ha sido vinculada con éxito."});
        router.replace('/profile', { scroll: false });
    } else if (discordStatus === 'error') {
        toast({ title: "Error de vinculación", description: "No se pudo vincular tu cuenta de Discord.", variant: 'destructive'});
        router.replace('/profile', { scroll: false });
    }
    
    fetchUserData(user.uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);
  
  const onProfileUpdate = async (data: z.infer<typeof profileSchema>) => {
    if (!user) return;
    try {
        const userRef = doc(db, 'users', user.uid);
        const dataToUpdate = {
             username: data.username,
             minecraftUsername: data.minecraftUsername || deleteField(),
        };
        await updateDoc(userRef, dataToUpdate);
        const updatedData = { ...userInfo!, ...dataToUpdate };
        setUserInfo(updatedData);
        if (user) {
           setAuthUser({ ...user, ...updatedData });
        }
        toast({ title: "Perfil Actualizado", description: "Tus datos han sido actualizados."});
        setIsEditing(false);
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "No se pudo actualizar tu perfil.", variant: "destructive"});
    }
  }

  const onAvatarUpdate = async (avatarUrl: string) => {
    if (!user) return;
     try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { avatar: avatarUrl });
        const updatedData = { ...userInfo!, avatar: avatarUrl };
        setUserInfo(updatedData);
        if (user) {
            setAuthUser({ ...user, avatar: avatarUrl });
        }
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "No se pudo actualizar tu avatar.", variant: "destructive"});
    }
  }

  const handleLinkDiscord = () => {
    if (!user) return;
    // Set a cookie that the server-side callback can read
    setCookie('discord_user_id', user.uid, { maxAge: 60 * 5 }); // 5 minute expiry
    
    const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    const REDIRECT_URI = `${baseUrl}/discord/callback`;
    
    if(!DISCORD_CLIENT_ID) {
        toast({ title: 'Función no configurada', description: 'La integración con Discord no ha sido configurada por el administrador.', variant: 'destructive' });
        return;
    }

    const scope = 'identify email';
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    
    window.location.href = authUrl;
  };


  const handleUnlinkDiscord = async () => {
    if (!user) return;
     try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { 
            discordUsername: deleteField(),
            discordId: deleteField() 
        });
        const updatedData = { ...userInfo!};
        delete updatedData.discordUsername;
        delete (updatedData as any).discordId;
        setUserInfo(updatedData);
        if (user) {
           const authUserCopy = {...user};
           delete authUserCopy.discordUsername;
           delete (authUserCopy as any).discordId;
           setAuthUser(authUserCopy);
        }
        toast({ title: "Discord Desvinculado", description: "Tu cuenta de Discord ha sido desvinculada."});
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "No se pudo desvincular tu cuenta de Discord.", variant: "destructive"});
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-14rem)]">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }
  
  if (!userInfo) {
     return (
        <div className="container mx-auto py-12 md:py-16 text-center">
            <p className="text-lg text-muted-foreground mb-4">No se pudo cargar la información del perfil.</p>
             <Button onClick={() => router.push('/')}>Volver al Inicio</Button>
        </div>
     )
  }

  return (
    <div className="container mx-auto py-12 md:py-16">
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="md:col-span-1">
            <Card className="sticky top-24">
                <form onSubmit={handleSubmit(onProfileUpdate)}>
                    <CardHeader className="items-center text-center">
                        <div className="relative group">
                           <Avatar className="h-24 w-24 mb-4">
                             <AvatarImage src={userInfo.avatar || ''} alt={userInfo.username} />
                             <AvatarFallback>{userInfo.username.charAt(0).toUpperCase()}</AvatarFallback>
                           </Avatar>
                           <AvatarDialog onSave={onAvatarUpdate}>
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Camera className="h-8 w-8 text-white" />
                                </div>
                           </AvatarDialog>
                        </div>
                       {isEditing ? (
                            <div className='w-full px-4'>
                                <Label htmlFor='username' className='sr-only'>Nombre de usuario</Label>
                                <Input id="username" {...register("username")} className="text-center text-2xl font-bold h-11" />
                                {errors.username && <p className="text-sm text-destructive mt-2">{errors.username.message}</p>}
                           </div>
                       ) : (
                        <CardTitle className="text-3xl font-bold">{userInfo.username}</CardTitle>
                       )}
                       <CardDescription className="text-lg">{userInfo.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 px-4">
                         <div className="space-y-4">
                            <Separator />
                             <div className='space-y-2'>
                                <Label>Cuentas Vinculadas</Label>
                                <div className="p-3 rounded-md bg-muted/50 space-y-3">
                                    {/* Discord */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <DiscordIcon className="h-5 w-5" />
                                            <span className="text-sm">{userInfo.discordUsername || <span className="text-muted-foreground">No vinculado</span>}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {userInfo.discordUsername ? (
                                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={handleUnlinkDiscord}><Link2Off className="h-4 w-4"/></Button>
                                            ) : (
                                                <Button type="button" variant="outline" size="sm" onClick={handleLinkDiscord}>
                                                    <Link className="mr-2"/>
                                                    Vincular
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    {/* Minecraft */}
                                    <div className="flex items-center gap-2">
                                        <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                                        {isEditing ?
                                            <Input id="minecraftUsername" {...register("minecraftUsername")} placeholder="Steve" className="h-8"/> :
                                            <span className="text-sm">{userInfo.minecraftUsername || <span className="text-muted-foreground">No establecido</span>}</span>
                                        }
                                    </div>
                                </div>
                            </div>
                         </div>

                        {isEditing ? (
                            <div className="flex flex-col gap-2 mt-4">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2"/>}
                                    Guardar Cambios
                                </Button>
                                <Button variant="ghost" type="button" onClick={() => { setIsEditing(false); reset({ username: userInfo.username, minecraftUsername: userInfo.minecraftUsername || '' });}}>Cancelar</Button>
                            </div>
                        ) : (
                           <Button onClick={() => setIsEditing(true)}><FileEdit className="mr-2"/>Editar Perfil</Button>
                        )}
                        <Separator />
                        <Button variant="ghost" onClick={logout}><LogOut className="mr-2"/>Cerrar Sesión</Button>
                    </CardContent>
                </form>
            </Card>
        </div>
        <div className="md:col-span-2">
           <Card>
                <CardHeader>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-semibold">Mis Paquetes</h3>
                        <Button asChild variant="outline">
                            <a href="/appeals">
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Enviar Apelación
                            </a>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {packages.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {packages.map((item) => (
                        <Card key={item.id} className="flex items-center gap-4 p-4 bg-card">
                            <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                            </div>
                            <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.type}</p>
                            </div>
                        </Card>
                        ))}
                    </div>
                    ) : (
                    <p className="text-muted-foreground text-center py-8">Aún no has comprado ningún paquete. ¡Visita la <a href="/tienda" className="text-primary underline hover:text-primary/80">tienda</a>!</p>
                    )}
                </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}


export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-[calc(100vh-14rem)]"><Loader2 className="h-10 w-10 animate-spin" /></div>}>
            <ProfilePageContent />
        </Suspense>
    )
}
