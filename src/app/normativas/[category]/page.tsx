
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { RuleCategory, RuleContentBlock } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Edit, Save, Trash2, PlusCircle, Heading2, Heading3, Pilcrow, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';


const BlockRenderer = ({ block }: { block: RuleContentBlock }) => {
  switch (block.type) {
    case 'heading':
      return <h2 className="text-3xl font-bold mt-8 mb-4 text-glow border-b border-primary/20 pb-2 break-words">{block.content}</h2>;
    case 'subheading':
      return <h3 className="text-2xl font-bold mt-6 mb-3 text-glow break-words whitespace-pre-wrap">{block.content}</h3>;
    case 'paragraph':
      return <p className="text-lg leading-relaxed mb-4 text-foreground/90 whitespace-pre-wrap break-words">{block.content}</p>;
    case 'image':
      return (
        <div className="relative aspect-video my-6 rounded-lg overflow-hidden card-border-glow">
          <Image src={block.content} alt="Imagen de la normativa" fill className="object-cover" />
        </div>
      );
    default:
      return null;
  }
};

const AddBlockDialog = ({ onAdd }: { onAdd: (type: RuleContentBlock['type']) => void }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full gap-2"><PlusCircle /> Añadir Bloque</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Añadir Nuevo Bloque</DialogTitle>
                    <DialogDescription>Selecciona el tipo de contenido que quieres añadir a la normativa.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                   <DialogClose asChild>
                     <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => onAdd('heading')}>
                         <Heading2 className="h-8 w-8" />
                         <span>Titular</span>
                     </Button>
                   </DialogClose>
                   <DialogClose asChild>
                     <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => onAdd('subheading')}>
                         <Heading3 className="h-8 w-8" />
                         <span>Subtítulo</span>
                     </Button>
                   </DialogClose>
                   <DialogClose asChild>
                     <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => onAdd('paragraph')}>
                         <Pilcrow className="h-8 w-8" />
                         <span>Párrafo</span>
                     </Button>
                   </DialogClose>
                    <DialogClose asChild>
                     <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => onAdd('image')}>
                         <ImageIcon className="h-8 w-8" />
                         <span>Imagen</span>
                     </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    )
}

const EditBlockDialog = ({ block, onUpdate, onDelete, children }: { block: RuleContentBlock, onUpdate: (content: string) => void, onDelete: () => void, children: React.ReactNode }) => {
    const [currentContent, setCurrentContent] = useState(block.content);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const isImage = block.type === 'image';
    const isHeading = block.type === 'heading' || block.type === 'subheading';

    return (
        <>
            <Dialog>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Bloque</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {isImage ? (
                            <Input 
                                value={currentContent} 
                                onChange={(e) => setCurrentContent(e.target.value)}
                                placeholder="https://ejemplo.com/imagen.png"
                            />
                        ) : (
                             <Textarea 
                                value={currentContent} 
                                onChange={(e) => setCurrentContent(e.target.value)}
                                rows={isHeading ? 2 : 10}
                            />
                        )}
                    </div>
                     <DialogFooter className="sm:justify-between">
                         <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4"/>Eliminar Bloque
                         </Button>
                        <div className="flex gap-2">
                            <DialogClose asChild>
                                <Button variant="ghost">Cancelar</Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button onClick={() => onUpdate(currentContent)}>Guardar</Button>
                            </DialogClose>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Seguro que quieres eliminar este bloque?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            onDelete();
                            setIsDeleteDialogOpen(false);
                        }}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}


