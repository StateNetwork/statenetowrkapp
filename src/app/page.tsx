
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Award, Heart, Rocket } from 'lucide-react';
import { Card } from '@/components/ui/card';

const features = [
  {
    icon: <Rocket className="h-10 w-10 text-primary" />,
    title: 'Rendimiento Óptimo',
    description: 'Experimenta un juego fluido sin lag gracias a nuestros servidores de última generación.',
  },
  {
    icon: <Award className="h-10 w-10 text-primary" />,
    title: 'Comunidad Activa',
    description: 'Únete a una comunidad amigable y activa, con eventos y actividades constantes.',
  },
  {
    icon: <Heart className="h-10 w-10 text-primary" />,
    title: 'Soporte Dedicado',
    description: 'Nuestro equipo de administradores está siempre disponible para ayudarte con cualquier problema.',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <section className="relative w-full h-[70vh] md:h-[80vh] flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
        <div className="relative z-20 flex flex-col items-center justify-center text-white p-4">
          <h1 className="text-4xl md:text-7xl font-bold tracking-tighter mb-4 text-shadow-lg">
            Bienvenido a Statehills Roleplay
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-8 text-shadow">
            La experiencia de rol definitiva que estabas esperando.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-lg">
              <Link href="/tienda">¡Juega Ahora!</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="text-lg">
              <Link href="/normativas">Normativas</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="w-full py-12 md:py-24 container">
        <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tight">¿Por qué Statehills?</h2>
            <p className="mt-2 text-lg text-muted-foreground">
                Descubre las características que nos hacen únicos.
            </p>
        </div>
        <div className="mx-auto grid items-start gap-12 sm:max-w-4xl md:grid-cols-3">
          {features.map((feature) => (
             <Card key={feature.title} className="grid gap-4 text-center p-6 rounded-lg transition-colors border border-transparent hover:border-primary/50">
              <div className="flex justify-center items-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="w-full py-12 md:py-24">
       <Card className="container grid items-center justify-center gap-4 px-4 text-center md:px-6 py-12">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              ¿Listo para unirte a la aventura?
            </h2>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Explora mundos, construye imperios y forja tu leyenda en Statehills Roleplay.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm space-y-2">
             <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 text-lg">
              <Link href="/register">Empezar Ahora</Link>
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
