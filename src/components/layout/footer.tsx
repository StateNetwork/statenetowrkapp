import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Gamepad2 className="h-6 w-6 text-primary" />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Statehills Roleplay. Todos los derechos reservados.
          </p>
        </div>
        <nav className="flex gap-4 sm:gap-6">
          <Link href="/normativas" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Normativas
          </Link>
          <Link href="/tienda" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Tienda
          </Link>
          <Link href="/admin" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Admin
          </Link>
        </nav>
      </div>
    </footer>
  );
}