export default function NormativaCategoryPage() {
  const [rule, setRule] = useState<RuleCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const categoryId = params.category as string;

  const fetchRule = async () => {
    if (!categoryId) return;
    setLoading(true);
    try {
         const ruleRef = doc(db, 'ruleCategories', categoryId);
         const directSnap = await getDoc(ruleRef);
         if (directSnap.exists()) {
           let ruleData = { id: directSnap.id, ...directSnap.data() } as RuleCategory;
           
           if (!Array.isArray(ruleData.content)) {
               const oldContent = (ruleData.content as any) || '';
               ruleData.content = [
                   { id: 'initial-heading', type: 'heading', content: ruleData.title },
                   { id: 'initial-paragraph', type: 'paragraph', content: oldContent as string }
               ];
           }

           setRule(ruleData);
         } else {
           notFound();
         }
    } catch (error) {
      console.error("Error fetching rule:", error);
      notFound();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(categoryId) {
        fetchRule();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);
  
  const handleSave = async (newContent: RuleContentBlock[]) => {
      if (!rule) return;
      try {
          const ruleRef = doc(db, 'ruleCategories', rule.id);
          await updateDoc(ruleRef, { content: newContent });
          setRule(prevRule => prevRule ? { ...prevRule, content: newContent } : null);
          toast({ title: 'Normativa guardada', description: 'Los cambios se han guardado correctamente.' });
      } catch (error) {
          console.error(error);
          toast({ title: 'Error', description: 'No se pudieron guardar los cambios.', variant: 'destructive' });
      }
  }

  const handleAddBlock = (type: RuleContentBlock['type']) => {
      if (!rule || !rule.content) return;
      const newBlock: RuleContentBlock = {
          id: Date.now().toString(),
          type,
          content: type === 'image' ? 'https://picsum.photos/1280/720' : 'Nuevo contenido...'
      };
      const newContent = [...rule.content, newBlock];
      handleSave(newContent);
  }

  const handleUpdateBlock = (blockId: string, newBlockContent: string) => {
      if (!rule || !rule.content) return;
      const newContent = rule.content.map(b => b.id === blockId ? { ...b, content: newBlockContent } : b);
      handleSave(newContent);
  }

  const handleDeleteBlock = (blockId: string) => {
      if (!rule || !rule.content) return;
      const newContent = rule.content.filter(b => b.id !== blockId);
      handleSave(newContent);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-14rem)]">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!rule) {
    return notFound();
  }
  
  const isAdmin = user && (user.role === 'admin' || user.role === 'owner');

  return (
    <div className="flex flex-col flex-grow items-center justify-center py-12 md:py-16 w-full">
      <div className="max-w-4xl mx-auto w-full px-4">
        <div className="mb-8 flex justify-between items-center">
          <Button asChild variant="ghost">
            <Link href="/normativas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Normativas
            </Link>
          </Button>
          {isAdmin && (
            <Button variant={isEditing ? 'destructive' : 'secondary'} onClick={() => setIsEditing(!isEditing)} className="gap-2">
                {isEditing ? <Save/> : <Edit />}
                {isEditing ? 'Terminar Edición' : 'Activar Modo Edición'}
            </Button>
          )}
        </div>
        <Card className="w-full bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold text-glow">{rule.title}</CardTitle>
            <CardDescription className="text-lg">{rule.description}</CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-8 py-6">
             {rule.content?.map((block) => (
                <div key={block.id} className="relative group">
                    <BlockRenderer block={block} />
                    {isEditing && (
                        <div className="absolute top-0 right-0 p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-background/80 rounded-bl-lg flex gap-2">
                           <EditBlockDialog 
                             block={block} 
                             onUpdate={(newContent) => handleUpdateBlock(block.id, newContent)}
                             onDelete={() => handleDeleteBlock(block.id)}
                            >
                             <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                           </EditBlockDialog>
                        </div>
                    )}
                </div>
            ))}
            {isEditing && (
                <div className="mt-8 border-t border-dashed border-primary/30 pt-8">
                    <AddBlockDialog onAdd={handleAddBlock}/>
                </div>
            )}
            {(!rule.content || rule.content.length === 0) && !isEditing && (
                <div className="text-center py-16 text-muted-foreground">
                    <p>Esta normativa aún no tiene contenido.</p>
                    {isAdmin && <p>Activa el modo edición para empezar a añadir bloques.</p>}
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
