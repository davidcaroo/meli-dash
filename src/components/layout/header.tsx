'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Header() {
  const { setTheme } = useTheme();
  const pathname = usePathname();
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  const getTitle = () => {
    switch (pathname) {
      case '/': return 'Dashboard Principal';
      case '/productos': return 'Gestión de Productos';
      case '/ordenes': return 'Ventas y Órdenes';
      case '/mensajes': return 'Centro de Mensajes';
      case '/logs': return 'Logs de Sistema (n8n)';
      default: return 'Dashboard';
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-40">
      <h2 className="text-xl font-semibold tracking-tight">
        {getTitle()}
      </h2>
      
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end text-[10px] text-muted-foreground mr-2">
          <span>Última actualización</span>
          <span className="font-mono">{lastUpdated}</span>
        </div>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleRefresh}
          title="Actualizar datos"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Claro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Oscuro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
