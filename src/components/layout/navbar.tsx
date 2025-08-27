
"use client";

import Link from "next/link";
import { Gamepad2, LogOut, ShieldCheck, User, Store, Book, Settings, ShoppingCart, LayoutDashboard, Gift } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const navItems = [
    { href: "/normativas", label: "Normativas", icon: Book },
    { href: "/tienda", label: "Tienda", icon: ShoppingCart },
  ];
  
  if (user?.role === 'admin' || user?.role === 'owner') {
      navItems.push({ href: "/admin", label: "Admin", icon: LayoutDashboard });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container mx-auto flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Image src="https://i.imgur.com/3wRmQ5l.png" alt="Logo" width={32} height={32} />
          <span className="font-bold sm:inline-block">Statehills Roleplay</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "transition-colors hover:text-primary flex items-center gap-2",
                pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {loading ? (
            <div className="h-8 w-20 bg-muted/50 rounded-md animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || ''} alt={user.username || 'Usuario'} />
                    <AvatarFallback>{user.username ? user.username.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile"><User className="mr-2 h-4 w-4" />Mi Perfil</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/tienda"><ShoppingCart className="mr-2 h-4 w-4" />Tienda</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/tienda/regalar"><Gift className="mr-2 h-4 w-4" />Regalar</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/normativas"><Book className="mr-2 h-4 w-4" />Normativas</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/appeals"><ShieldCheck className="mr-2 h-4 w-4" />Apelaciones</Link>
                </DropdownMenuItem>
                {(user.role === 'admin' || user.role === 'owner') && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin"><LayoutDashboard className="mr-2 h-4 w-4" />Admin</Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="sm">
                    <Link href="/register">Register</Link>
                </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
