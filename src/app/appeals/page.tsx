
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const appealSchema = z.object({
  sanctionType: z.enum(['ban', 'warn', 'mute', 'permaban', 'otro'], {
    required_error: "Debes seleccionar un tipo de sanción.",
  }),
  reason: z.string().min(10, "La razón debe tener al menos 10 caracteres.").max(200, "Máximo 200 caracteres."),
  appealText: z.string().min(50, "Tu apelación debe tener al menos 50 caracteres.").max(2000, "Máximo 2000 caracteres."),
});

type AppealFormValues = z.infer<typeof appealSchema>;

export default function AppealsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AppealFormValues>({
    resolver: zodResolver(appealSchema),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);


  const onSubmit = async (data: AppealFormValues) => {
    if (!user) {
        toast({ title: "Error", description: "Debes estar conectado para apelar.", variant: "destructive"});
        return;
    }

    try {
      await addDoc(collection(db, 'appeals'), {
        userId: user.uid,
        username: user.username,
        userEmail: user.email,
        status: 'pending',
        submittedAt: serverTimestamp(),
        ...data,
      });
      toast({
        title: "Apelación Enviada",
        description: "Hemos recibido tu apelación. Un administrador la revisará pronto.",
      });
      router.push('/profile');
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al enviar",
        description: "No se pudo enviar tu apelación. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };
  
  if (authLoading || !user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-14rem)]">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16">
       <Card className="max-w-2xl mx-auto bg-card/80">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="text-2xl">Enviar una Apelación</CardTitle>
            <CardDescription>
              Si crees que una sanción fue injusta, completa el formulario.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
                <Label htmlFor="sanctionType">Tipo de Sanción</Label>
                 <Controller
                    name="sanctionType"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="sanctionType">
                                <SelectValue placeholder="Selecciona el tipo de sanción..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ban">Baneo Temporal</SelectItem>
                                <SelectItem value="permaban">Baneo Permanente</SelectItem>
                                <SelectItem value="mute">Silencio (Mute)</SelectItem>
                                <SelectItem value="warn">Advertencia (Warn)</SelectItem>
                                <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.sanctionType && <p className="text-sm text-destructive">{errors.sanctionType.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Motivo de la sanción (si lo conoces)</Label>
              <Input id="reason" placeholder="Ej: Uso de vocabulario inapropiado" {...register('reason')} />
              {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
            </div>
             <div className="grid gap-2">
              <Label htmlFor="appealText">Tu descargo</Label>
              <Textarea id="appealText" rows={8} placeholder="Explica detalladamente por qué consideras que la sanción es incorrecta..." {...register('appealText')} />
              {errors.appealText && <p className="text-sm text-destructive">{errors.appealText.message}</p>}
            </div>
          </CardContent>
          <CardContent>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Apelación
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
