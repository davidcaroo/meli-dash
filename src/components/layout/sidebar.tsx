'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  MessageSquare, 
  History,
  Menu,
  X,
  ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

import { useMessagesCount } from '@/hooks/use-messages-count';
import { useShopifyCount } from '@/hooks/use-shopify-count';

const routes = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/',
    color: 'text-sky-500',
  },
  {
    label: 'Productos',
    icon: Package,
    href: '/productos',
    color: 'text-violet-500',
  },
  {
    label: 'Órdenes',
    icon: ShoppingCart,
    href: '/ordenes',
    color: 'text-pink-700',
  },
  {
    label: 'Mensajes',
    icon: MessageSquare,
    href: '/mensajes',
    color: 'text-orange-700',
  },
  {
    label: 'Shopify',
    icon: ShoppingBag,
    href: '/shopify',
    color: 'text-blue-600',
  },
  {
    label: 'Logs',
    icon: History,
    href: '/logs',
    color: 'text-emerald-500',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useMessagesCount();
  const shopifyCount = useShopifyCount();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full w-64 flex-col fixed inset-y-0 z-50 bg-card border-r">
        <div className="px-3 py-4 flex-1">
          <Link href="/" className="flex items-center pl-3 mb-10">
            <h1 className="text-2xl font-bold text-primary">
              MELI <span className="text-yellow-500 font-extrabold">Dash</span>
            </h1>
          </Link>
          <div className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-muted rounded-lg transition relative",
                  pathname === route.href ? "bg-muted text-primary" : "text-muted-foreground"
                )}
              >
                <div className="flex items-center flex-1">
                  <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                  {route.label}
                </div>
                {route.label === 'Mensajes' && unreadCount > 0 && (
                  <span className="absolute right-3 top-3 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
                {route.label === 'Shopify' && shopifyCount > 0 && (
                  <span className="absolute right-3 top-3 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                    {shopifyCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t flex justify-around items-center h-16 px-4">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg transition",
              pathname === route.href ? "text-primary" : "text-muted-foreground"
            )}
          >
            <route.icon className={cn("h-6 w-6", route.color)} />
            <span className="text-[10px] mt-1">{route.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
